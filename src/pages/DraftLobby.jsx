import { useState, useContext, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { getSocket } from '../services/socket'
import { loadAnimeData } from '../utils/animeData'
import { Corners, DossierPanel } from '../components/profile/SharedBits'
import Loader from '../components/Loader'

const TEAM_SIZE = 5
const MIN_SEASON_POOL = 15 // меньше — сезон даже не показываем в списке
const SEASON_NAMES = { winter: 'Зима', spring: 'Весна', summer: 'Лето', fall: 'Осень' }

function seasonOf(airedOn) {
  const m = Number(airedOn.split('-')[1])
  if (m <= 3) return 'winter'
  if (m <= 6) return 'spring'
  if (m <= 9) return 'summer'
  return 'fall'
}

function seasonLabel(key) {
  const [y, s] = key.split('_')
  return `${SEASON_NAMES[s] || s} ${y}`
}

function buildSeasons(data) {
  const map = new Map()
  data.forEach((a) => {
    if (a.kind !== 'tv' || !a.aired_on) return
    if (!a.score || Number(a.score) <= 0 || !a.image?.original) return
    if (Number(a.aired_on.slice(0, 4)) < 2015) return
    const key = `${a.aired_on.slice(0, 4)}_${seasonOf(a.aired_on)}`
    map.set(key, (map.get(key) || 0) + 1)
  })
  return [...map.entries()]
    .filter(([, count]) => count >= MIN_SEASON_POOL)
    .sort((a, b) => b[0].localeCompare(a[0]))
}

// Пул для драфта собирается на клиенте хоста — сервер не хранит данные аниме
function buildSeasonPool(data, seasonKey) {
  const [year, season] = seasonKey.split('_')
  return data
    .filter(
      (a) =>
        a.kind === 'tv' &&
        a.aired_on?.startsWith(year + '-') &&
        seasonOf(a.aired_on) === season &&
        Number(a.score) > 0 &&
        a.image?.original &&
        !a.image.original.includes('missing_')
    )
    .map((a) => ({
      id: a.id,
      name: a.name,
      russian: a.russian,
      image: a.image.original,
      score: Number(a.score),
    }))
}

export default function DraftLobby() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [socket, setSocket] = useState(null)
  const [data, setData] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState('')
  const [room, setRoom] = useState(null)
  const roomRef = useRef(null)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [serverOnline, setServerOnline] = useState(false)

  useEffect(() => {
    loadAnimeData()
      .then((d) => {
        setData(d)
        const s = buildSeasons(d)
        setSeasons(s)
        if (s.length) setSelectedSeason(s[0][0])
      })
      .catch(() => setError('Не удалось загрузить данные аниме'))
  }, [])

  useEffect(() => {
    if (!user) return
    const s = getSocket(user.id, user.username)
    setSocket(s)

    // После (ре)коннекта подтягиваем актуальное состояние комнаты — так лобби
    // переживает и запуск страницы, и обрыв связи посреди сессии
    const syncOnline = () => {
      setServerOnline(true)
      s.emit('draft:room:state', null, (res) => {
        if (res?.room) {
          roomRef.current = res.room
          setRoom(res.room)
        }
      })
    }
    const syncOffline = () => setServerOnline(false)
    setServerOnline(s.connected)

    s.on('connect', syncOnline)
    s.on('disconnect', syncOffline)

    s.on('draft:room:updated', (updatedRoom) => {
      roomRef.current = updatedRoom
      setRoom(updatedRoom)
    })

    s.on('draft:started', (draftState, startedRoom) => {
      navigate('/draft/game', { state: { draftState, room: startedRoom || roomRef.current } })
    })

    s.emit('draft:room:state', null, (res) => {
      if (res?.room) {
        roomRef.current = res.room
        setRoom(res.room)
      }
    })

    return () => {
      s.off('connect', syncOnline)
      s.off('disconnect', syncOffline)
      s.off('draft:room:updated')
      s.off('draft:started')
    }
  }, [user, navigate])

  const createRoom = useCallback(() => {
    if (!socket) return
    if (!socket.connected) return setError('Нет соединения с сервером игр — дождись подключения или запусти сервер')
    setBusy(true)
    setError('')
    socket.emit('draft:room:create', { seasonKey: selectedSeason, seasonLabel: seasonLabel(selectedSeason) }, (res) => {
      setBusy(false)
      if (res?.error) return setError(res.error)
      if (res?.room) {
        roomRef.current = res.room
        setRoom(res.room)
      }
    })
  }, [socket, selectedSeason])

  const joinRoom = useCallback(() => {
    if (!socket || joinCode.trim().length < 6) return
    if (!socket.connected) return setError('Нет соединения с сервером игр — дождись подключения или запусти сервер')
    setBusy(true)
    setError('')
    socket.emit('draft:room:join', joinCode.trim().toUpperCase(), (res) => {
      setBusy(false)
      if (res?.error) return setError(res.error)
      if (res?.room) {
        roomRef.current = res.room
        setRoom(res.room)
      }
    })
  }, [socket, joinCode])

  const leaveRoom = useCallback(() => {
    if (!socket) return
    socket.emit('draft:room:leave', null, () => {
      roomRef.current = null
      setRoom(null)
    })
  }, [socket])

  const isHost = room && user && room.hostId === user.id
  const seasonCount = seasons.find(([k]) => k === selectedSeason)?.[1] || 0

  const startDraft = useCallback(() => {
    if (!socket || !room || !data) return
    if (!selectedSeason) return setError('Выбери сезон')
    const pool = buildSeasonPool(data, selectedSeason)
    if (pool.length < room.players.length * TEAM_SIZE) {
      return setError(`В сезоне мало тайтлов: ${pool.length}, нужно минимум ${room.players.length * TEAM_SIZE}`)
    }
    setBusy(true)
    setError('')
    socket.emit('draft:room:start', { pool }, (res) => {
      setBusy(false)
      if (res?.error) setError(res.error)
    })
  }, [socket, room, data, selectedSeason])

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="dossier-note !text-neon-400/75 whitespace-nowrap">ДРАФТ СЕЗОНА / ФЭНТЕЗИ-ЛИГА</span>
        <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/70 via-brand-medium/25 to-transparent" />
        <span className="dossier-note hidden sm:inline">{TEAM_SIZE} ПИКОВ НА ИГРОКА</span>
      </div>

      {!serverOnline && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 border border-amber-400/40 bg-amber-400/10 text-amber-200/90 text-sm cut-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          Сервер игр недоступен — соединение восстановится автоматически
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2.5 border border-[#FF2D78]/40 bg-[#FF2D78]/10 text-[#FF9AB8] text-sm cut-sm">
          {error}
        </motion.div>
      )}

      {!room ? (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Создание */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <DossierPanel>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold">Создать драфт</h2>
                  <Corners />
                </div>
                <div>
                  <label className="dossier-note block mb-2">СЕЗОН ПУЛА</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="w-full bg-surface-1 border border-brand-medium/40 cut-sm px-3 py-2.5 text-text text-sm focus:outline-none focus:border-neon-400/60"
                  >
                    {seasons.map(([key, count]) => (
                      <option key={key} value={key} className="bg-surface-1">
                        {seasonLabel(key)} · {count} тайтлов
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-text-dim font-mono">
                  Игроки по очереди забирают тайтлы сезона в команду. Побеждает сумма рейтингов шикимори команды.
                </p>
                <button
                  onClick={createRoom}
                  disabled={busy || !selectedSeason || !serverOnline}
                  className="w-full px-6 py-3 bg-neon-400 text-black font-display font-bold cut-sm hover:bg-neon-300 transition-colors disabled:opacity-40"
                >
                  {serverOnline ? 'СОЗДАТЬ КОМНАТУ' : 'НЕТ СВЯЗИ С СЕРВЕРОМ'}
                </button>
              </div>
            </DossierPanel>
          </motion.div>

          {/* Вход */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <DossierPanel accent="#00E5FF">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold">Войти по коду</h2>
                  <Corners color="rgba(0,229,255,0.5)" />
                </div>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  maxLength={6}
                  placeholder="ABC234"
                  className="w-full bg-surface-1 border border-brand-medium/40 cut-sm px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-text placeholder:text-text-subtle/40 focus:outline-none focus:border-cyan-400/60"
                />
                <button
                  onClick={joinRoom}
                  disabled={busy || joinCode.length < 6 || !serverOnline}
                  className="w-full px-6 py-3 border border-cyan-400/50 text-cyan-300 font-display font-bold cut-sm hover:bg-cyan-400/10 transition-colors disabled:opacity-40"
                >
                  ПРИСОЕДИНИТЬСЯ
                </button>
              </div>
            </DossierPanel>
          </motion.div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <DossierPanel>
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="dossier-note block">КОД КОМНАТЫ</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(room.code)}
                    className="font-display text-3xl font-bold tracking-[0.25em] text-neon-400 hover:text-neon-300 transition-colors"
                    title="Скопировать код"
                  >
                    {room.code}
                  </button>
                </div>
                <div className="text-right">
                  <span className="dossier-note block">СЕЗОН</span>
                  <span className="font-display font-bold text-text">{room.settings.seasonLabel || '—'}</span>
                </div>
                <button onClick={leaveRoom} className="px-4 py-2 border border-[#FF2D78]/40 text-[#FF9AB8] text-sm cut-sm hover:bg-[#FF2D78]/10 transition-colors">
                  ПОКИНУТЬ
                </button>
              </div>

              {/* Игроки */}
              <div>
                <span className="dossier-note block mb-3">ИГРОКИ ({room.players.length}/6)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {room.players.map((p) => (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 border cut-sm ${
                      p.connected ? 'border-brand-medium/30 bg-surface-1' : 'border-[#FF2D78]/30 bg-surface-1 opacity-60'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${p.connected ? 'bg-neon-400' : 'bg-[#FF2D78]'}`} />
                      <span className="text-sm text-text flex-1">{p.name}</span>
                      {room.hostId === p.id && (
                        <span className="text-[9px] px-2 py-0.5 border border-amber-400/40 text-amber-300 font-mono uppercase">ХОСТ</span>
                      )}
                      {!p.connected && <span className="text-[9px] font-mono text-[#FF9AB8] uppercase">офлайн</span>}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 2 - room.players.length) }).map((_, i) => (
                    <div key={`slot-${i}`} className="flex items-center justify-center px-4 py-3 border border-dashed border-brand-medium/25 cut-sm">
                      <span className="text-xs text-text-subtle font-mono">ожидание…</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Старт */}
              {isHost ? (
                <div className="space-y-3">
                  <button
                    onClick={startDraft}
                    disabled={busy || room.players.length < 2}
                    className="w-full px-6 py-3 bg-neon-400 text-black font-display font-bold cut-sm hover:bg-neon-300 transition-colors disabled:opacity-40"
                  >
                    {room.players.length < 2 ? `ЖДЁМ ИГРОКОВ (нужно ещё ${2 - room.players.length})` : 'НАЧАТЬ ДРАФТ'}
                  </button>
                  <p className="text-xs text-text-subtle font-mono text-center">
                    Пул: {seasonCount} тайтлов · нужно минимум {room.players.length * TEAM_SIZE}
                  </p>
                </div>
              ) : (
                <div className="px-4 py-3 border border-brand-medium/25 bg-surface-1 cut-sm text-center">
                  <span className="text-sm text-text-dim">Ждём, пока хост начнёт драфт…</span>
                </div>
              )}
            </div>
          </DossierPanel>
        </motion.div>
      )}
    </div>
  )
}
