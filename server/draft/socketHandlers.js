import * as roomManager from './roomManager.js'
import { buildDraftState, pickAnime, randomPick, buildStandings, TEAM_SIZE } from './draftManager.js'

// Все события префиксованы draft:, чтобы не конфликтовать с dominion-хендлерами,
// висящими на том же io и дефолтном namespace.
export function registerDraftHandlers(io) {
  const socketRoom = new Map() // socket.id -> code
  const userRoom = new Map() // userId -> code (reconnect после перезагрузки страницы)

  const findRoomOf = (userId) => {
    const code = userRoom.get(userId)
    return code ? roomManager.getRoom(code) : null
  }

  const finalizeIfDone = (room) => {
    if (room.draftState?.phase === 'done') {
      room.status = 'finished'
      room.draftState.standings = buildStandings(room.draftState, room.players)
    }
  }

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId
    const username = socket.handshake.auth?.username
    if (!userId || !username) return // невалидные дисконектит dominion-хендлер

    socket.on('draft:room:create', (settings, cb = () => {}) => {
      const room = roomManager.createRoom(userId, username, settings)
      socketRoom.set(socket.id, room.code)
      userRoom.set(userId, room.code)
      socket.join(room.code)
      cb({ success: true, room })
    })

    socket.on('draft:room:join', (code, cb = () => {}) => {
      const res = roomManager.joinRoom(code, userId, username)
      if (res.error) return cb({ error: res.error })
      socketRoom.set(socket.id, res.room.code)
      userRoom.set(userId, res.room.code)
      socket.join(res.room.code)
      io.to(res.room.code).emit('draft:room:updated', res.room)
      cb({ success: true, room: res.room })
    })

    socket.on('draft:room:leave', (_, cb = () => {}) => {
      const code = userRoom.get(userId)
      if (code) {
        const res = roomManager.leaveRoom(code, userId)
        socket.leave(code)
        socketRoom.delete(socket.id)
        if (!res.deleted) {
          const room = roomManager.getRoom(code)
          if (room) io.to(code).emit('draft:room:updated', room)
        }
        userRoom.delete(userId)
      }
      cb({ success: true })
    })

    socket.on('draft:room:state', (_, cb = () => {}) => {
      cb({ room: findRoomOf(userId) })
    })

    // Пул собирает клиент хоста из локального anime.json выбранного сезона
    socket.on('draft:room:start', (payload, cb = () => {}) => {
      const room = findRoomOf(userId)
      if (!room) return cb({ error: 'Ты не в комнате' })
      if (room.hostId !== userId) return cb({ error: 'Начать может только хост' })
      if (room.status !== 'waiting') return cb({ error: 'Драфт уже начался' })
      if (room.players.length < 2) return cb({ error: 'Нужно минимум 2 игрока' })

      const pool = (Array.isArray(payload?.pool) ? payload.pool : []).filter(
        (a) => a && a.id != null && (a.name || a.russian)
      )
      if (pool.length < room.players.length * TEAM_SIZE) {
        return cb({ error: 'В этом сезоне слишком мало тайтлов для драфта' })
      }

      room.status = 'drafting'
      room.draftState = buildDraftState(room.players, pool)
      io.to(room.code).emit('draft:started', room.draftState, room)
      cb({ success: true })
    })

    socket.on('draft:pick', ({ animeId }, cb = () => {}) => {
      const room = findRoomOf(userId)
      if (!room?.draftState) return cb({ error: 'Нет активного драфта' })
      const idx = room.players.findIndex((p) => p.id === userId)
      if (idx === -1) return cb({ error: 'Ты не в комнате' })

      const res = pickAnime(room.draftState, idx, animeId)
      if (res.error) return cb({ error: res.error })

      finalizeIfDone(room)
      io.to(room.code).emit('draft:updated', room.draftState)
      cb({ success: true })
    })

    // Хост выбирает случайное аниме за отвалившегося игрока
    socket.on('draft:skip', (_, cb = () => {}) => {
      const room = findRoomOf(userId)
      if (!room?.draftState) return cb({ error: 'Нет активного драфта' })
      if (room.hostId !== userId) return cb({ error: 'Только хост может пропустить ход' })
      if (room.draftState.phase !== 'drafting') return cb({ error: 'Драфт завершён' })
      const idx = room.draftState.order[room.draftState.turn]
      const target = room.players[idx]
      if (!target) return cb({ error: 'Игрок не найден' })
      if (target.connected) return cb({ error: 'Игрок онлайн — пусть выбирает сам' })

      const res = randomPick(room.draftState, idx)
      if (res.error) return cb({ error: res.error })

      finalizeIfDone(room)
      io.to(room.code).emit('draft:updated', room.draftState)
      cb({ success: true })
    })

    socket.on('disconnect', () => {
      const code = socketRoom.get(socket.id)
      socketRoom.delete(socket.id)
      if (!code) return
      const room = roomManager.getRoom(code)
      if (!room) return

      let updated
      if (room.status === 'waiting') {
        const res = roomManager.leaveRoom(code, userId)
        if (res.deleted) {
          userRoom.delete(userId)
          return
        }
        updated = roomManager.getRoom(code)
      } else {
        updated = roomManager.markDisconnected(code, userId)
      }
      if (updated) io.to(code).emit('draft:room:updated', updated)
      if (!roomManager.getRoom(code)?.players.some((p) => p.id === userId)) {
        userRoom.delete(userId)
      }
    })
  })
}
