import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  startGame as roomStartGame,
  removePlayer,
} from './roomManager.js';
import {
  createGame,
  rollDice,
  buyProperty,
  declineBuy,
  payRent,
  endTurn as gameEndTurn,
  buildHouse,
  buildHotel,
  sellHouse,
  mortgageProperty,
  unmortgageProperty,
  payJailFine,
  useJailCard,
  drawCard,
  executeTrade,
} from './gameManager.js';
import {
  startAuction,
  placeBid as auctionPlaceBid,
  getAuction,
  endAuction,
} from './auctionManager.js';
import {
  createTrade,
  acceptTrade,
  declineTrade,
  counterTrade,
  cancelTrade,
} from './tradeManager.js';
import { supabaseAdmin } from '../monopoly/supabaseAdmin.js';
import { BOARD } from './boardData.js';

export function registerSocketHandlers(io) {
  const socketRooms = new Map();
  const userSockets = new Map();
  const auctionTimers = new Map();

  async function saveChatMessage(roomId, message) {
    if (!supabaseAdmin) return;
    try {
      await supabaseAdmin.from('chat_messages').insert({
        room_id: roomId,
        user_id: message.userId,
        username: message.username,
        message: message.text,
        type: message.type,
        created_at: new Date(message.timestamp).toISOString(),
      });
    } catch (err) {
      console.error('Failed to save chat:', err.message);
    }
  }

  function processGameEvents(roomId, events) {
    if (!events?.length) return;
    for (const event of events) {
      if (!event.message) continue;
      const msg = {
        userId: 'system',
        username: 'System',
        text: event.message,
        type: event.type || 'system',
        timestamp: Date.now(),
      };
      io.to(roomId).emit('game:event', msg);
    }
  }

  function setupAuctionTimer(roomId) {
    if (auctionTimers.has(roomId)) {
      clearTimeout(auctionTimers.get(roomId));
    }
    const timer = setTimeout(() => {
      auctionTimers.delete(roomId);
      const result = endAuction(roomId);
      if (result) {
        io.to(roomId).emit('auction:ended', result);
        if (result.sold && result.winner) {
          const room = getRoom(roomId);
          if (room?.gameState) {
            const buyResult = buyProperty(room.gameState, result.winner, result.cellIndex);
            if (buyResult.success) {
              processGameEvents(roomId, buyResult.events);
              io.to(roomId).emit('game:updated', room.gameState);
            }
          }
        }
      }
    }, 29500);
    auctionTimers.set(roomId, timer);
  }

  function clearAuctionTimer(roomId) {
    if (auctionTimers.has(roomId)) {
      clearTimeout(auctionTimers.get(roomId));
      auctionTimers.delete(roomId);
    }
  }

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const username = socket.username;

    userSockets.set(userId, socket.id);
    console.log(`[Monopoly] ${username} connected (${socket.id})`);

    socket.on('room:create', (data, cb) => {
      // leave any previous room first
      const oldCode = socketRooms.get(socket.id);
      if (oldCode) {
        socket.leave(oldCode);
        socketRooms.delete(socket.id);
        const left = leaveRoom(oldCode, userId);
        if (left && !left.error && !left.deleted) io.to(oldCode).emit('room:updated', left);
      }
      const room = createRoom(userId, username, data?.token);
      socket.join(room.code);
      socketRooms.set(socket.id, room.code);
      cb?.({ success: true, room });
    });

    socket.on('room:join', (payload, cb) => {
      // accepts plain 'CODE' string or { code, token }
      const code = typeof payload === 'string' ? payload : payload?.code;
      const token = typeof payload === 'string' ? undefined : payload?.token;
      if (!code) return cb?.({ error: 'No room code' });

      const existingRoom = getRoom(code);
      if (!existingRoom) return cb?.({ error: 'Room not found' });

      // rejoin support: player already in the room (refresh / reconnect)
      const existingPlayer = existingRoom.players.find((p) => p.id === userId);
      if (existingPlayer) {
        existingPlayer.connected = true;
        if (token) existingPlayer.token = token;
        socket.join(code);
        socketRooms.set(socket.id, code);
        io.to(code).emit('room:updated', existingRoom);
        if (existingRoom.gameState) io.to(code).emit('game:updated', existingRoom.gameState);
        return cb?.({ success: true, room: existingRoom, gameState: existingRoom.gameState || null, rejoined: true });
      }

      const result = joinRoom(code, userId, username, undefined, token);
      if (result.error) return cb?.({ error: result.error });
      socket.join(code);
      socketRooms.set(socket.id, code);
      io.to(code).emit('room:updated', result);
      cb?.({ success: true, room: result });
    });

    socket.on('room:leave', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      socket.leave(code);
      socketRooms.delete(socket.id);
      const result = leaveRoom(code, userId);
      if (result?.deleted) return cb?.({ success: true, deleted: true });
      if (result && !result.error) io.to(code).emit('room:updated', result);
      cb?.({ success: true });
    });

    socket.on('room:start', (_, cb) => {
      try {
        const code = socketRooms.get(socket.id);
        console.log(`[room:start] userId=${userId}, code=${code}`);
        if (!code) return cb?.({ error: 'Not in room' });
        const roomStart = roomStartGame(code, userId);
        if (roomStart.error) {
          console.error(`[room:start] startGame error: ${roomStart.error}`);
          return cb?.({ error: roomStart.error });
        }

        const room = getRoom(code);
        if (!room) return cb?.({ error: 'Room not found' });

        const players = room.players.map((p) => ({
          userId: p.id,
          username: p.name,
          color: p.color,
          token: p.token || '🚗',
        }));
        room.gameState = createGame(players);
        room.gameState.roomId = code;

        console.log(`[room:start] emitting game:started to room ${code}, players=${players.length}`);
        io.to(code).emit('game:started', room.gameState);
        cb?.({ success: true });
      } catch (err) {
        console.error('[room:start] CRASH:', err);
        cb?.({ error: 'Server error: ' + err.message });
      }
    });

    socket.on('room:state', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ room: null });
      cb?.({ room: getRoom(code) });
    });

    socket.on('game:state', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ gameState: null, room: null });
      const room = getRoom(code);
      cb?.({
        gameState: room?.gameState || null,
        room: room ? { code: room.code, hostId: room.hostId, status: room.status, players: room.players } : null,
      });
    });

    socket.on('game:rollDice', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = rollDice(room.gameState);
      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true, dice: result.result });
    });

    socket.on('game:buy', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const player = room.gameState.players.find((p) => p.userId === userId);
      if (!player) return cb?.({ error: 'Player not found' });

      const result = buyProperty(room.gameState, userId, player.position);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:declineBuy', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = declineBuy(room.gameState, userId);
      processGameEvents(code, result.events);

      const player = room.gameState.players.find((p) => p.userId === userId);
      const cell = BOARD[player.position];
      const startPrice = cell ? Math.floor(cell.price / 2) : 10;

      const auctionResult = startAuction(code, player.position, startPrice);
      if (auctionResult.error) {
        io.to(code).emit('game:updated', room.gameState);
        return cb?.({ error: auctionResult.error });
      }

      setupAuctionTimer(code);
      io.to(code).emit('auction:started', auctionResult);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:payRent', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = payRent(room.gameState, userId);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:endTurn', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = gameEndTurn(room.gameState, userId);
      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:buildHouse', (cellIndex, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = buildHouse(room.gameState, userId, cellIndex);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:buildHotel', (cellIndex, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = buildHotel(room.gameState, userId, cellIndex);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:sellHouse', (cellIndex, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = sellHouse(room.gameState, userId, cellIndex);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:mortgage', (cellIndex, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = mortgageProperty(room.gameState, userId, cellIndex);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:unmortgage', (cellIndex, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = unmortgageProperty(room.gameState, userId, cellIndex);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:payJail', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = payJailFine(room.gameState, userId);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:useJailCard', (_, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const result = useJailCard(room.gameState, userId);
      if (!result.success) return cb?.({ error: result.events[0]?.message });

      processGameEvents(code, result.events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('game:drawCard', (type, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      if (!['chance', 'community'].includes(type)) {
        return cb?.({ error: 'Invalid card type' });
      }

      const events = drawCard(room.gameState, type);
      processGameEvents(code, events);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('auction:bid', (amount, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });

      const result = auctionPlaceBid(code, userId, amount);
      if (result.error) return cb?.({ error: result.error });

      clearAuctionTimer(code);
      setupAuctionTimer(code);

      io.to(code).emit('auction:updated', result);
      cb?.({ success: true });
    });

    socket.on('trade:offer', (data, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const { toId, offer, request } = data;
      if (!toId) return cb?.({ error: 'No target player' });

      const trade = createTrade(code, userId, toId, offer || {}, request || {});
      io.to(code).emit('trade:offered', trade);
      cb?.({ success: true, trade });
    });

    socket.on('trade:accept', (data, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });
      const room = getRoom(code);
      if (!room?.gameState) return cb?.({ error: 'No game in progress' });

      const { tradeId } = data;
      const result = acceptTrade(code, tradeId);
      if (result.error) return cb?.({ error: result.error });

      const tradeResult = executeTrade(room.gameState, result);
      if (!tradeResult.success) return cb?.({ error: tradeResult.events[0]?.message });

      processGameEvents(code, tradeResult.events);
      io.to(code).emit('trade:accepted', result);
      io.to(code).emit('game:updated', room.gameState);
      cb?.({ success: true });
    });

    socket.on('trade:decline', (data, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });

      const { tradeId } = data;
      const result = declineTrade(code, tradeId);
      if (result.error) return cb?.({ error: result.error });

      io.to(code).emit('trade:declined', { tradeId });
      cb?.({ success: true });
    });

    socket.on('trade:counter', (data, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });

      const { tradeId, newOffer, newRequest } = data;
      const result = counterTrade(code, tradeId, newOffer || {}, newRequest || {});
      if (result.error) return cb?.({ error: result.error });

      io.to(code).emit('trade:countered', result);
      cb?.({ success: true, trade: result });
    });

    socket.on('trade:cancel', (data, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });

      const { tradeId } = data;
      cancelTrade(code, tradeId);
      cb?.({ success: true });
    });

    socket.on('chat:send', (data, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });

      const msg = {
        userId,
        username,
        text: data?.message || '',
        type: 'public',
        timestamp: Date.now(),
      };

      io.to(code).emit('chat:message', msg);
      saveChatMessage(code, msg);
      cb?.({ success: true });
    });

    socket.on('chat:private', (data, cb) => {
      const code = socketRooms.get(socket.id);
      if (!code) return cb?.({ error: 'Not in room' });

      const { toId, message } = data;
      if (!toId) return cb?.({ error: 'No target player' });

      const msg = {
        userId,
        username,
        text: message || '',
        toId,
        type: 'private',
        timestamp: Date.now(),
      };

      const targetSocketId = userSockets.get(toId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('chat:message', msg);
      }
      socket.emit('chat:message', msg);
      saveChatMessage(code, msg);
      cb?.({ success: true });
    });

    socket.on('chat:typing', (data) => {
      const code = socketRooms.get(socket.id);
      if (!code) return;

      if (data?.toId) {
        const targetSocketId = userSockets.get(data.toId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('chat:typing', { userId, username });
        }
      } else {
        socket.to(code).emit('chat:typing', { userId, username });
      }
    });

    socket.on('disconnect', () => {
      userSockets.delete(userId);
      const code = socketRooms.get(socket.id);
      if (code) {
        const room = removePlayer(code, userId);
        socketRooms.delete(socket.id);
        if (room) {
          io.to(code).emit('room:updated', room);
          if (room.gameState) {
            const player = room.gameState.players.find((p) => p.userId === userId);
            if (player) player.connected = false;
            io.to(code).emit('game:updated', room.gameState);
          }
        }
      }
      console.log(`[Monopoly] ${username} disconnected`);
    });
  });
}
