import { randomUUID as uuidv4 } from 'crypto'
import { createGame, processAction, handlePlayerRoll, handleBuy, handleUpgrade, handleEndTurn } from './gameManager.js'

const rooms = new Map()

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function createRoom(hostId, hostName) {
  let code
  do { code = generateRoomCode() } while (rooms.has(code))
  const room = {
    id: uuidv4(),
    code,
    hostId,
    players: [{ id: hostId, name: hostName, color: 0, ready: false, connected: true }],
    status: 'waiting',
    gameState: null,
    chatHistory: [],
    activeTrades: [],
    createdAt: Date.now(),
  }
  rooms.set(code, room)
  return room
}

export function getRoom(code) {
  return rooms.get(code?.toUpperCase()) || null
}

export function joinRoom(code, playerId, playerName) {
  const room = rooms.get(code?.toUpperCase())
  if (!room) return { error: 'Комната не найдена' }
  if (room.status !== 'waiting') return { error: 'Игра уже идёт' }
  if (room.players.length >= 4) return { error: 'Комната полная' }
  if (room.players.find((p) => p.id === playerId)) return { error: 'Вы уже в комнате' }

  const usedColors = room.players.map((p) => p.color)
  const colorIdx = [0, 1, 2, 3].find((c) => !usedColors.includes(c))
  room.players.push({ id: playerId, name: playerName, color: colorIdx, ready: false, connected: true })
  return { room }
}

export function leaveRoom(code, playerId) {
  const room = rooms.get(code?.toUpperCase())
  if (!room) return
  room.players = room.players.filter((p) => p.id !== playerId)
  if (room.players.length === 0) {
    rooms.delete(code?.toUpperCase())
    return { deleted: true }
  }
  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id
  }
  return { room }
}

export function startGame(code, playerId) {
  const room = rooms.get(code?.toUpperCase())
  if (!room) return { error: 'Комната не найдена' }
  if (room.hostId !== playerId) return { error: 'Только хост может начать игру' }
  if (room.players.length < 2) return { error: 'Нужно минимум 2 игрока' }

  room.status = 'playing'
  room.gameState = createGame(room.players)
  return { room }
}

export function getRoomGameState(code) {
  const room = rooms.get(code?.toUpperCase())
  if (!room || !room.gameState) return null
  return room.gameState
}

export function handleSocketAction(code, playerId, action, data) {
  const room = rooms.get(code?.toUpperCase())
  if (!room || !room.gameState) return { error: 'Нет активной игры' }

  const gs = room.gameState
  let result

  switch (action) {
    case 'roll_dice':
      result = handlePlayerRoll(gs, playerId)
      break
    case 'buy':
      result = handleBuy(gs, playerId)
      break
    case 'upgrade':
      result = handleUpgrade(gs, playerId, data?.cellId)
      break
    case 'end_turn':
      result = handleEndTurn(gs, playerId)
      break
    case 'trade_offer':
      result = processTrade(gs, playerId, data)
      break
    case 'trade_accept':
      result = processTradeAccept(gs, playerId, data?.tradeId)
      break
    case 'trade_decline':
      result = processTradeDecline(gs, data?.tradeId)
      break
    case 'chat_public':
      result = addChatMessage(room, playerId, 'public', data?.message)
      break
    case 'chat_private':
      result = addChatMessage(room, playerId, 'private', data?.message, data?.toId)
      break
    default:
      return { error: 'Неизвестное действие' }
  }

  if (result?.error) return result
  return { state: room.gameState, chat: result?.chat || null }
}

function addChatMessage(room, senderId, type, message, toId) {
  if (!message || message.trim().length === 0) return { error: 'Пустое сообщение' }
  const sender = room.players.find((p) => p.id === senderId)
  const msg = {
    id: uuidv4(),
    senderId,
    senderName: sender?.name || 'Unknown',
    type,
    toId: toId || null,
    message: message.trim(),
    timestamp: Date.now(),
  }
  room.chatHistory.push(msg)
  if (room.chatHistory.length > 200) room.chatHistory = room.chatHistory.slice(-200)
  return { chat: msg }
}

function processTrade(gs, offererId, data) {
  if (!data?.targetId || !data) return { error: 'Неверные данные обмена' }
  const offerer = gs.players.find((p) => p.id === offererId)
  const target = gs.players.find((p) => p.id === data.targetId)
  if (!offerer || !target) return { error: 'Игрок не найден' }
  if (offerer.isBankrupt || target.isBankrupt) return { error: 'Банкрот не может торговать' }

  const trade = {
    id: uuidv4(),
    offererId,
    targetId: data.targetId,
    offererAssets: data.offererAssets || [],
    offererMoney: data.offererMoney || 0,
    targetAssets: data.targetAssets || [],
    targetMoney: data.targetMoney || 0,
    status: 'pending',
    timestamp: Date.now(),
  }

  for (const asset of trade.offererAssets) {
    if (!gs.cellOwners[asset] || gs.cellOwners[asset] !== offererId) return { error: 'Вы не владеете этим активом' }
  }
  for (const asset of trade.targetAssets) {
    if (!gs.cellOwners[asset] || gs.cellOwners[asset] !== data.targetId) return { error: 'Игрок не владеет этим активом' }
  }
  if (offerer.balance < trade.offererMoney) return { error: 'Недостаточно средств' }
  if (target.balance < trade.targetMoney) return { error: 'У игрока недостаточно средств' }

  gs.activeTrades.push(trade)
  return { trade }
}

function processTradeAccept(gs, accepterId, tradeId) {
  const tradeIdx = gs.activeTrades.findIndex((t) => t.id === tradeId && t.targetId === accepterId && t.status === 'pending')
  if (tradeIdx === -1) return { error: 'Сделка не найдена' }
  const trade = gs.activeTrades[tradeIdx]

  const offerer = gs.players.find((p) => p.id === trade.offererId)
  const target = gs.players.find((p) => p.id === trade.targetId)

  if (offerer.balance < trade.offererMoney || target.balance < trade.targetMoney) {
    return { error: 'Недостаточно средств' }
  }

  offerer.balance -= trade.offererMoney
  target.balance += trade.offererMoney
  target.balance -= trade.targetMoney
  offerer.balance += trade.targetMoney

  for (const asset of trade.offererAssets) {
    gs.cellOwners[asset] = trade.targetId
  }
  for (const asset of trade.targetAssets) {
    gs.cellOwners[asset] = trade.offererId
  }

  trade.status = 'accepted'
  gs.activeTrades.splice(tradeIdx, 1)
  return { success: true }
}

function processTradeDecline(gs, tradeId) {
  const idx = gs.activeTrades.findIndex((t) => t.id === tradeId && t.status === 'pending')
  if (idx !== -1) {
    gs.activeTrades[idx].status = 'declined'
    gs.activeTrades.splice(idx, 1)
  }
  return { success: true }
}

export function removePlayerFromRoom(code, playerId) {
  const room = rooms.get(code?.toUpperCase())
  if (!room) return
  const player = room.players.find((p) => p.id === playerId)
  if (player) player.connected = false
  return room
}

export function reconnectToRoom(code, playerId) {
  const room = rooms.get(code?.toUpperCase())
  if (!room) return null
  const player = room.players.find((p) => p.id === playerId)
  if (player) player.connected = true
  return room
}
