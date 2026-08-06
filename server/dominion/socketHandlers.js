import { createRoom, getRoom, joinRoom, leaveRoom, startGame, handleSocketAction, removePlayerFromRoom, reconnectToRoom } from './roomManager.js'

export function registerSocketHandlers(io) {
  const userSockets = new Map()
  const socketRooms = new Map()

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId
    const username = socket.handshake.auth?.username

    if (!userId || !username) {
      socket.disconnect()
      return
    }

    userSockets.set(userId, socket.id)
    console.log(`[Socket] ${username} connected (${socket.id})`)

    socket.on('room:create', (_, cb) => {
      const room = createRoom(userId, username)
      socket.join(room.code)
      socketRooms.set(socket.id, room.code)
      cb?.({ success: true, room })
    })

    socket.on('room:join', (code, cb) => {
      const result = joinRoom(code, userId, username)
      if (result.error) return cb?.({ error: result.error })
      socket.join(code)
      socketRooms.set(socket.id, code)
      io.to(code).emit('room:updated', result.room)
      cb?.({ success: true, room: result.room })
    })

    socket.on('room:leave', (_, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return
      socket.leave(code)
      socketRooms.delete(socket.id)
      const result = leaveRoom(code, userId)
      if (result?.deleted) return cb?.({ success: true, deleted: true })
      if (result?.room) io.to(code).emit('room:updated', result.room)
      cb?.({ success: true })
    })

    socket.on('room:start', (_, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return cb?.({ error: 'Вы не в комнате' })
      const result = startGame(code, userId)
      if (result.error) return cb?.({ error: result.error })
      io.to(code).emit('game:started', result.room.gameState)
      cb?.({ success: true })
    })

    socket.on('room:state', (_, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return cb?.({ room: null })
      const room = getRoom(code)
      cb?.({ room })
    })

    socket.on('game:action', (action, data, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return cb?.({ error: 'Вы не в комнате' })
      const result = handleSocketAction(code, userId, action, data)
      if (result?.error) return cb?.({ error: result.error })
      if (result?.state) {
        io.to(code).emit('game:updated', result.state)
      }
      if (result?.chat) {
        const room = getRoom(code)
        if (room) {
          const targetSocketId = result.chat.type === 'private' ? userSockets.get(result.chat.toId) : null
          if (targetSocketId) {
            io.to(targetSocketId).emit('chat:message', result.chat)
          }
          if (result.chat.type === 'public') {
            io.to(code).emit('chat:message', result.chat)
          } else {
            socket.emit('chat:message', result.chat)
          }
        }
      }
      cb?.({ success: true })
    })

    socket.on('chat:send', (data, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return
      const result = handleSocketAction(code, userId, 'chat_public', { message: data?.message })
      if (result?.error) return cb?.({ error: result.error })
      if (result?.chat) {
        io.to(code).emit('chat:message', result.chat)
      }
      cb?.({ success: true })
    })

    socket.on('chat:private', (data, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return
      const result = handleSocketAction(code, userId, 'chat_private', { message: data?.message, toId: data?.toId })
      if (result?.error) return cb?.({ error: result.error })
      if (result?.chat) {
        const targetSocketId = userSockets.get(data.toId)
        if (targetSocketId) io.to(targetSocketId).emit('chat:message', result.chat)
        socket.emit('chat:message', result.chat)
      }
      cb?.({ success: true })
    })

    socket.on('chat:typing', (data) => {
      const code = socketRooms.get(socket.id)
      if (!code) return
      const room = getRoom(code)
      if (!room) return
      if (data?.toId) {
        const targetSocketId = userSockets.get(data.toId)
        if (targetSocketId) io.to(targetSocketId).emit('chat:typing', { userId, username })
      } else {
        socket.to(code).emit('chat:typing', { userId, username })
      }
    })

    socket.on('trade:offer', (data, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return cb?.({ error: 'Вы не в комнате' })
      const result = handleSocketAction(code, userId, 'trade_offer', data)
      if (result?.error) return cb?.({ error: result.error })
      if (result?.trade) {
        const room = getRoom(code)
        if (room) {
          io.to(code).emit('trade:offered', result.trade)
          io.to(code).emit('game:updated', room.gameState)
        }
      }
      cb?.({ success: true })
    })

    socket.on('trade:accept', (data, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return cb?.({ error: 'Вы не в комнате' })
      const result = handleSocketAction(code, userId, 'trade_accept', data)
      if (result?.error) return cb?.({ error: result.error })
      const room = getRoom(code)
      if (room) {
        io.to(code).emit('trade:completed', { tradeId: data?.tradeId, result })
        io.to(code).emit('game:updated', room.gameState)
      }
      cb?.({ success: true })
    })

    socket.on('trade:decline', (data, cb) => {
      const code = socketRooms.get(socket.id)
      if (!code) return cb?.({ error: 'Вы не в комнате' })
      handleSocketAction(code, userId, 'trade_decline', data)
      io.to(code).emit('trade:declined', { tradeId: data?.tradeId })
      cb?.({ success: true })
    })

    socket.on('disconnect', () => {
      userSockets.delete(userId)
      const code = socketRooms.get(socket.id)
      if (code) {
        const room = removePlayerFromRoom(code, userId)
        socketRooms.delete(socket.id)
        if (room) {
          socket.to(code).emit('room:updated', room)
          if (room.gameState) {
            room.gameState.players.forEach((p) => {
              if (p.id === userId) p.connected = false
            })
            io.to(code).emit('game:updated', room.gameState)
          }
        }
      }
      console.log(`[Socket] ${username} disconnected`)
    })
  })
}
