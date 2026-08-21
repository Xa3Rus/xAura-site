import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'
import { getScreenshots } from '../utils/screenshotData'
import { shikimoriImg } from '../utils/imgUrl'
import {
  DAILY_ROUNDS,
  DAILY_MODES,
  getTodayKey,
  dailyModeForDate,
  generateDailyBattle,
  generateDailyScreenshotPlan,
  calcStreak,
} from '../utils/daily'
import BattleCard from '../components/BattleCard'
import { Corners, DossierPanel } from '../components/profile/SharedBits'
import Loader from '../components/Loader'

const NEON = '#BBF351'
const CYAN = '#00E5FF'
const RED = '#FF2D78'

const RANKS = [
  { min: 10, title: 'Идеально', color: '#FFD700' },
  { min: 8, title: 'Блестяще', color: '#BF5AF2' },
  { min: 6, title: 'Уверенно', color: CYAN },
  { min: 4, title: 'Неплохо', color: NEON },
  { min: 2, title: 'Сложный день', color: '#A0A0A0' },
  { min: 0, title: 'Бывает', color: '#707070' },
]
const getRank = (s) => RANKS.find((r) => s >= r.min) || RANKS[RANKS.length - 1]

const titleOf = (a) => a.russian || a.name

function useMidnightCountdown(active) {
  const [left, setLeft] = useState('--:--:--')
  useEffect(() => {
    if (!active) return
    const tick = () => {
      const now = new Date()
      const mid = new Date(now)
      mid.setHours(24, 0, 0, 0)
      const ms = mid - now
      const h = String(Math.floor(ms / 3600000)).padStart(2, '0')
      const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
      setLeft(`${h}:${m}:${s}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [active])
  return left
}

function Readout({ value, label, color = NEON }) {
  return (
    <div className="cut-wrap cut-sm" style={{ background: `linear-gradient(150deg, ${color}26, rgba(45,74,15,0.2))` }}>
      <div className="cut-inner cut-sm relative bg-[#070905] px-3 py-2 overflow-hidden">
        <div className="absolute bottom-0 inset-x-0 h-1.5 gauge-ticks opacity-25" />
        <span className="font-display font-bold text-base leading-none" style={{ color }}>{value}</span>
        <span className="block mt-1 text-[8px] uppercase tracking-[0.14em] font-mono text-text-subtle">{label}</span>
      </div>
    </div>
  )
}

// Мини-таблица дня: очки, ники, подсветка своей строки
function Leaderboard({ rows, myUserId, myRankRow }) {
  const medals = ['🥇', '🥈', '🥉']
  if (!rows.length) {
    return <p className="text-sm text-text-dim font-mono py-4 text-center">Сегодня ещё никто не играл — будь первым</p>
  }
  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => {
        const mine = row.user_id === myUserId
        return (
          <motion.div
            key={row.user_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 px-3.5 py-2.5 border cut-sm ${
              mine ? 'border-neon-400/60 bg-neon-400/5' : 'border-brand-medium/20 bg-surface-1'
            }`}
          >
            <span className="w-7 text-center font-display font-bold text-sm text-text-muted">
              {medals[i] || i + 1}
            </span>
            <span className="w-7 h-7 rounded-full bg-surface-3 border border-brand-medium/30 flex items-center justify-center font-display font-bold text-xs text-text shrink-0">
              {(row.username || '?')[0].toUpperCase()}
            </span>
            <span className="flex-1 text-sm text-text truncate">
              {row.username || 'Аноним'}{mine && <span className="text-neon-400"> — ты</span>}
            </span>
            <span className="font-mono text-xs text-text-subtle hidden sm:inline">
              {new Date(row.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="font-display font-bold text-base" style={{ color: row.score >= 8 ? NEON : undefined }}>
              {row.score}<span className="text-text-subtle text-xs">/{DAILY_ROUNDS}</span>
            </span>
          </motion.div>
        )
      })}
      {myRankRow && myRankRow.rank > rows.length && (
        <div className="flex items-center gap-3 px-3.5 py-2.5 border border-neon-400/40 bg-neon-400/5 cut-sm">
          <span className="w-7 text-center font-display font-bold text-sm text-text-muted">{myRankRow.rank}</span>
          <span className="flex-1 text-sm text-text">…</span>
          <span className="font-display font-bold text-base text-neon-400">{myRankRow.score}/{DAILY_ROUNDS}</span>
        </div>
      )}
    </div>
  )
}

export default function DailyChallenge() {
  const { user } = useContext(AuthContext)
  const dateKey = getTodayKey()
  const mode = dailyModeForDate(dateKey)
  const modeInfo = DAILY_MODES[mode]

  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('intro') // intro | playing | done
  const [data, setData] = useState(null)
  const [battlePairs, setBattlePairs] = useState([])
  const [shotPlan, setShotPlan] = useState([])
  const [shotUrl, setShotUrl] = useState(null)

  const [roundIdx, setRoundIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [revealing, setRevealing] = useState(false)
  const [pickedBattle, setPickedBattle] = useState(null) // 0 | 1
  const [pickedId, setPickedId] = useState(null) // screenshot mode
  const [savedScore, setSavedScore] = useState(null)

  const [myResult, setMyResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [streak, setStreak] = useState(0)
  const [dbError, setDbError] = useState(false)

  const correctRef = useRef(0)
  const timersRef = useRef([])
  const savedRef = useRef(false)

  const countdown = useMidnightCountdown(view === 'done' || view === 'intro')

  // Данные + генерация дня + загрузка результатов
  useEffect(() => {
    let cancelled = false
    loadAnimeData()
      .then((d) => {
        if (cancelled) return
        setData(d)
        if (mode === 'battle') setBattlePairs(generateDailyBattle(d, dateKey))
        else setShotPlan(generateDailyScreenshotPlan(d, dateKey))
      })
      .catch(() => {})
    ;(async () => {
      const [mine, board, history] = await Promise.all([
        supabase.from('daily_results').select('score, mode, created_at').eq('user_id', user.id).eq('date_key', dateKey).maybeSingle(),
        supabase.from('daily_results').select('user_id, score, created_at').eq('date_key', dateKey).order('score', { ascending: false }).order('created_at', { ascending: true }).limit(50),
        supabase.from('daily_results').select('date_key').eq('user_id', user.id).order('date_key', { ascending: false }).limit(90),
      ])
      if (cancelled) return
      if (mine.error || board.error || history.error) setDbError(true)
      if (mine.data) {
        setMyResult(mine.data)
        setView('done')
      }
      setStreak(calcStreak([...(history.data || []).map((r) => r.date_key), ...(mine.data ? [dateKey] : [])]))
      const rows = board.data || []
      if (rows.length) {
        const ids = [...new Set(rows.map((r) => r.user_id))]
        const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', ids)
        const nameOf = Object.fromEntries((profiles || []).map((p) => [p.id, p.username]))
        setLeaderboard(rows.map((r) => ({ ...r, username: nameOf[r.user_id] })))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
      timersRef.current.forEach(clearTimeout)
    }
  }, [user.id, dateKey, mode])

  // Скриншот текущего раунда (детерминированный индекс, фетч живой)
  useEffect(() => {
    if (mode !== 'screenshot' || view !== 'playing') return
    const plan = shotPlan[roundIdx]
    if (!plan) return
    let cancelled = false
    setShotUrl(null)
    getScreenshots(plan.answer.id).then((urls) => {
      if (cancelled) return
      const url = urls.length
        ? urls[plan.shotIdx % urls.length]
        : shikimoriImg(plan.answer.image?.original)
      setShotUrl(url)
    })
    return () => { cancelled = true }
  }, [mode, view, roundIdx, shotPlan])

  const finishGame = useCallback(async (finalScore) => {
    setSavedScore(finalScore)
    setView('done')
    if (finalScore >= 8) {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 }, colors: [NEON, CYAN, '#BF5AF2', '#FFD700'] })
    }
    if (savedRef.current) return
    savedRef.current = true
    const { error } = await supabase
      .from('daily_results')
      .insert({ user_id: user.id, date_key: dateKey, mode, score: finalScore })
    if (error) {
      setDbError(true)
      return
    }
    setMyResult({ score: finalScore, mode, created_at: new Date().toISOString() })
    // обновляем таблицу и стрик
    const [board, history] = await Promise.all([
      supabase.from('daily_results').select('user_id, score, created_at').eq('date_key', dateKey).order('score', { ascending: false }).order('created_at', { ascending: true }).limit(50),
      supabase.from('daily_results').select('date_key').eq('user_id', user.id).order('date_key', { ascending: false }).limit(90),
    ])
    const rows = board.data || []
    if (rows.length) {
      const ids = [...new Set(rows.map((r) => r.user_id))]
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', ids)
      const nameOf = Object.fromEntries((profiles || []).map((p) => [p.id, p.username]))
      setLeaderboard(rows.map((r) => ({ ...r, username: nameOf[r.user_id] })))
    }
    setStreak(calcStreak((history.data || []).map((r) => r.date_key)))
  }, [user.id, dateKey, mode])

  const advance = useCallback((ok) => {
    if (ok) {
      correctRef.current += 1
      setCorrect(correctRef.current)
    }
    setRevealing(true)
    timersRef.current.push(
      setTimeout(() => {
        setRevealing(false)
        setPickedBattle(null)
        setPickedId(null)
        if (roundIdx + 1 >= DAILY_ROUNDS) finishGame(correctRef.current)
        else setRoundIdx((i) => i + 1)
      }, ok ? 1400 : 2000)
    )
  }, [roundIdx, finishGame])

  const pickBattle = useCallback((side) => {
    if (revealing || view !== 'playing') return
    const pair = battlePairs[roundIdx]
    if (!pair) return
    setPickedBattle(side)
    advance(Number(pair[side].score) >= Number(pair[1 - side].score))
  }, [revealing, view, battlePairs, roundIdx, advance])

  const pickShot = useCallback((id) => {
    if (revealing || view !== 'playing') return
    const plan = shotPlan[roundIdx]
    if (!plan) return
    setPickedId(id)
    advance(id === plan.answer.id)
  }, [revealing, view, shotPlan, roundIdx, advance])

  // Клавиатура: 1/2 — битва, 1–4 — кадр
  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'playing' || revealing) return
      const n = Number(e.key)
      if (!n) return
      if (mode === 'battle' && (n === 1 || n === 2)) pickBattle(n - 1)
      if (mode === 'screenshot' && n >= 1 && n <= 4) {
        const plan = shotPlan[roundIdx]
        const options = plan ? [plan.answer, ...plan.distractors] : []
        if (options[n - 1]) pickShot(options[n - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const startGame = () => {
    correctRef.current = 0
    setCorrect(0)
    setRoundIdx(0)
    setView('playing')
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24"><Loader /></div>
    )
  }

  const displayScore = view === 'done' ? (myResult?.score ?? savedScore ?? 0) : correct
  const rank = getRank(displayScore)
  const myRankRow = myResult
    ? { rank: Math.max(1, leaderboard.findIndex((r) => r.user_id === user.id) + 1), score: myResult.score }
    : null

  const ready = mode === 'battle' ? battlePairs.length === DAILY_ROUNDS : shotPlan.length === DAILY_ROUNDS

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Лента */}
      <div className="flex items-center gap-3">
        <span className="dossier-note !text-neon-400/75 whitespace-nowrap">
          ЧЕЛЛЕНДЖ ДНЯ / {dateKey}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/70 via-brand-medium/25 to-transparent" />
        <span className="dossier-note hidden sm:inline">{modeInfo.icon} {modeInfo.title.toUpperCase()}</span>
      </div>

      {dbError && (
        <div className="px-4 py-2.5 border border-amber-400/40 bg-amber-400/10 text-amber-200/90 text-sm cut-sm">
          Таблица результатов недоступна — выполни <code className="bg-black/30 px-1">sql/daily_results.sql</code> в Supabase SQL Editor
        </div>
      )}

      {/* === ИНТРО === */}
      {view === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <DossierPanel>
            <div className="p-6 sm:p-10 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{modeInfo.icon}</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-text">{modeInfo.title}</h1>
                  </div>
                  <p className="text-text-dim mt-2 text-sm max-w-md">
                    {modeInfo.hint}. {DAILY_ROUNDS} раундов, один на всех — сегодня у всех игроков
                    одинаковый набор. Одна попытка в день.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Readout value={streak || '—'} label="СТРИК" color="#FFB340" />
                  <Readout value={leaderboard.length} label="ИГРОКОВ" color={CYAN} />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-2.5 font-mono text-xs">
                <div className="px-4 py-3 border border-brand-medium/25 bg-surface-1 cut-sm">
                  <span className="text-neon-400 block mb-1">01</span>
                  <span className="text-text-dim">Один набор раундов на всех — генерируется из даты</span>
                </div>
                <div className="px-4 py-3 border border-brand-medium/25 bg-surface-1 cut-sm">
                  <span className="text-neon-400 block mb-1">02</span>
                  <span className="text-text-dim">До следующего челленджа: {countdown}</span>
                </div>
                <div className="px-4 py-3 border border-brand-medium/25 bg-surface-1 cut-sm">
                  <span className="text-neon-400 block mb-1">03</span>
                  <span className="text-text-dim">+15 XP к ауре за пройденный день, стрик растёт</span>
                </div>
              </div>

              {ready ? (
                <button onClick={startGame}
                  className="w-full sm:w-auto px-8 py-3 bg-neon-400 text-black font-display font-bold tracking-wide cut-sm hover:bg-neon-300 transition-colors">
                  НАЧАТЬ СЕГОДНЯШНИЙ ЧЕЛЛЕНДЖ
                </button>
              ) : (
                <div className="flex items-center gap-3 text-text-dim text-sm font-mono">
                  <div className="w-4 h-4 rounded-full border-2 border-neon-400/30 border-t-neon-400 animate-spin" />
                  генерация раундов…
                </div>
              )}

              <div>
                <span className="dossier-note block mb-3">ТАБЛИЦА ДНЯ</span>
                <Leaderboard rows={leaderboard} myUserId={user.id} myRankRow={null} />
              </div>
            </div>
          </DossierPanel>
        </motion.div>
      )}

      {/* === ИГРА: БИТВА === */}
      {view === 'playing' && mode === 'battle' && battlePairs[roundIdx] && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Readout value={`${roundIdx + 1}/${DAILY_ROUNDS}`} label="РАУНД" />
            <Readout value={correct} label="ВЕРНО" />
            <div className="flex-1 min-w-[120px] h-2 bg-surface-2 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-neon-400 to-cyan-400"
                animate={{ width: `${((roundIdx + 1) / DAILY_ROUNDS) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-3xl mx-auto">
            {[0, 1].map((side) => (
              <BattleCard
                key={`${roundIdx}-${battlePairs[roundIdx][side].id}`}
                anime={battlePairs[roundIdx][side]}
                side={side === 0 ? 'left' : 'right'}
                accent={side === 0 ? 'neon' : 'cyan'}
                kbd={side === 0 ? '1' : '2'}
                revealed={revealing}
                result={
                  !revealing ? null
                  : Number(battlePairs[roundIdx][side].score) >= Number(battlePairs[roundIdx][1 - side].score) ? 'winner'
                  : pickedBattle === side ? 'wrong' : 'loser'
                }
                onClick={() => pickBattle(side)}
                disabled={revealing}
              />
            ))}
          </div>
          <AnimatePresence>
            {revealing && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto flex items-center justify-center gap-3 text-sm font-mono px-4 py-2.5 border cut-sm bg-surface-1 border-brand-medium/25">
                <span style={{ color: NEON }}>{titleOf(battlePairs[roundIdx][0])} · {Number(battlePairs[roundIdx][0].score).toFixed(2)}</span>
                <span className="text-text-subtle">vs</span>
                <span style={{ color: CYAN }}>{titleOf(battlePairs[roundIdx][1])} · {Number(battlePairs[roundIdx][1].score).toFixed(2)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* === ИГРА: КАДР === */}
      {view === 'playing' && mode === 'screenshot' && shotPlan[roundIdx] && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Readout value={`${roundIdx + 1}/${DAILY_ROUNDS}`} label="РАУНД" />
            <Readout value={correct} label="ВЕРНО" />
            <div className="flex-1 min-w-[120px] h-2 bg-surface-2 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-neon-400 to-cyan-400"
                animate={{ width: `${((roundIdx + 1) / DAILY_ROUNDS) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
          </div>
          <DossierPanel>
            <div className="p-4 sm:p-6 space-y-5">
              <div className="relative aspect-video cut-sm overflow-hidden bg-surface-2">
                <Corners />
                {shotUrl ? (
                  <motion.img
                    key={roundIdx + shotUrl}
                    src={shotUrl}
                    alt="Кадр дня"
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                      filter: revealing ? 'none' : 'blur(6px) saturate(1.1)',
                      transform: revealing ? 'scale(1)' : 'scale(1.15)',
                    }}
                    transition={{ filter: { duration: 0.6 }, transform: { duration: 0.6 } }}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center scanlines">
                    <div className="w-10 h-10 rounded-full border-2 border-neon-400/30 border-t-neon-400 animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />
                {revealing && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent px-4 pt-10 pb-3">
                    <span className="font-display font-bold text-lg" style={{ color: NEON }}>{titleOf(shotPlan[roundIdx].answer)}</span>
                    <span className="block text-xs text-text-dim font-mono">
                      {shotPlan[roundIdx].answer.aired_on?.slice(0, 4)} · рейтинг {Number(shotPlan[roundIdx].answer.score).toFixed(2)}
                    </span>
                  </motion.div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[shotPlan[roundIdx].answer, ...shotPlan[roundIdx].distractors].map((opt, i) => {
                  const isAnswer = opt.id === shotPlan[roundIdx].answer.id
                  const isPicked = opt.id === pickedId
                  let cls = 'border-brand-medium/40 bg-surface-1 hover:border-neon-400/60 hover:bg-surface-2'
                  if (revealing) {
                    if (isAnswer) cls = 'border-neon-400 bg-neon-400/10'
                    else if (isPicked) cls = 'border-[#FF2D78] bg-[#FF2D78]/10 shake'
                    else cls = 'border-brand-medium/20 bg-surface-1 opacity-40'
                  }
                  return (
                    <motion.button key={opt.id}
                      onClick={() => pickShot(opt.id)}
                      disabled={revealing}
                      whileTap={!revealing ? { scale: 0.98 } : undefined}
                      className={`relative text-left px-4 py-3 border cut-sm transition-colors ${cls} ${revealing ? 'cursor-default' : 'cursor-pointer'}`}>
                      <span className="font-mono text-[10px] text-text-subtle mr-2">{i + 1}</span>
                      <span className="text-sm text-text">{titleOf(opt)}</span>
                      {revealing && isAnswer && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-400 font-display font-bold">✓</span>}
                      {revealing && isPicked && !isAnswer && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF2D78] font-display font-bold">✕</span>}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </DossierPanel>
        </div>
      )}

      {/* === ИТОГИ === */}
      {view === 'done' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <DossierPanel accent={rank.color}>
            <div className="p-6 sm:p-8 space-y-6 relative">
              <Corners color={`${rank.color}88`} />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-neon-400 animate-pulse" />
                    <span className="dossier-note">ЧЕЛЛЕНДЖ ЗАВЕРШЁН · {modeInfo.title.toUpperCase()}</span>
                  </div>
                  <div className="font-display text-5xl font-bold" style={{ color: rank.color }}>
                    {displayScore}<span className="text-2xl text-text-subtle">/{DAILY_ROUNDS}</span>
                  </div>
                  <div className="mt-2 inline-block px-4 py-1 border cut-sm font-display font-bold text-sm"
                    style={{ color: rank.color, borderColor: `${rank.color}66`, background: `${rank.color}14` }}>
                    {rank.title}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Readout value={streak || '—'} label="СТРИК, ДНЕЙ" color="#FFB340" />
                  <Readout value={countdown} label="ДО НОВОГО" color={CYAN} />
                </div>
              </div>
              <p className="text-xs text-text-dim font-mono">
                Одна попытка в день уже использована. Возвращайся завтра — набор раундов будет новым.
              </p>

              <div>
                <span className="dossier-note block mb-3">ТАБЛИЦА ДНЯ</span>
                <Leaderboard rows={leaderboard} myUserId={user.id} myRankRow={myRankRow} />
              </div>
            </div>
          </DossierPanel>
        </motion.div>
      )}
    </div>
  )
}
