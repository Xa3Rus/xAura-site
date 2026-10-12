import { useState, useContext, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getSocket } from '../services/socket'
import { loadAnimeData } from '../utils/animeData'
import Avatar from '../components/Avatar'
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
  const [visibility, setVisibility] = useState('open') // при создании
  const [openRooms, setOpenRooms] = useState([]) // браузер лобби
  const [invitation, setInvitation] = useState(null) // входящее приглашение
  const [inviteModal, setInviteModal] = useState(false)
  const [friends, setFriends] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

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

    s.on('draft:rooms:updated', (rooms) => setOpenRooms(rooms || []))
    s.emit('draft:rooms:list', null, (res) => setOpenRooms(res?.rooms || []))

    s.on('draft:invited', (inv) => setInvitation(inv))

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
      s.off('draft:rooms:updated')
      s.off('draft:invited')
      s.off('draft:started')
    }
  }, [user, navigate])

  const createRoom = useCallback(() => {
    if (!socket) return
    if (!socket.connected) return setError('Нет соединения с сервером игр — дождись подключения или запусти сервер')
    setBusy(true)
    setError('')
    socket.emit('draft:room:create', { seasonKey: selectedSeason, seasonLabel: seasonLabel(selectedSeason), visibility }, (res) => {
      setBusy(false)
      if (res?.error) return setError(res.error)
      if (res?.room) {
        roomRef.current = res.room
        setRoom(res.room)
      }
    })
  }, [socket, selectedSeason, visibility])

  const joinRoom = useCallback((codeArg) => {
    const code = typeof codeArg === 'string' ? codeArg.trim().toUpperCase() : joinCode.trim().toUpperCase()
    if (!socket || code.length < 6) return
    if (!socket.connected) return setError('Нет соединения с сервером игр — дождись подключения или запусти сервер')
    setBusy(true)
    setError('')
    socket.emit('draft:room:join', code, (res) => {
      setBusy(false)
      if (res?.error) return setError(res.error)
      if (res?.room) {
        roomRef.current = res.room
        setRoom(res.room)
        setInvitation(null)
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

  const toggleVisibility = useCallback(() => {
    if (!socket || !room) return
    const next = room.settings.visibility === 'open' ? 'closed' : 'open'
    socket.emit('draft:room:visibility', { visibility: next }, (res) => {
      if (res?.error) setError(res.error)
    })
  }, [socket, room])

  const openInviteModal = useCallback(async () => {
    setInviteModal(true)
    setInviteMsg('')
    setFriendsLoading(true)
    const { data: links } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    const otherIds = [...new Set((links || []).map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id)))]
    if (!otherIds.length) {
      setFriends([])
      setFriendsLoading(false)
      return
    }
    const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', otherIds)
    setFriends(profiles || [])
    setFriendsLoading(false)
  }, [user.id])

  const inviteFriend = useCallback((friendId) => {
    if (!socket || !room) return
    socket.emit('draft:invite', { code: room.code, toUserId: friendId }, (res) => {
      setInviteMsg(res?.error || `Приглашение отправлено — увидит его в драфт-лобби`)
    })
  }, [socket, room])

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

      {/* Входящее приглашение */}
      <AnimatePresence>
        {invitation && !room && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 border border-neon-400/50 bg-neon-400/5 cut-sm flex flex-wrap items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-neon-400 animate-pulse shrink-0" />
            <span className="text-sm text-text flex-1">
              <span className="text-neon-400 font-bold">{invitation.fromName}</span> приглашает в лобби{' '}
              <span className="font-mono font-bold tracking-widest">{invitation.code}</span>
              {invitation.seasonLabel ? ` · ${invitation.seasonLabel}` : ''}
            </span>
            <button
              onClick={() => joinRoom(invitation.code)}
              disabled={busy || !serverOnline}
              className="px-4 py-1.5 bg-neon-400 text-black text-xs font-display font-bold cut-sm hover:bg-neon-300 transition-colors disabled:opacity-40"
            >
              ВОЙТИ
            </button>
            <button
              onClick={() => setInvitation(null)}
              className="px-3 py-1.5 border border-brand-medium/40 text-text-muted text-xs cut-sm hover:bg-surface-2 transition-colors"
            >
              НЕТ
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!room ? (
        <>
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
                  <div>
                    <label className="dossier-note block mb-2">ВИДИМОСТЬ ЛОББИ</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'open', label: 'ОТКРЫТОЕ', hint: 'видно всем в браузере лобби' },
                        { id: 'closed', label: 'ПО КОДУ', hint: 'только друзья с кодом' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setVisibility(v.id)}
                          className={`px-3 py-2 border cut-sm text-left transition-colors ${
                            visibility === v.id
                              ? 'border-neon-400/60 bg-neon-400/10 text-neon-400'
                              : 'border-brand-medium/40 bg-surface-1 text-text-muted hover:border-brand-medium'
                          }`}
                        >
                          <span className="block font-display text-xs font-bold">{v.label}</span>
                          <span className="block text-[9px] font-mono mt-0.5 opacity-70">{v.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-dim font-mono">
                    Игроки по очереди забирают тайтлы сезона в команду. Победитель определится в итогах.
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
                    onClick={() => joinRoom()}
                    disabled={busy || joinCode.length < 6 || !serverOnline}
                    className="w-full px-6 py-3 border border-cyan-400/50 text-cyan-300 font-display font-bold cut-sm hover:bg-cyan-400/10 transition-colors disabled:opacity-40"
                  >
                    ПРИСОЕДИНИТЬСЯ
                  </button>
                </div>
              </DossierPanel>
            </motion.div>
          </div>

          {/* Браузер открытых лобби */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <DossierPanel accent="#00E5FF">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="dossier-note">ОТКРЫТЫЕ ЛОББИ ({openRooms.length})</span>
                  <Corners color="rgba(0,229,255,0.4)" />
                </div>
                {openRooms.length === 0 ? (
                  <p className="text-sm text-text-dim font-mono py-3 text-center">
                    Сейчас нет открытых комнат — создай свою или войди по коду
                  </p>
                ) : (
                  <div className="space-y-2">
                    {openRooms.map((r) => (
                      <div key={r.code} className="flex items-center gap-3 px-4 py-3 border border-brand-medium/30 bg-surface-1 cut-sm">
                        <span className="font-display font-bold text-sm tracking-[0.2em] text-cyan-300">{r.code}</span>
                        <span className="flex-1 min-w-0 text-sm text-text truncate">
                          {r.hostName}
                          {r.seasonLabel ? <span className="text-text-subtle font-mono text-xs"> · {r.seasonLabel}</span> : null}
                        </span>
                        <span className={`font-mono text-xs ${r.players >= r.maxPlayers ? 'text-amber-300' : 'text-text-subtle'}`}>
                          {r.players}/{r.maxPlayers}
                        </span>
                        <button
                          onClick={() => joinRoom(r.code)}
                          disabled={busy || !serverOnline || r.players >= r.maxPlayers}
                          className="px-3 py-1.5 border border-cyan-400/50 text-cyan-300 text-xs font-display cut-sm hover:bg-cyan-400/10 transition-colors disabled:opacity-30"
                        >
                          ВОЙТИ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DossierPanel>
          </motion.div>
        </>
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

              {/* Видимость + приглашения */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-dashed border-brand-medium/40">
                <span className="dossier-note">ДОСТУП:</span>
                <span className={`text-[10px] font-mono px-2 py-1 border cut-sm uppercase ${
                  room.settings.visibility === 'open'
                    ? 'border-neon-400/50 text-neon-400 bg-neon-400/5'
                    : 'border-amber-400/50 text-amber-300 bg-amber-400/5'
                }`}>
                  {room.settings.visibility === 'open' ? 'открытое — видно в браузере лобби' : 'по коду — только с кодом комнаты'}
                </span>
                {isHost && (
                  <button
                    onClick={toggleVisibility}
                    className="px-3 py-1.5 border border-brand-medium/50 text-text-muted text-xs cut-sm hover:bg-surface-2 hover:text-text transition-colors"
                  >
                    сделать {room.settings.visibility === 'open' ? 'закрытым' : 'открытым'}
                  </button>
                )}
                <span className="flex-1" />
                <button
                  onClick={openInviteModal}
                  className="px-3 py-1.5 border border-neon-400/50 text-neon-400 text-xs font-display cut-sm hover:bg-neon-400/10 transition-colors"
                >
                  ПРИГЛАСИТЬ ДРУЗЕЙ
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

      {/* Модалка приглашения друзей в текущее лобби */}
      <AnimatePresence>
        {inviteModal && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setInviteModal(false)}
          >
            <motion.div
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <DossierPanel cut="cut-sm">
                <div className="p-5 space-y-4">
                  <Corners inset={4} size={7} />
                  <p className="dossier-note">пригласить в лобби {room?.code}</p>
                  {friendsLoading ? (
                    <p className="text-xs text-text-dim font-mono">загрузка друзей…</p>
                  ) : friends.length === 0 ? (
                    <p className="text-xs text-text-dim font-mono">
                      Друзей пока нет — добавь их на странице «Друзья»
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {friends.map((f) => {
                        const already = room?.players.some((p) => p.id === f.id)
                        return (
                          <div key={f.id} className="flex items-center gap-3 px-3 py-2 border border-brand-medium/25 bg-surface-1 cut-sm">
                            <Avatar url={f.avatar_url} name={f.username} size={28} />
                            <span className="flex-1 text-sm text-text truncate">{f.username}</span>
                            {already ? (
                              <span className="text-[9px] font-mono text-text-subtle uppercase">уже в лобби</span>
                            ) : (
                              <button
                                onClick={() => inviteFriend(f.id)}
                                className="px-2.5 py-1 border border-neon-400/50 text-neon-400 text-[10px] font-display cut-sm hover:bg-neon-400/10 transition-colors"
                              >
                                ПОЗВАТЬ
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {inviteMsg && <p className="text-xs font-mono text-text-muted">{inviteMsg}</p>}
                  <div className="flex justify-end">
                    <button onClick={() => setInviteModal(false)} className="btn-ghost text-xs !py-1.5 !px-4">Закрыть</button>
                  </div>
                </div>
              </DossierPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
