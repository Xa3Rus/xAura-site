import { useState, useContext, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { AuthContext } from '../context/AuthContext'
import { getSocket } from '../services/socket'
import { shikimoriImg } from '../utils/imgUrl'
import { Corners, DossierPanel } from '../components/profile/SharedBits'
import Loader from '../components/Loader'

const TEAM_SIZE = 5
const PLAYERS_COLORS = ['#BBF351', '#00E5FF', '#BF5AF2', '#FF2D78', '#FFB340', '#7DD3FC']
const NEON = '#BBF351'

const titleOf = (a) => a.russian || a.name

function Poster({ anime, color, small = false }) {
  const url = shikimoriImg(anime.image)
  return (
    <div
      className={`relative overflow-hidden cut-sm bg-surface-2 ${small ? 'w-9 h-12' : ''}`}
      style={{ border: `1px solid ${color}55` }}
      title={`${titleOf(anime)} · ${Number(anime.score).toFixed(2)}`}
    >
      {url ? (
        <img src={url} alt={titleOf(anime)} loading="lazy" className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none' }} />
      ) : null}
      {!url && (
        <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-text-dim">
          {titleOf(anime)[0]}
        </span>
      )}
    </div>
  )
}

export default function DraftGame() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const socketRef = useRef(null)
  const celebratedRef = useRef(false)

  const [room, setRoom] = useState(location.state?.room || null)
  const [draft, setDraft] = useState(location.state?.draftState || null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const s = getSocket(user.id, user.username)
    socketRef.current = s

    const onUpdated = (ds) => setDraft(ds)
    const onRoomUpdated = (r) => setRoom(r)

    s.on('draft:updated', onUpdated)
    s.on('draft:room:updated', onRoomUpdated)

    const initial = location.state?.draftState
    s.emit('draft:room:state', null, (res) => {
      if (res?.room) {
        setRoom(res.room)
        if (res.room.draftState) setDraft(res.room.draftState)
        else if (!initial) navigate('/draft')
      } else if (!initial) {
        navigate('/draft')
      }
    })

    return () => {
      s.off('draft:updated', onUpdated)
      s.off('draft:room:updated', onRoomUpdated)
    }
  }, [user, navigate, location.state])

  // Конфетти победителю — один раз
  useEffect(() => {
    const st = draft?.standings
    if (!st?.length || celebratedRef.current) return
    celebratedRef.current = true
    if (st[0].playerId === user?.id) {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 }, colors: [NEON, '#00E5FF', '#BF5AF2', '#FFD700'] })
    }
  }, [draft?.standings, user?.id])

  const exitToLobby = useCallback(() => {
    socketRef.current?.emit('draft:room:leave', null, () => {})
    navigate('/draft')
  }, [navigate])

  const handlePick = useCallback((anime) => {
    const s = socketRef.current
    if (!s || !anime) return
    if (!s.connected) return setError('Нет соединения с сервером — связь оборвалась')
    setError('')
    s.emit('draft:pick', { animeId: anime.id }, (res) => {
      if (res?.error) setError(res.error)
    })
  }, [])

  const handleSkip = useCallback(() => {
    const s = socketRef.current
    if (!s) return
    if (!s.connected) return setError('Нет соединения с сервером — связь оборвалась')
    s.emit('draft:skip', null, (res) => {
      if (res?.error) setError(res.error)
    })
  }, [])

  if (!draft || !room || !room.players?.length) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader />
      </div>
    )
  }

  const players = room.players
  const myIdx = players.findIndex((p) => p.id === user?.id)
  const currentIdx = draft.phase === 'drafting' ? draft.order[draft.turn] : -1
  const currentPlayer = currentIdx >= 0 ? players[currentIdx] : null
  const isMyTurn = myIdx === currentIdx && draft.phase === 'drafting'
  const isHost = room.hostId === user?.id

  const pickedIds = new Set(draft.teams.flat().map((a) => a.id))
  const available = draft.pool.filter((a) => !pickedIds.has(a.id))
  const totalPicks = draft.order.length
  const pickNum = Math.min(draft.turn + 1, totalPicks)

  const teamScore = (i) =>
    Math.round(draft.teams[i].reduce((s, a) => s + (Number(a.score) || 0), 0) * 100) / 100

  const colorOf = (i) => PLAYERS_COLORS[i % PLAYERS_COLORS.length]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Шапка */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="dossier-note !text-neon-400/75 whitespace-nowrap">
          ДРАФТ / {room.settings?.seasonLabel || 'СЕЗОН'}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/70 via-brand-medium/25 to-transparent" />
        <span className="dossier-note">ПИК {pickNum}/{totalPicks}</span>
        <span className="dossier-note">КОД {room.code}</span>
        {draft.phase !== 'drafting' && (
          <button onClick={exitToLobby} className="px-4 py-1.5 bg-neon-400 text-black text-xs font-display font-bold cut-sm hover:bg-neon-300 transition-colors">
            В ЛОББИ
          </button>
        )}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2.5 border border-[#FF2D78]/40 bg-[#FF2D78]/10 text-[#FF9AB8] text-sm cut-sm">
          {error}
        </motion.div>
      )}

      {/* Баннер хода */}
      {draft.phase === 'drafting' && currentPlayer && (
        <DossierPanel accent={colorOf(currentIdx)}>
          <div className="px-5 py-3.5 flex flex-wrap items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: colorOf(currentIdx) }} />
            <span className="font-display text-lg font-bold" style={{ color: colorOf(currentIdx) }}>
              {currentPlayer.name}
            </span>
            <span className="text-sm text-text-dim">
              {isMyTurn ? '— твой ход, выбирай из пула ↓' : '— выбирает…'}
            </span>
            <span className="flex-1" />
            {isHost && !currentPlayer.connected && (
              <button onClick={handleSkip}
                className="px-4 py-1.5 border border-amber-400/50 text-amber-300 text-xs font-display cut-sm hover:bg-amber-400/10 transition-colors">
                СЛУЧАЙНЫЙ ПИК ЗА ОФЛАЙН-ИГРОКА
              </button>
            )}
          </div>
        </DossierPanel>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Пул */}
        <DossierPanel>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="dossier-note">ПУЛ СЕЗОНА — ОСТАЛОСЬ {available.length}</span>
              <Corners />
            </div>
            <div className={`grid gap-2.5 ${isMyTurn ? '' : 'opacity-60'} transition-opacity`}
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}>
              {available.map((a) => (
                <motion.button
                  key={a.id}
                  onClick={() => isMyTurn && handlePick(a)}
                  disabled={!isMyTurn}
                  whileHover={isMyTurn ? { y: -4 } : undefined}
                  whileTap={isMyTurn ? { scale: 0.96 } : undefined}
                  layout
                  className={`group text-left ${isMyTurn ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden cut-sm bg-surface-2 border border-brand-medium/30 group-hover:border-neon-400/60 transition-colors">
                    {shikimoriImg(a.image) ? (
                      <img src={shikimoriImg(a.image)} alt={titleOf(a)} loading="lazy"
                        className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-2xl text-text-dim">
                        {titleOf(a)[0]}
                      </span>
                    )}
                    <div className="absolute inset-0 scanlines pointer-events-none opacity-20" />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-[9px] font-mono text-neon-400">
                      {Number(a.score).toFixed(2)}
                    </span>
                    {isMyTurn && (
                      <span className="absolute inset-0 bg-neon-400/0 group-hover:bg-neon-400/10 transition-colors" />
                    )}
                  </div>
                  <div className="mt-1.5 text-[10px] leading-tight text-text-dim line-clamp-2 group-hover:text-text transition-colors">
                    {titleOf(a)}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </DossierPanel>

        {/* Команды */}
        <div className="space-y-2.5 lg:sticky lg:top-20">
          {players.map((p, i) => (
            <div key={p.id}
              className={`px-3.5 py-3 border cut-sm bg-surface-1 transition-colors ${
                i === currentIdx && draft.phase === 'drafting' ? 'bg-surface-2' : 'border-brand-medium/25'
              }`}
              style={i === currentIdx && draft.phase === 'drafting' ? { borderColor: `${colorOf(i)}88` } : undefined}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorOf(i), opacity: p.connected ? 1 : 0.3 }} />
                <span className="text-xs font-medium text-text truncate flex-1">
                  {p.name}{p.id === user?.id ? ' (ты)' : ''}
                </span>
                <span className="font-mono text-[10px]" style={{ color: colorOf(i) }}>{teamScore(i).toFixed(2)}</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: TEAM_SIZE }).map((_, slot) => {
                  const anime = draft.teams[i][slot]
                  return anime ? (
                    <Poster key={anime.id} anime={anime} color={colorOf(i)} small />
                  ) : (
                    <div key={`slot-${i}-${slot}`} className="w-9 h-12 border border-dashed border-brand-medium/25 cut-sm" />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Итоги */}
      <AnimatePresence>
        {draft.phase === 'done' && draft.standings && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              className="w-full max-w-2xl my-8"
            >
              <DossierPanel accent="#FFD700">
                <div className="p-6 sm:p-8 space-y-6 relative">
                  <Corners color="rgba(255,215,0,0.5)" />
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neon-400 animate-pulse" />
                    <span className="dossier-note">ДРАФТ ЗАВЕРШЁН — ИТОГИ ЛИГИ</span>
                  </div>

                  <div className="space-y-2.5">
                    {draft.standings.map((row, place) => (
                      <div key={row.playerId}
                        className={`flex items-center gap-3 px-4 py-3 border cut-sm ${
                          place === 0 ? 'border-amber-400/60 bg-amber-400/5' : 'border-brand-medium/25 bg-surface-1'
                        }`}>
                        <span className={`font-display font-bold text-xl w-8 text-center ${
                          place === 0 ? 'text-amber-300' : place === 1 ? 'text-text-muted' : 'text-text-subtle'
                        }`}>
                          {place + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-text truncate">{row.name}</span>
                            {place === 0 && <span className="text-[9px] px-2 py-0.5 border border-amber-400/50 text-amber-300 font-mono uppercase">победитель</span>}
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            {row.team.map((a) => <Poster key={a.id} anime={a} color="#FFD700" small />)}
                          </div>
                        </div>
                        <span className="font-display font-bold text-lg" style={{ color: place === 0 ? '#FFD700' : colorOf(players.findIndex(p => p.id === row.playerId)) }}>
                          {row.score.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={exitToLobby}
                      className="flex-1 px-6 py-3 bg-neon-400 text-black font-display font-bold cut-sm hover:bg-neon-300 transition-colors">
                      НОВЫЙ ДРАФТ
                    </button>
                    <button onClick={() => navigate('/')}
                      className="flex-1 px-6 py-3 border border-brand-medium/50 text-text font-display cut-sm hover:bg-surface-2 transition-colors">
                      НА ГЛАВНУЮ
                    </button>
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
