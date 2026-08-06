import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

let socket = null

export function getMonopolySocket(token) {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })

  socket.on('connect', () => console.log('[Monopoly Socket] Connected'))
  socket.on('disconnect', (reason) => console.log('[Monopoly Socket] Disconnected:', reason))
  socket.on('connect_error', (err) => console.error('[Monopoly Socket] Error:', err.message))

  return socket
}

export function disconnectMonopolySocket() {
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
      } else resolve(response)
    })
  })
}

export function getSocket() {
  return socket
}
