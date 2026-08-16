import { useState, useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getMonopolySocket, waitConnected } from '../services/monopolySocket'

export const ROOM_CODE_KEY = 'xAura:monopolyRoom'
export const TOKENS = ['🚗', '🎩', '🐕', '🚀']

export default function MonopolyLobby() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [room, setRoom] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem('xAura:monopolyToken') || TOKENS[0])
  const [copied, setCopied] = useState(false)

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
      s.on('game:started', (gs) => {
        if (gs?.roomId) localStorage.setItem(ROOM_CODE_KEY, gs.roomId)
        navigate('/monopoly/game', { state: { gameState: gs, room: { code: gs?.roomId } } })
      })
      s.on('error', (msg) => setError(typeof msg === 'string' ? msg : msg?.message || 'Ошибка'))

      const onConnect = () => { setConnected(true); setError('') }
      const onDisconnect = () => setConnected(false)
      const onConnectError = (err) => {
        setConnected(false)
        setError(err?.message === 'Invalid token' ? 'Сессия истекла — войдите заново' : 'Нет соединения с игровым сервером')
      }
      s.on('connect', onConnect)
      s.on('disconnect', onDisconnect)
      s.on('connect_error', onConnectError)

      waitConnected(s, 8000)
        .then(() => { if (!cancelled) s.emit('room:state', null, (res) => { if (res?.room) setRoom(res.room) }) })
        .catch(() => {})
    }
    init()
    return () => {
      cancelled = true
      if (s) {
        s.off('room:updated'); s.off('game:started'); s.off('error')
        s.off('connect'); s.off('disconnect'); s.off('connect_error')
      }
    }
  }, [user, navigate])

  const emitWithConnect = useCallback(async (event, payload) => {
    if (!socket) throw new Error('Нет соединения с игровым сервером')
    await waitConnected(socket, 8000)
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Сервер не отвечает — попробуйте ещё раз')), 8000)
      socket.emit(event, payload, (res) => { clearTimeout(t); resolve(res) })
    })
  }, [socket])

  const createRoom = useCallback(async () => {
    setBusy(true); setError('')
    localStorage.setItem('xAura:monopolyToken', token)
    try {
      const res = await emitWithConnect('room:create', { token })
      if (res?.error) setError(res.error)
      else if (res?.room) setRoom(res.room)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [emitWithConnect, token])

  const joinRoom = useCallback(async () => {
    if (!joinCode.trim()) return
    setBusy(true); setError('')
    localStorage.setItem('xAura:monopolyToken', token)
    try {
      const res = await emitWithConnect('room:join', { code: joinCode.trim().toUpperCase(), token })
      if (res?.error) setError(res.error === 'Room not found' ? 'Комната не найдена — проверьте код' : res.error)
      else if (res?.room) setRoom(res.room)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [emitWithConnect, joinCode, token])

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(ROOM_CODE_KEY)
    socket?.emit('room:leave', null, () => setRoom(null))
  }, [socket])

  const startGame = useCallback(() => {
    socket?.emit('room:start', null, (res) => { if (res?.error) setError(res.error) })
  }, [socket])

  const copyCode = useCallback(() => {
    if (!room?.code) return
    navigator.clipboard.writeText(room.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }, [room?.code])

  const isHost = room && user && room.hostId === user.id

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-5 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Войдите для игры</h2>
          <button onClick={() => navigate('/login')} className="btn-primary btn-shine">Войти</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
                <span className="text-text">xAura </span>
                <span className="text-neon-400">Monopoly</span>
              </h1>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border"
                style={{
                  color: connected ? '#00CC88' : '#FF6688',
                  borderColor: connected ? 'rgba(0,204,136,0.25)' : 'rgba(255,51,102,0.25)',
                  background: connected ? 'rgba(0,204,136,0.06)' : 'rgba(255,51,102,0.06)',
                }}
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: connected ? '#00CC88' : '#FF6688' }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                {connected ? 'на связи' : 'нет соединения'}
              </span>
            </div>
            <p className="text-sm text-text-muted">Классическая экономическая игра · 2–4 игрока</p>
          </div>
        </motion.div>

        {!room ? (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Token picker */}
              <div className="rounded-2xl p-6 sm:p-8 bg-surface-1 border border-neon-400/10">
                <h2 className="font-bold text-lg mb-1" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Ваша фишка</h2>
                <p className="text-xs mb-5 text-text-muted">Выберите токен, которым будете играть</p>
                <div className="flex gap-3">
                  {TOKENS.map((t) => (
                    <motion.button
                      key={t}
                      onClick={() => setToken(t)}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors"
                      style={{
                        background: token === t ? 'rgba(187,243,81,0.12)' : 'rgba(10,10,10,0.6)',
                        border: token === t ? '2px solid #BBF351' : '2px solid #1A1A1A',
                        boxShadow: token === t ? '0 0 20px -4px rgba(187,243,81,0.4)' : 'none',
                      }}
                      aria-pressed={token === t}
                    >
                      {t}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-6 sm:p-8 bg-surface-1 border border-neon-400/10">
                  <h2 className="font-bold text-lg mb-1" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Создать комнату</h2>
                  <p className="text-xs mb-5 text-text-muted">Создайте игру и пригласите друзей по коду</p>
                  <button onClick={createRoom} disabled={busy || !connected} className="btn-primary btn-shine disabled:opacity-40 w-full">
                    {busy ? 'Создание...' : 'Создать комнату'}
                  </button>
                </div>

                <div className="rounded-2xl p-6 sm:p-8 bg-surface-1 border border-neon-400/10">
                  <h2 className="font-bold text-lg mb-1" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Присоединиться</h2>
                  <p className="text-xs mb-5 text-text-muted">Введите 6-значный код комнаты</p>
                  <div className="flex gap-3 items-center">
                    <input
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && joinCode.length === 6) joinRoom() }}
                      placeholder="КОД"
                      maxLength={6}
                      className="input flex-1 uppercase tracking-widest text-center font-mono text-lg"
                    />
                    <button onClick={joinRoom} disabled={busy || !connected || joinCode.length < 6} className="btn-primary btn-shine disabled:opacity-40">Войти</button>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-center py-3 px-4 rounded-xl" style={{ color: '#FF6688', background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)' }}>
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
                      <button onClick={copyCode} className="text-xs transition-colors" style={{ color: copied ? '#00CC88' : '#707070' }}>
                        {copied ? '✓ скопировано' : 'копировать'}
                      </button>
                    </div>
                  </div>
                  <button onClick={leaveRoom} className="text-xs text-text-muted hover:text-danger transition-colors">Покинуть</button>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-medium mb-3 text-text-muted">Игроки ({room.players.length}/4)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {room.players.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-2 border border-neon-400/10"
                      >
                        <motion.span
                          className="text-xl"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        >
                          {p.token || '🚗'}
                        </motion.span>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                        {room.hostId === p.id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-600/10 text-neon-400 border border-neon-600/20">Хост</span>}
                      </motion.div>
                    ))}
                    {Array.from({ length: 4 - room.players.length }).map((_, i) => (
                      <motion.div
                        key={`e-${i}`}
                        className="flex items-center justify-center px-4 py-3 rounded-xl border border-dashed"
                        style={{ borderColor: 'rgba(187,243,81,0.1)' }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                      >
                        <span className="text-xs text-text-muted/50">Ожидание игрока...</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {isHost ? (
                  <button onClick={startGame} className="btn-primary btn-shine w-full">Начать игру</button>
                ) : (
                  <p className="text-xs text-center text-text-muted">Ожидание начала от хоста...</p>
                )}
                {isHost && room.players.length < 2 && (
                  <p className="text-[11px] text-center mt-3 text-text-muted">Можно начать и одному — друзья могут присоединиться по коду во время игры</p>
                )}
                {error && <p className="text-sm text-center mt-3" style={{ color: '#FF6688' }}>{error}</p>}
              </div>
            </motion.div>
          )}
      </div>
    </div>
  )
}
