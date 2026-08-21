import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { loadAnimeData } from '../utils/animeData'
import { getScreenshots } from '../utils/screenshotData'
import { Corners, DossierPanel } from '../components/profile/SharedBits'
import Loader from '../components/Loader'

const ROUNDS = 10
const OPTIONS = 4
const BEST_KEY = 'screenshot_quiz_best'

const NEON = '#BBF351'
const CYAN = '#00E5FF'
const RED = '#FF2D78'

const RANKS = [
  { min: 10, title: 'Идеальный глаз', color: '#FFD700' },
  { min: 8, title: 'Кинокритик', color: '#BF5AF2' },
  { min: 6, title: 'Знаток кадров', color: CYAN },
  { min: 4, title: 'Внимательный зритель', color: NEON },
  { min: 2, title: 'Новичок', color: '#A0A0A0' },
  { min: 0, title: 'Зритель', color: '#707070' },
]
const getRank = (s) => RANKS.find((r) => s >= r.min) || RANKS[RANKS.length - 1]

// Размытие кадра спадает к финалу: первые раунды самые «туманные»
const blurForRound = (r) => (r < 3 ? 8 : r < 6 ? 5 : 3)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const titleOf = (a) => a.russian || a.name

function pickDistractors(pool, answerId) {
  const res = []
  const seen = new Set([answerId])
  for (let i = 0; i < 60 && res.length < OPTIONS - 1; i++) {
    const cand = pool[Math.floor(Math.random() * pool.length)]
    if (seen.has(cand.id)) continue
    seen.add(cand.id)
    res.push(cand)
  }
  return res.length === OPTIONS - 1 ? res : null
}

// Собирает раунд: тайтл со скриншотами становится ответом, остальное — варианты.
// Тайтлы без скриншотов просто пропускаются (не у всех они есть на Shikimori).
async function generateRound(pool, usedIds) {
  const fresh = pool.filter((a) => !usedIds.has(a.id))
  const src = fresh.length > 20 ? fresh : pool
  for (let attempt = 0; attempt < 40; attempt++) {
    const answer = src[Math.floor(Math.random() * src.length)]
    if (usedIds.has(answer.id) && attempt < 30) continue
    const shots = await getScreenshots(answer.id)
    if (!shots.length) continue
    const distractors = pickDistractors(pool, answer.id)
    if (!distractors) continue
    return {
      answer,
      screenshot: shots[Math.floor(Math.random() * shots.length)],
      options: shuffle([answer, ...distractors]),
    }
  }
  return null
}

function Readout({ value, label, color = NEON }) {
  return (
    <div className="cut-wrap cut-sm" style={{ background: `linear-gradient(150deg, ${color}26, rgba(45,74,15,0.2))` }}>
      <div className="cut-inner cut-sm relative bg-[#070905] px-3 py-2 overflow-hidden">
        <div className="absolute bottom-0 inset-x-0 h-1.5 gauge-ticks opacity-25" />
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display font-bold text-base leading-none" style={{ color }}>{value}</span>
        </div>
        <span className="block mt-1 text-[8px] uppercase tracking-[0.14em] font-mono text-text-subtle">{label}</span>
      </div>
    </div>
  )
}

export default function ScreenshotQuiz() {
  const [pool, setPool] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [phase, setPhase] = useState('intro') // intro | playing | finished
  const [roundIdx, setRoundIdx] = useState(0)
  const [round, setRound] = useState(null)
  const [roundError, setRoundError] = useState(false)
  const [roundNonce, setRoundNonce] = useState(0)
  const [pickedId, setPickedId] = useState(null)
  const [revealing, setRevealing] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) || 0))
  const [isNewBest, setIsNewBest] = useState(false)

  const correctRef = useRef(0)
  const usedRef = useRef(new Set())
  const timersRef = useRef([])

  useEffect(() => {
    loadAnimeData()
      .then((data) => {
        const p = data.filter(
          (a) =>
            Number(a.score) >= 6.6 &&
            a.image?.original &&
            !a.image.original.includes('missing_') &&
            a.aired_on &&
            Number(a.aired_on.slice(0, 4)) >= 1995
        )
        setPool(p.length >= 30 ? p : data)
      })
      .catch(() => setLoadError(true))
    return () => timersRef.current.forEach(clearTimeout)
  }, [])

  // Генерация раунда
  useEffect(() => {
    if (phase !== 'playing' || round || !pool) return
    let cancelled = false
    setRoundError(false)
    generateRound(pool, usedRef.current).then((r) => {
      if (cancelled) return
      if (!r) return setRoundError(true)
      usedRef.current.add(r.answer.id)
      setRound(r)
    })
    return () => { cancelled = true }
  }, [phase, round, pool, roundNonce])

  const finishGame = useCallback((finalScore) => {
    const prev = Number(localStorage.getItem(BEST_KEY) || 0)
    if (finalScore > prev) {
      localStorage.setItem(BEST_KEY, String(finalScore))
      setBest(finalScore)
      setIsNewBest(true)
      confetti({ particleCount: 160, spread: 85, origin: { y: 0.7 }, colors: [NEON, CYAN, '#BF5AF2', '#FFD700'] })
    }
    setPhase('finished')
  }, [])

  const handlePick = useCallback((id) => {
    if (!round || revealing) return
    setPickedId(id)
    const ok = id === round.answer.id
    if (ok) {
      correctRef.current += 1
      setCorrect(correctRef.current)
      if (correctRef.current % 4 === 0) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: [NEON, '#D4F785'] })
      }
    }
    setRevealing(true)
    const wait = ok ? 1400 : 2000
    timersRef.current.push(
      setTimeout(() => {
        setRevealing(false)
        setPickedId(null)
        setRound(null)
        if (roundIdx + 1 >= ROUNDS) {
          finishGame(correctRef.current)
        } else {
          setRoundIdx((i) => i + 1)
        }
      }, wait)
    )
  }, [round, revealing, roundIdx, finishGame])

  // Клавиатура: 1–4 выбор, Enter — рестарт
  useEffect(() => {
    const onKey = (e) => {
      if (phase === 'finished' && e.key === 'Enter') return restart()
      if (phase !== 'playing' || !round || revealing) return
      const n = Number(e.key)
      if (n >= 1 && n <= OPTIONS) handlePick(round.options[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const restart = useCallback(() => {
    correctRef.current = 0
    usedRef.current = new Set()
    setCorrect(0)
    setIsNewBest(false)
    setRoundIdx(0)
    setRound(null)
    setPickedId(null)
    setRevealing(false)
    setPhase('playing')
  }, [])

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <DossierPanel accent={RED}>
          <div className="p-8 space-y-4">
            <p className="font-display text-xl">Не удалось загрузить данные</p>
            <p className="text-text-dim text-sm">Проверь соединение и попробуй снова</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-neon-400 text-black font-display font-bold cut-sm">
              ПОВТОРИТЬ
            </button>
          </div>
        </DossierPanel>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader />
      </div>
    )
  }

  const rank = getRank(correct)
  const blur = blurForRound(roundIdx)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-3">
        <span className="dossier-note !text-neon-400/75 whitespace-nowrap">ОПЕРАЦИЯ «КАДР» / {ROUNDS} РАУНДОВ</span>
        <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/70 via-brand-medium/25 to-transparent" />
        <span className="dossier-note hidden sm:inline">ВИЗУАЛЬНАЯ РАЗВЕДКА</span>
      </div>

      {phase === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <DossierPanel>
            <div className="p-6 sm:p-10 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-text">Угадай по кадру</h1>
                  <p className="text-text-dim mt-2 text-sm max-w-md">
                    {ROUNDS} кадров из аниме. Кадр размыт — чем дальше, тем чётче. Четыре варианта, один верный.
                    Ошибки не прерывают игру — считаем точность.
                  </p>
                </div>
                <div className="hidden sm:block shrink-0"><Readout value={best} label="РЕКОРД" /></div>
              </div>
              <ul className="space-y-2 text-sm text-text-dim font-mono">
                <li className="flex gap-2"><span className="text-neon-400">01</span> Смотри кадр, выбирай название (клавиши 1–4)</li>
                <li className="flex gap-2"><span className="text-neon-400">02</span> Правильный ответ подсветится, кадр раскроется</li>
                <li className="flex gap-2"><span className="text-neon-400">03</span> Итог — очки из {ROUNDS}, рекорд сохраняется</li>
              </ul>
              <button
                onClick={() => setPhase('playing')}
                className="w-full sm:w-auto px-8 py-3 bg-neon-400 text-black font-display font-bold tracking-wide cut-sm hover:bg-neon-300 transition-colors"
              >
                НАЧАТЬ ОПЕРАЦИЮ
              </button>
            </div>
          </DossierPanel>
        </motion.div>
      )}

      {phase === 'playing' && (
        <div className="space-y-5">
          {/* Показатели */}
          <div className="flex flex-wrap items-center gap-2">
            <Readout value={`${roundIdx + (round ? 1 : 0)}/${ROUNDS}`} label="РАУНД" />
            <Readout value={correct} label="ВЕРНО" />
            <Readout value={best} label="РЕКОРД" color={CYAN} />
            <div className="flex-1 min-w-[120px] h-2 bg-surface-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-neon-400 to-cyan-400"
                animate={{ width: `${((roundIdx + (round ? 1 : 0)) / ROUNDS) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          <DossierPanel>
            <div className="p-4 sm:p-6 space-y-5">
              {/* Кадр */}
              <div className="relative aspect-video cut-sm overflow-hidden bg-surface-2">
                <Corners />
                <AnimatePresence mode="wait">
                  {round ? (
                    <motion.img
                      key={round.answer.id + round.screenshot}
                      src={round.screenshot}
                      alt="Кадр из аниме"
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        filter: revealing ? 'none' : `blur(${blur}px) saturate(1.1)`,
                        transform: revealing ? 'scale(1)' : 'scale(1.15)',
                      }}
                      transition={{ filter: { duration: 0.6 }, transform: { duration: 0.6 } }}
                      draggable={false}
                    />
                  ) : (
                    <motion.div
                      key="loading"
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 scanlines"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                      {roundError ? (
                        <>
                          <span className="text-text-dim text-sm">Не удалось собрать раунд</span>
                          <button onClick={() => { setRoundError(false); setRoundNonce((n) => n + 1) }} className="px-4 py-2 bg-surface-3 text-text text-sm cut-sm">
                            ЕЩЁ РАЗ
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full border-2 border-neon-400/30 border-t-neon-400 animate-spin" />
                          <span className="dossier-note">ИЗВЛЕЧЕНИЕ КАДРА…</span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />
                {revealing && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent px-4 pt-10 pb-3"
                  >
                    <span className="font-display font-bold text-lg" style={{ color: NEON }}>
                      {titleOf(round.answer)}
                    </span>
                    <span className="block text-xs text-text-dim font-mono">
                      {round.answer.aired_on?.slice(0, 4)} · рейтинг {Number(round.answer.score).toFixed(2)}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Варианты */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {round ? round.options.map((opt, i) => {
                  const isAnswer = opt.id === round.answer.id
                  const isPicked = opt.id === pickedId
                  let cls = 'border-brand-medium/40 bg-surface-1 hover:border-neon-400/60 hover:bg-surface-2'
                  if (revealing) {
                    if (isAnswer) cls = 'border-neon-400 bg-neon-400/10'
                    else if (isPicked) cls = 'border-[#FF2D78] bg-[#FF2D78]/10 shake'
                    else cls = 'border-brand-medium/20 bg-surface-1 opacity-40'
                  }
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => handlePick(opt.id)}
                      disabled={revealing}
                      whileTap={!revealing ? { scale: 0.98 } : undefined}
                      className={`relative text-left px-4 py-3 border cut-sm transition-colors ${cls} ${revealing ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="font-mono text-[10px] text-text-subtle mr-2">{i + 1}</span>
                      <span className="text-sm text-text">{titleOf(opt)}</span>
                      {revealing && isAnswer && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-400 font-display font-bold">✓</motion.span>
                      )}
                      {revealing && isPicked && !isAnswer && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF2D78] font-display font-bold">✕</motion.span>
                      )}
                    </motion.button>
                  )
                }) : Array.from({ length: OPTIONS }).map((_, i) => (
                  <div key={i} className="h-[52px] bg-surface-1 border border-brand-medium/20 cut-sm animate-pulse" />
                ))}
              </div>
            </div>
          </DossierPanel>
        </div>
      )}

      {/* Итоги */}
      <AnimatePresence>
        {phase === 'finished' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-md"
            >
              <DossierPanel accent={isNewBest ? NEON : rank.color}>
                <div className="p-8 space-y-6 text-center relative">
                  <Corners color={`${rank.color}88`} />
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF2D78] animate-pulse" />
                    <span className="dossier-note">РАЗВЕДКА ЗАВЕРШЕНА</span>
                  </div>
                  {isNewBest && (
                    <motion.div initial={{ scale: 0, rotate: -8 }} animate={{ scale: 1, rotate: -4 }}
                      className="absolute right-6 top-6 px-3 py-1 border-2 cut-sm font-display font-bold text-xs"
                      style={{ color: NEON, borderColor: NEON, background: `${NEON}18` }}>
                      НОВЫЙ РЕКОРД
                    </motion.div>
                  )}
                  <div>
                    <div className="font-display text-6xl font-bold" style={{ color: rank.color }}>
                      {correct}<span className="text-2xl text-text-subtle">/{ROUNDS}</span>
                    </div>
                    <div className="mt-2 inline-block px-4 py-1 border cut-sm font-display font-bold text-sm" style={{ color: rank.color, borderColor: `${rank.color}66`, background: `${rank.color}14` }}>
                      {rank.title}
                    </div>
                  </div>
                  <div className="text-xs text-text-dim font-mono">
                    РЕКОРД: {best}/{ROUNDS} · ТОЧНОСТЬ: {Math.round((correct / ROUNDS) * 100)}%
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={restart} className="flex-1 px-6 py-3 bg-neon-400 text-black font-display font-bold cut-sm hover:bg-neon-300 transition-colors">
                      ЕЩЁ РАЗ [ENTER]
                    </button>
                    <button onClick={() => setPhase('intro')} className="flex-1 px-6 py-3 border border-brand-medium/50 text-text font-display cut-sm hover:bg-surface-2 transition-colors">
                      К БРИФИНГУ
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
