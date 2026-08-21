import { randomUUID } from 'crypto'

// Комнаты драфта живут в памяти процесса — как и в dominion-части.
// Ключ карты — 6-символьный код без неоднозначных символов (O/I/0/1).

const MAX_PLAYERS = 6
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const rooms = new Map() // code -> room

function genCode() {
  let code = ''
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return rooms.has(code) ? genCode() : code
}

export function createRoom(hostId, hostName, settings = {}) {
  const code = genCode()
  const room = {
    id: randomUUID(),
    code,
    hostId,
    players: [{ id: hostId, name: hostName, connected: true }],
    status: 'waiting', // waiting | drafting | finished
    settings: {
      seasonKey: settings.seasonKey || null,
      seasonLabel: settings.seasonLabel || '',
    },
    draftState: null,
    createdAt: Date.now(),
  }
  rooms.set(code, room)
  return room
}

export function joinRoom(code, userId, username) {
  const room = getRoom(code)
  if (!room) return { error: 'Комната не найдена' }

  // reconnect уже сидящего игрока — даже если драфт идёт
  const existing = room.players.find((p) => p.id === userId)
  if (existing) {
    existing.connected = true
    existing.name = username
    return { room }
  }

  if (room.status !== 'waiting') return { error: 'Драфт уже начался' }
  if (room.players.length >= MAX_PLAYERS) return { error: 'Комната заполнена' }

  room.players.push({ id: userId, name: username, connected: true })
  return { room }
}

export function leaveRoom(code, userId) {
  const room = getRoom(code)
  if (!room) return { success: true }

  room.players = room.players.filter((p) => p.id !== userId)
  if (!room.players.length) {
    rooms.delete(room.code)
    return { success: true, deleted: true }
  }
  if (room.hostId === userId) room.hostId = room.players[0].id
  return { success: true }
}

export function getRoom(code) {
  return rooms.get(String(code || '').toUpperCase()) || null
}

// Дисконект во время драфта: игрок остаётся в комнате, но помечается офлайн
export function markDisconnected(code, userId) {
  const room = getRoom(code)
  if (!room) return null
  const p = room.players.find((p) => p.id === userId)
  if (p) p.connected = false
  return room
}
