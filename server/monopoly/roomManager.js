const rooms = new Map();

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId, hostName, token) {
  const code = generateCode();
  const room = {
    id: code,
    code,
    hostId,
    players: [{ id: hostId, name: hostName, color: COLORS[0], token: token || '🚗', ready: false, connected: true }],
    status: 'waiting',
    gameState: null,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function joinRoom(code, userId, username, color, token) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'waiting') return { error: 'Game already in progress' };
  if (room.players.length >= 4) return { error: 'Room is full' };
  if (room.players.some(p => p.id === userId)) return { error: 'Already in room' };

  const usedColors = room.players.map(p => p.color);
  const playerColor = color && !usedColors.includes(color) ? color : COLORS.find(c => !usedColors.includes(c));
  if (!playerColor) return { error: 'No colors available' };

  const usedTokens = room.players.map(p => p.token);
  const TOKENS = ['🚗', '🎩', '🐕', '🚀'];
  const playerToken = token && !usedTokens.includes(token) ? token : TOKENS.find(t => !usedTokens.includes(t)) || '🚗';

  const player = { id: userId, name: username, color: playerColor, token: playerToken, ready: false, connected: true };
  room.players.push(player);
  return room;
}

export function leaveRoom(code, userId) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };

  const idx = room.players.findIndex(p => p.id === userId);
  if (idx === -1) return { error: 'Player not in room' };

  room.players.splice(idx, 1);

  if (room.players.length === 0) {
    rooms.delete(code);
    return { deleted: true };
  }

  if (room.hostId === userId) {
    room.hostId = room.players[0].id;
  }

  return room;
}

export function startGame(code, userId) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found' };
  if (room.hostId !== userId) return { error: 'Only the host can start the game' };
  if (room.players.length < 1) return { error: 'Need at least 1 player' };

  room.status = 'playing';
  room.gameState = {
    currentPlayerIndex: 0,
    turnNumber: 1,
    properties: {},
    playerMoney: Object.fromEntries(room.players.map(p => [p.id, 1500])),
    playerPositions: Object.fromEntries(room.players.map(p => [p.id, 0])),
  };

  return room;
}

export function removePlayer(code, userId) {
  const room = rooms.get(code);
  if (!room) return null;

  const player = room.players.find(p => p.id === userId);
  if (!player) return null;

  player.connected = false;
  return room;
}

export function getRoomGameState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  return { status: room.status, gameState: room.gameState, players: room.players };
}
