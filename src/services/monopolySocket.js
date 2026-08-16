import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

let socket = null
let socketToken = null

export function getMonopolySocket(token) {
  // reuse the singleton while it belongs to the same user and is alive
  if (socket && socketToken === token && (socket.connected || socket.active)) return socket

  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  socketToken = token
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  })

  socket.on('connect', () => console.log('[Monopoly Socket] Connected'))
  socket.on('disconnect', (reason) => console.log('[Monopoly Socket] Disconnected:', reason))
  socket.on('connect_error', (err) => console.error('[Monopoly Socket] Error:', err.message))

  return socket
}

export function waitConnected(s, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!s) return reject(new Error('No socket'))
    if (s.connected) return resolve()
    let timer = null
    const onConnect = () => { cleanup(); resolve() }
    const onError = (err) => { cleanup(); reject(err) }
    const cleanup = () => {
      if (timer) clearTimeout(timer)
      s.off('connect', onConnect)
      s.off('connect_error', onError)
    }
    timer = setTimeout(() => { cleanup(); reject(new Error('Connection timeout')) }, timeoutMs)
    s.on('connect', onConnect)
    s.on('connect_error', onError)
  })
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
