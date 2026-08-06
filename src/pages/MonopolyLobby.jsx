import { useState, useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getMonopolySocket, disconnectMonopolySocket } from '../services/monopolySocket'

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12']

export default function MonopolyLobby() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [socket, setSocket] = useState(null)
  const [room, setRoom] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (!user) return
    let s
    let cancelled = false
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled || !data?.session?.access_token) return
      s = getMonopolySocket(data.session.access_token)
      if (cancelled) return
      setSocket(s)

      s.off('room:updated')
      s.off('game:started')
      s.off('error')

      s.on('room:updated', (r) => setRoom(r))
      s.on('game:started', (gs) => navigate('/monopoly/game', { state: { gameState: gs } }))
      s.on('error', (msg) => setError(msg))

      s.emit('room:state', null, (res) => { if (res?.room) setRoom(res.room) })
    }
    init()
    return () => { cancelled = true; s?.off('room:updated'); s?.off('game:started'); s?.off('error') }
  }, [user, navigate])

  const createRoom = useCallback(() => {
    if (!socket) return
    setConnecting(true); setError('')
    socket.emit('room:create', null, (res) => {
      setConnecting(false)
      if (res?.error) return setError(res.error)
      if (res?.room) setRoom(res.room)
    })
  }, [socket])

  const joinRoom = useCallback(() => {
    if (!socket || !joinCode.trim()) return
    setConnecting(true); setError('')
    socket.emit('room:join', joinCode.trim().toUpperCase(), (res) => {
      setConnecting(false)
      if (res?.error) return setError(res.error)
      if (res?.room) setRoom(res.room)
    })
  }, [socket, joinCode])

  const leaveRoom = useCallback(() => { socket?.emit('room:leave', null, () => setRoom(null)) }, [socket])
  const startGame = useCallback(() => { socket?.emit('room:start', null, (res) => { if (res?.error) setError(res.error) }) }, [socket])

  const isHost = room && user && room.hostId === user.id

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-5 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Войдите для игры</h2>
          <button onClick={() => navigate('/login')} className="btn-primary">Войти</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              <span className="text-white/90">xAura </span>
              <span className="text-amber-400" style={{ textShadow: '0 0 20px rgba(251,191,36,0.2)' }}>Monopoly</span>
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Классическая экономическая игра · 2–4 игрока</p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!room ? (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>Создать комнату</h2>
                <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>Создайте игру и пригласите друзей по коду</p>
                <button onClick={createRoom} disabled={connecting} className="btn-primary disabled:opacity-40">
                  {connecting ? 'Создание...' : 'Создать комнату'}
                </button>
              </div>

              <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>Присоединиться</h2>
                <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>Введите 6-значный код комнаты</p>
                <div className="flex gap-3 items-center">
                  <input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError('') }} placeholder="Код" maxLength={6} className="input flex-1 max-w-[200px] uppercase tracking-widest text-center font-mono text-lg" />
                  <button onClick={joinRoom} disabled={connecting || joinCode.length < 6} className="btn-primary disabled:opacity-40">Войти</button>
                </div>
              </div>

              {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center py-2">{error}</motion.div>}
            </motion.div>
          ) : (
            <motion.div key="room" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>Комната</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Код:</span>
                      <span className="font-mono text-amber-400 text-sm tracking-widest font-bold">{room.code}</span>
                      <button onClick={() => navigator.clipboard.writeText(room.code)} className="text-white/20 hover:text-white/50 text-xs">копировать</button>
                    </div>
                  </div>
                  <button onClick={leaveRoom} className="text-xs text-white/20 hover:text-red-400 transition-colors">Покинуть</button>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Игроки ({room.players.length}/4)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {room.players.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[p.colorIdx] || p.color }} />
                        <span className="text-sm font-medium flex-1">{p.name}</span>
                        {room.hostId === p.id && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>Хост</span>}
                      </div>
                    ))}
                    {Array.from({ length: 4 - room.players.length }).map((_, i) => (
                      <div key={`e-${i}`} className="flex items-center justify-center px-4 py-3 rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.1)' }}>Ожидание...</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isHost && <button onClick={startGame} className="btn-primary w-full">Начать игру</button>}
                {!isHost && <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>Ожидание начала от хоста...</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
