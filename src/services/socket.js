import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

let socket = null

export function getSocket(userId, username) {
  // Одно соединение на всё приложение: отдаём существующее даже пока оно
  // коннектится, иначе каждый вызов плодил бы параллельные сокеты
  if (socket && !socket.disconnected) return socket
  if (socket) socket.disconnect()

  socket = io(SOCKET_URL, {
    auth: { userId, username },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function emitAsync(event, ...args) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) return reject(new Error('Not connected'))
    const lastArg = args[args.length - 1]
    const cb = typeof lastArg === 'function' ? lastArg : null
    const data = cb ? args.slice(0, -1) : args

    socket.emit(event, ...data, (response) => {
      if (typeof response === 'object' && response !== null) {
        if (response.error) reject(new Error(response.error))
        else resolve(response)
      } else {
        resolve(response)
      }
    })
  })
}
