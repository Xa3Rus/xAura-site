import { useState, useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { getSocket, disconnectSocket } from '../services/socket'
import { PLAYER_COLORS } from '../dominion/gameData'

export default function DominionLobby() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [socket, setSocket] = useState(null)
  const [room, setRoom] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (!user) return
    const s = getSocket(user.id, user.username)
    setSocket(s)

    s.on('room:updated', (updatedRoom) => {
      setRoom(updatedRoom)
    })

    s.on('game:started', (gameState) => {
      navigate('/dominion/game', { state: { gameState, room } })
    })

    s.emit('room:state', null, (res) => {
      if (res?.room) setRoom(res.room)
    })

    return () => {
      s.off('room:updated')
      s.off('game:started')
    }
  }, [user, navigate])

  const createRoom = useCallback(() => {
    if (!socket) return
    setConnecting(true)
    setError('')
    socket.emit('room:create', null, (res) => {
      setConnecting(false)
      if (res?.error) return setError(res.error)
      if (res?.room) setRoom(res.room)
    })
  }, [socket])

  const joinRoom = useCallback(() => {
    if (!socket || !joinCode.trim()) return
    setConnecting(true)
    setError('')
    socket.emit('room:join', joinCode.trim().toUpperCase(), (res) => {
      setConnecting(false)
      if (res?.error) return setError(res.error)
      if (res?.room) setRoom(res.room)
    })
  }, [socket, joinCode])

  const leaveRoom = useCallback(() => {
    if (!socket) return
    socket.emit('room:leave', null, () => {
      setRoom(null)
    })
  }, [socket])

  const startGame = useCallback(() => {
    if (!socket) return
    socket.emit('room:start', null, (res) => {
      if (res?.error) setError(res.error)
    })
  }, [socket])

  const isHost = room && user && room.hostId === user.id

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-5 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Войдите для игры</h2>
          <p className="text-sm mb-6 text-text-muted">Для доступа к Dominion необходимо авторизоваться</p>
          <button onClick={() => navigate('/login')} className="btn-primary btn-shine">Войти</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
              <span className="text-text">xAura </span>
              <span className="text-neon-400">Dominion</span>
            </h1>
            <p className="text-sm text-text-muted">Экономическая настольная игра в аниме-тематике · 2–4 игрока</p>
          </div>
        </motion.div>

        {!room ? (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-2xl p-6 sm:p-8 bg-surface-1 border border-neon-400/10">
                <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Создать комнату</h2>
                <p className="text-xs mb-5 text-text-muted">Создайте новую игру и пригласите друзей по коду</p>
                <button onClick={createRoom} disabled={connecting} className="btn-primary btn-shine disabled:opacity-40">
                  {connecting ? 'Создание...' : 'Создать комнату'}
                </button>
              </div>

              <div className="rounded-2xl p-6 sm:p-8 bg-surface-1 border border-neon-400/10">
                <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Присоединиться</h2>
                <p className="text-xs mb-5 text-text-muted">Введите 6-значный код комнаты</p>
                <div className="flex gap-3 items-center">
                  <input
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                    placeholder="Код комнаты"
                    maxLength={6}
                    className="input flex-1 max-w-[200px] uppercase tracking-widest text-center font-mono text-lg"
                  />
                  <button onClick={joinRoom} disabled={connecting || joinCode.length < 6} className="btn-primary btn-shine disabled:opacity-40">
                    Войти
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-danger text-sm text-center py-2">
                  {error}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="room" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl p-6 sm:p-8 bg-surface-1 border border-neon-400/10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Комната</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted">Код:</span>
                      <span className="font-mono text-neon-400 text-sm tracking-widest font-bold">{room.code}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(room.code) }}
                        className="text-text-muted hover:text-text-secondary text-xs transition-colors"
                      >
                        копировать
                      </button>
                    </div>
                  </div>
                  <button onClick={leaveRoom} className="text-xs text-text-muted hover:text-danger transition-colors">
                    Покинуть
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-medium mb-3 text-text-muted">
                    Игроки ({room.players.length}/4)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {room.players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-2 border border-neon-400/10"
                      >
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PLAYER_COLORS[p.color] }} />
                        <span className="text-sm font-medium flex-1">{p.name}</span>
                        {room.hostId === p.id && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-600/10 text-neon-400 border border-neon-600/20">
                            Хост
                          </span>
                        )}
                        {!p.connected && (
                          <span className="text-[10px] text-danger">Оффлайн</span>
                        )}
                      </div>
                    ))}
                    {Array.from({ length: 4 - room.players.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex items-center justify-center px-4 py-3 rounded-xl border border-dashed border-neon-400/10"
                      >
                        <span className="text-xs text-text-muted/50">Ожидание...</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isHost && room.players.length >= 2 && (
                  <button onClick={startGame} className="btn-primary btn-shine w-full">
                    Начать игру
                  </button>
                )}
                {isHost && room.players.length < 2 && (
                  <p className="text-xs text-center text-text-muted">
                    Подождите ещё хотя бы 1 игрока
                  </p>
                )}
                {!isHost && (
                  <p className="text-xs text-center text-text-muted">
                    Ожидание начала от хоста...
                  </p>
                )}
              </div>
            </motion.div>
          )}
      </div>
    </div>
  )
}
