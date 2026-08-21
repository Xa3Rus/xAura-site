import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'
import BattleCard from '../components/BattleCard'
import GameOverModal from '../components/GameOverModal'
import Loader from '../components/Loader'
import { Corners, DossierPanel } from '../components/profile/SharedBits'

// Правила подбора пар: разница рейтингов двух тайтлов держится в 1.5–2 балла —
// достаточно, чтобы не быть угадайкой, и достаточно близко, чтобы заставить думать.
const SPREAD_MIN = 1.5
const SPREAD_MAX = 2.0

// Пул сортируется по рейтингу — пары с нужным разбросом ищутся бинарным поиском,
// а не перебором случайных вариантов
function buildSortedPool(allAnime) {
  return allAnime
    .map((a) => ({ ...a, scoreNum: Number(a.score) }))
    .sort((x, y) => x.scoreNum - y.scoreNum)
}

function findBand(sorted, lo, hi) {
  // индексы элементов со scoreNum в [lo, hi)
  let start = 0, end = sorted.length
  let l = 0, r = sorted.length
  while (l < r) { const m = (l + r) >> 1; if (sorted[m].scoreNum < lo) l = m + 1; else r = m }
  start = l
  l = start; r = sorted.length
  while (l < r) { const m = (l + r) >> 1; if (sorted[m].scoreNum < hi) l = m + 1; else r = m }
  end = l
  return [start, end]
}

function pickFromBand(sorted, [start, end], excludeId, recentSet) {
  const fresh = []
  const recent = []
  for (let i = start; i < end; i++) {
    if (sorted[i].id === excludeId) continue
    ;(recentSet.has(sorted[i].id) ? recent : fresh).push(sorted[i])
  }
  const bucket = fresh.length ? fresh : recent
  if (!bucket.length) return null
  return bucket[Math.floor(Math.random() * bucket.length)]
}

function generatePair(sorted, recentIds = [], spreadMax = SPREAD_MAX) {
  if (sorted.length < 2) return null
  const recentSet = new Set(recentIds)
  const maxSpread = Math.max(SPREAD_MIN, Math.min(SPREAD_MAX, spreadMax))

  // несколько стартов — не каждый тайтл имеет пару в нужном коридоре
  for (let attempt = 0; attempt < 30; attempt++) {
    const a = sorted[Math.floor(Math.random() * sorted.length)]
    if (recentSet.has(a.id) && attempt < 20) continue
    const upper = pickFromBand(sorted, findBand(sorted, a.scoreNum + SPREAD_MIN, a.scoreNum + maxSpread + 0.001), a.id, recentSet)
    if (upper) return [a, upper]
    const lower = pickFromBand(sorted, findBand(sorted, a.scoreNum - maxSpread - 0.001, a.scoreNum - SPREAD_MIN + 0.001), a.id, recentSet)
    if (lower) return [lower, a]
  }

  // запасной коридор, если тайтл совсем одинокий в своём диапазоне
  for (const w of [2.5, 3, 4, 6]) {
    const a = sorted[Math.floor(Math.random() * sorted.length)]
    const upper = pickFromBand(sorted, findBand(sorted, a.scoreNum + 0.5, a.scoreNum + w), a.id, recentSet)
    if (upper) return [a, upper]
    const lower = pickFromBand(sorted, findBand(sorted, a.scoreNum - w, a.scoreNum - 0.5), a.id, recentSet)
    if (lower) return [lower, a]
  }

  const a = sorted[Math.floor(Math.random() * sorted.length)]
  const b = sorted.filter((x) => x.id !== a.id)[0]
  return b ? [a, b] : null
}

const RECENT_LIMIT = 24

// Техническая лента-заголовок (как на главной)
function Ribbon({ left, right }) {
  return (
    <div className="flex items-center gap-3">
      <span className="dossier-note !text-neon-400/75 whitespace-nowrap">{left}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/70 via-brand-medium/25 to-transparent" />
      {right && <span className="dossier-note hidden sm:inline text-right">{right}</span>}
    </div>
  )
}

// Индикатор сложности: 10 сегментов, заполняются с ростом серии
function DifficultyGauge({ level }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span
          key={i}
          className="w-[7px] h-3"
          initial={false}
          animate={{
            background: i < level
              ? (level >= 8 ? '#FF8A33' : level >= 5 ? '#D4F785' : '#BBF351')
              : '#1A1A1A',
          }}
          transition={{ duration: 0.25 }}
        />
      ))}
    </div>
  )
}

export default function BattlePage() {
  const { user } = useContext(AuthContext)
  const [allAnime, setAllAnime] = useState([])
  const [loading, setLoading] = useState(true)
  const [pair, setPair] = useState(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [result, setResult] = useState(null)
  const [disabled, setDisabled] = useState(false)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [started, setStarted] = useState(false)
  const [history, setHistory] = useState([])
  const sortedPoolRef = useRef([])
  const recentRef = useRef([])

  useEffect(() => {
    loadAnimeData().then((data) => {
      const pool = data.filter((a) => a.score > 0 && a.image?.original && !a.image.original.includes('missing_') && Number(a.aired_on?.split('-')[0]) > 1990)
      sortedPoolRef.current = buildSortedPool(pool)
      setAllAnime(pool)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) {
      supabase.from('battle_games').select('score').eq('user_id', user.id).order('score', { ascending: false }).limit(1).then(({ data }) => {
        if (data?.length) setBestScore(data[0].score)
      })
      supabase.from('battle_games').select('score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(({ data }) => {
        setHistory(data || [])
      })
    }
  }, [user])

  const nextPair = useCallback((currentScore) => {
    // с ростом серии коридор сужается к 1.5 — в рамках заданного разброса становится сложнее
    const spreadMax = Math.max(SPREAD_MIN, SPREAD_MAX - currentScore * 0.05)
    const p = generatePair(sortedPoolRef.current, recentRef.current, spreadMax)
    if (p) {
      recentRef.current = [...recentRef.current, p[0].id, p[1].id].slice(-RECENT_LIMIT)
    }
    setPair(p)
  }, [])

  const startGame = useCallback(() => {
    setScore(0)
    setGameOver(false)
    setIsNewRecord(false)
    setStarted(true)
    setResult(null)
    recentRef.current = []
    nextPair(0)
  }, [nextPair])

  useEffect(() => {
    if (sortedPoolRef.current.length > 0 && !started) {
      nextPair(0)
      setStarted(true)
    }
  }, [allAnime, started, nextPair])

  const handleChoice = useCallback((chosenAnime) => {
    if (disabled || !pair) return
    setDisabled(true)

    const [left, right] = pair
    const other = chosenAnime.id === left.id ? right : left
    const chosenScore = Number(chosenAnime.score)
    const otherScore = Number(other.score)

    const isCorrect = chosenScore >= otherScore
    const diff = Math.abs(chosenScore - otherScore)

    if (isCorrect) {
      const newScore = score + 1
      setScore(newScore)

      const beatsRecord = newScore > bestScore
      if (beatsRecord) {
        setBestScore(newScore)
        setIsNewRecord(true)
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#BBF351', '#00E5FF', '#BF5AF2', '#FF2D78'] })
      } else if (newScore % 5 === 0) {
        // веха серии — короткий залп
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 }, colors: ['#BBF351', '#D4F785'] })
      }

      setResult({ winner: chosenAnime.id, loser: other.id, diff })

      setTimeout(() => {
        nextPair(newScore)
        setResult(null)
        setDisabled(false)
      }, 1600)
    } else {
      setResult({ wrong: chosenAnime.id, correct: other.id, diff })

      setTimeout(() => {
        setGameOver(true)
        setDisabled(false)
        if (user) saveResult(score)
      }, 1800)
    }
  }, [disabled, pair, score, bestScore, user, nextPair])

  // управление с клавиатуры: ← / → выбирают тайтл
  useEffect(() => {
    const onKey = (e) => {
      if (disabled || !pair || gameOver) return
      if (e.key === 'ArrowLeft') handleChoice(pair[0])
      if (e.key === 'ArrowRight') handleChoice(pair[1])
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [disabled, pair, gameOver, handleChoice])

  const saveResult = async (finalScore) => {
    if (!user) return
    await supabase.from('battle_games').insert({
      user_id: user.id,
      score: finalScore,
      mode: 'rating',
    })
    setHistory((prev) => [{ score: finalScore, created_at: new Date().toISOString() }, ...prev].slice(0, 50))
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader text="Загрузка..." /></div>

  if (!pair) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-sm text-text-muted">Недостаточно аниме</p></div>

  const diffShown = result?.diff
  const diffLevel = Math.min(10, score + 1)
  const corridor = Math.max(SPREAD_MIN, SPREAD_MAX - score * 0.05).toFixed(2)
  const avgScore = history.length ? (history.reduce((s, g) => s + g.score, 0) / history.length).toFixed(1) : null
  const histMax = history.reduce((m, g) => Math.max(m, g.score), 0)

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-[12%] w-[420px] h-[420px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, rgba(187,243,81,0.09), transparent 70%)' }} />
        <div className="absolute top-1/4 right-[12%] w-[420px] h-[420px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.07), transparent 70%)' }} />
        <div className="absolute inset-0 neon-grid opacity-40" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-5">
          <Ribbon
            left="БИТВА // ТИТУЛЫ"
            right={user ? 'сессия записывается в профиль' : 'гость · результат не сохранится'}
          />
        </div>

        <div className="text-center mb-6 page-enter">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Битва тайтлов</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            какое аниме оценено выше? один промах — и серия окончена
          </p>
        </div>

        {/* Приборная панель счёта */}
        <DossierPanel cut="cut-sm" className="overflow-hidden mb-6">
          <div className="absolute bottom-0 inset-x-0 h-2 gauge-ticks opacity-20 pointer-events-none" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-5 py-3.5">
            {/* левая колонка: рекорд */}
            <div>
              <span className="dossier-note block">лучший</span>
              <span className="font-mono text-xl font-bold text-neon-400 leading-tight">{bestScore}</span>
              {history.length > 0 && (
                <span className="block font-mono text-[9px] text-text-subtle mt-0.5">
                  {history.length} игр · ср. {avgScore}
                </span>
              )}
            </div>

            {/* центр: текущая серия */}
            <div className="text-center relative min-w-[110px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={score}
                  initial={{ scale: 0.5, opacity: 0, y: -8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: 8 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <span className="text-5xl font-bold text-neon-400 font-mono drop-shadow-[0_0_20px_rgba(187,243,81,0.35)]">{score}</span>
                </motion.div>
              </AnimatePresence>
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mt-0.5">
                серия · раунд {score + 1}
              </div>
              {isNewRecord && !gameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-3 -right-4 px-1.5 py-px bg-neon-400 text-black font-mono text-[9px] font-bold rotate-6"
                >
                  REC+
                </motion.div>
              )}
            </div>

            {/* правая колонка: сложность */}
            <div className="justify-self-end text-right">
              <span className="dossier-note block">сложность · Δ {corridor}</span>
              <div className="mt-1 flex gap-[3px] justify-end">
                <DifficultyGauge level={diffLevel} />
              </div>
              <span className="block font-mono text-[9px] text-text-subtle mt-1">
                коридор сужается с серией
              </span>
            </div>
          </div>
        </DossierPanel>

        {/* Арена */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4 md:gap-10">
            <BattleCard
              anime={pair[0]}
              side="left"
              accent="neon"
              kbd="←"
              result={
                result?.winner === pair[0].id ? 'winner' :
                result?.loser === pair[0].id ? 'loser' :
                result?.wrong === pair[0].id ? 'wrong' :
                result?.correct === pair[0].id && result?.wrong ? 'winner' : null
              }
              revealed={!!result}
              onClick={() => handleChoice(pair[0])}
              disabled={disabled}
            />

            <BattleCard
              anime={pair[1]}
              side="right"
              accent="cyan"
              kbd="→"
              result={
                result?.winner === pair[1].id ? 'winner' :
                result?.loser === pair[1].id ? 'loser' :
                result?.wrong === pair[1].id ? 'wrong' :
                result?.correct === pair[1].id && result?.wrong ? 'winner' : null
              }
              revealed={!!result}
              onClick={() => handleChoice(pair[1])}
              disabled={disabled}
            />
          </div>

          {/* VS-эмблема / разница рейтингов */}
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <AnimatePresence mode="wait">
              {diffShown != null ? (
                <motion.div
                  key={`diff-${score}`}
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`w-16 h-16 flex flex-col items-center justify-center backdrop-blur-md border ${
                    result?.wrong ? 'bg-danger/15 border-danger/40' : 'bg-success/15 border-success/40'
                  }`}
                >
                  <span className={`font-mono text-sm font-bold ${result?.wrong ? 'text-danger' : 'text-success'}`}>Δ{diffShown.toFixed(2)}</span>
                  <span className="text-[8px] text-text-muted uppercase tracking-wider">балла</span>
                </motion.div>
              ) : (
                <motion.div
                  key="vs"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="relative"
                >
                  <motion.div
                    className="absolute -inset-2 border border-neon-400/25"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="w-14 h-14 bg-surface-1/90 backdrop-blur-md border border-neon-400/30 shadow-glow-neon flex items-center justify-center">
                    <span className="font-display font-bold text-neon-400 text-lg tracking-wider" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>VS</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Результат раунда */}
        <div className="min-h-[52px] mt-5">
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <div className="relative inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2.5 bg-surface-1/90 border border-brand-medium/60 backdrop-blur-sm">
                  <Corners size={7} inset={2} color="rgba(187,243,81,0.35)" />
                  {pair.map((a, i) => (
                    <span key={a.id} className="flex items-center gap-1.5">
                      {i === 1 && <span className="text-text-subtle text-xs">×</span>}
                      <span className={`text-xs font-medium max-w-[180px] truncate ${
                        result.winner === a.id || result.correct === a.id ? 'text-text' : 'text-text-muted'
                      }`}>
                        {a.russian || a.name}
                      </span>
                      <span className={`text-xs font-bold font-mono ${
                        result.winner === a.id || result.correct === a.id ? 'text-success' : 'text-danger'
                      }`}>
                        {Number(a.score).toFixed(2)}
                      </span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-3 dossier-note">
          клик по карточке · или клавиши ← →
        </p>

        {/* Лог сессий */}
        {user && history.length > 0 && (
          <div className="mt-12">
            <div className="dossier-rule mb-4">
              <span className="font-mono text-[10px] font-bold text-text-subtle">LOG</span>
              <h2 className="font-display font-bold text-[15px] tracking-wide text-white uppercase">Последние сессии</h2>
              <span className="dossier-note hidden sm:inline">последние 5 · всего {history.length}</span>
            </div>
            <div className="relative border border-brand-medium/50 bg-[#070905]/80">
              <Corners size={9} inset={2} />
              <div className="divide-y divide-brand-medium/30">
                {history.slice(0, 5).map((g, i) => (
                  <div key={g.created_at + i} className="flex items-center gap-4 px-5 py-2.5">
                    <span className="w-7 text-center font-mono text-[11px] font-bold text-text-subtle">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted w-20">
                      {new Date(g.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="h-[6px] bg-surface-3 relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 chevron-fill opacity-60"
                          style={{ width: `${histMax > 0 ? Math.max(8, (g.score / histMax) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className={`font-mono text-sm font-bold w-8 text-right ${g.score >= bestScore ? 'text-neon-400' : 'text-text-secondary'}`}>
                      {g.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {gameOver && (
        <GameOverModal
          score={score}
          bestScore={bestScore}
          isNewRecord={isNewRecord}
          onRestart={startGame}
        />
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
