import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { loadAnimeData } from '../utils/animeData'
import { shikimoriImg } from '../utils/imgUrl'

const ROUNDS = 10

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function ListeningState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-2 overflow-hidden">
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-neon-400/20"
            style={{ width: 80, height: 80 }}
            animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.65, ease: 'easeOut' }}
          />
        ))}
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-surface-4 to-surface-3 border border-neon-400/25 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, #111 28%, transparent 29%)' }}>
            <div className="w-2 h-2 rounded-full bg-neon-400" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div key={deg} className="absolute w-px h-5 bg-neon-400/20 origin-bottom" style={{ transform: `rotate(${deg}deg) translateY(-10px)` }} />
            ))}
          </div>
        </motion.div>
      </div>
      <div className="flex items-end gap-1 h-5">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-neon-400/70"
            animate={{ height: [6, 18, 10, 20, 6] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted">Слушай и угадывай...</span>
    </div>
  )
}

export default function AnimeOPED() {
  const [allAnime, setAllAnime] = useState([])
  const [songs, setSongs] = useState([])
  const [phase, setPhase] = useState('start')
  const [countdown, setCountdown] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [currentSong, setCurrentSong] = useState(null)
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [correctId, setCorrectId] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [playedIds, setPlayedIds] = useState(new Set())
  const [showVideo, setShowVideo] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [answers, setAnswers] = useState([])
  const playerRef = useRef(null)
  const countdownRef = useRef(null)

  useEffect(() => {
    Promise.all([
      loadAnimeData(),
      fetch('/data/songs.json').then((r) => r.json()),
    ]).then(([animeData, songsData]) => {
      setAllAnime(animeData)
      const animeMap = {}
      for (const a of animeData) {
        animeMap[(a.name || '').toLowerCase()] = a
        animeMap[(a.russian || '').toLowerCase()] = a
      }
      const matched = songsData.filter((s) => {
        if (!s.video_id) return false
        const key = (s.anime || '').toLowerCase()
        return animeMap[key]
      })
      const withAnime = matched.map((s) => ({
        ...s,
        animeData: animeMap[(s.anime || '').toLowerCase()],
      }))
      setSongs(withAnime)
    })
  }, [])

  const pickRound = useCallback(() => {
    const available = songs.filter((s) => !playedIds.has(s.video_id))
    if (available.length === 0) return null
    const correct = available[Math.floor(Math.random() * available.length)]

    const wrongPool = songs.filter((s) => s.anime !== correct.anime && !playedIds.has(s.video_id))
    const shuffled = shuffleArray(wrongPool).slice(0, 3)
    const opts = shuffleArray([
      { ...correct, isCorrect: true },
      ...shuffled.map((s) => ({ ...s, isCorrect: false })),
    ])
    return { correct, opts }
  }, [songs, playedIds])

  const startGame = () => {
    setScore(0)
    setRound(0)
    setPlayedIds(new Set())
    setSelected(null)
    setShowResult(false)
    setAnswers([])
    setPhase('countdown')
    setCountdown(3)
  }

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(countdownRef.current)
    }
    if (phase === 'countdown' && countdown === 0) {
      nextRound()
    }
  }, [phase, countdown])

  const nextRound = () => {
    setSelected(null)
    setShowResult(false)
    setCorrectId(null)
    setShowVideo(false)
    const r = pickRound()
    if (!r || round >= ROUNDS) {
      setPhase('gameover')
      return
    }
    setCurrentSong(r.correct)
    setOptions(r.opts)
    setPhase('playing')
    setRound((prev) => prev + 1)
  }

  const handleSelect = (option) => {
    if (selected !== null) return
    setSelected(option)
    setCorrectId(currentSong.video_id)
    setShowResult(true)
    setShowVideo(true)
    setAnswers((prev) => [...prev, option.isCorrect])
    if (option.isCorrect) setScore((s) => s + 1)
    setPlayedIds((prev) => new Set([...prev, currentSong.video_id]))
  }

  // выбор клавишами 1–4
  useEffect(() => {
    if (phase !== 'playing' || selected !== null) return
    const onKey = (e) => {
      const idx = ['1', '2', '3', '4'].indexOf(e.key)
      if (idx !== -1 && options[idx]) handleSelect(options[idx])
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, selected, options, currentSong])

  const handleNext = () => {
    if (round >= ROUNDS) {
      setPhase('gameover')
    } else {
      nextRound()
    }
  }

  const getPosterUrl = (song) => {
    const img = song.animeData?.image?.original
    return shikimoriImg(img)
    return null
  }

  const lastAnswer = answers[answers.length - 1]

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[560px] h-[380px] bg-neon-400/[0.04] rounded-full blur-[140px]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {phase === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-12"
            >
              <div className="hero-panel relative overflow-hidden px-6 sm:px-10 py-12 text-center">
                <div className="absolute inset-0 neon-grid pointer-events-none" />
                <div className="relative">
                  <motion.div
                    className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-surface-1 border border-neon-400/20 shadow-glow-neon"
                    animate={{ rotate: [0, -4, 4, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg className="w-9 h-9 text-neon-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </motion.div>
                  <h1 className="text-3xl font-bold mb-2 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Угадай аниме</h1>
                  <p className="text-sm mb-1 text-text-muted">по опенингу или эндингу</p>
                  <div className="flex flex-wrap justify-center gap-2 my-6">
                    {[
                      { value: songs.length, label: 'треков' },
                      { value: ROUNDS, label: 'раундов' },
                      { value: '4', label: 'варианта' },
                    ].map((p) => (
                      <div key={p.label} className="flex items-baseline gap-1.5 rounded-md px-2.5 py-1 bg-surface-1/70 border border-neon-400/15">
                        <span className="font-display font-bold text-sm text-neon-400">{p.value}</span>
                        <span className="text-[10px] text-text-muted">{p.label}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={startGame} className="btn-primary btn-shine text-sm !px-10 !py-3">
                    Начать ▶
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="text-center py-32"
            >
              <div className="relative inline-flex items-center justify-center">
                <motion.div
                  className="absolute w-28 h-28 rounded-full border border-neon-400/25"
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.span
                  key={countdown}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="text-7xl font-bold text-neon-400 drop-shadow-[0_0_25px_rgba(187,243,81,0.4)]"
                  style={{ fontFamily: 'Source Code Pro' }}
                >
                  {countdown || '▶'}
                </motion.span>
              </div>
            </motion.div>
          )}

          {phase === 'playing' && currentSong && (
            <motion.div
              key={`round-${round}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* прогресс раундов */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 flex gap-1">
                  {Array.from({ length: ROUNDS }, (_, i) => {
                    const answered = i < answers.length
                    const isCurrent = i === answers.length
                    return (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          answered
                            ? answers[i] ? 'bg-success' : 'bg-danger'
                            : isCurrent
                              ? 'bg-neon-400 animate-pulse'
                              : 'bg-surface-3'
                        }`}
                      />
                    )
                  })}
                </div>
                <span className="font-mono text-[10px] text-text-muted whitespace-nowrap">{round}/{ROUNDS}</span>
                <span className="font-mono text-xs font-bold text-neon-400 whitespace-nowrap">★ {score}</span>
              </div>

              <div className="rounded-2xl overflow-hidden mb-5 relative bg-surface-1 border border-neon-400/10 shadow-neon">
                <div className="aspect-video">
                  <iframe
                    ref={playerRef}
                    width="100%"
                    height="100%"
                    key={`${currentSong.video_id}-${replayKey}`}
                    src={`https://www.youtube.com/embed/${currentSong.video_id}?autoplay=1&start=30&end=130&rel=0&modestbranding=1`}
                    title={currentSong.title}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className={`w-full h-full transition-opacity duration-500 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {!showVideo && <ListeningState />}
                </div>
                {showVideo && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                    <span className="tag !bg-black/60 !text-neon-400 !border-neon-400/30 backdrop-blur-sm">
                      {currentSong.type === 'opening' ? 'Opening' : 'Ending'}{currentSong.type_number ? ` ${currentSong.type_number}` : ''}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-center mb-3 text-text-muted">
                Какое это аниме? <span className="text-text-subtle font-mono">(клик или клавиши 1–4)</span>
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {options.map((opt, i) => {
                  const poster = getPosterUrl(opt)
                  const isSelected = selected?.video_id === opt.video_id
                  const isCorrect = opt.isCorrect
                  const showCorrectHighlight = showResult && isCorrect
                  const showWrongHighlight = showResult && isSelected && !isCorrect

                  return (
                    <motion.button
                      key={opt.video_id + i}
                      onClick={() => handleSelect(opt)}
                      disabled={selected !== null}
                      whileHover={selected === null ? { scale: 1.02, y: -2 } : {}}
                      whileTap={selected === null ? { scale: 0.98 } : {}}
                      className={`relative flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-300 border ${
                        showCorrectHighlight
                          ? 'ring-2 ring-success border-success/40 bg-success/10'
                          : showWrongHighlight
                            ? 'ring-2 ring-danger border-danger/40 bg-danger/10'
                            : showResult
                              ? 'border-surface-3 bg-surface-1/60 opacity-50'
                              : 'border-neon-400/10 bg-surface-1 hover:border-neon-400/40'
                      }`}
                    >
                      <span className="absolute top-1.5 left-1.5 w-4 h-4 rounded flex items-center justify-center font-mono text-[9px] font-bold bg-black/50 text-text-muted border border-white/10 z-10">
                        {i + 1}
                      </span>
                      {poster ? (
                        <img src={poster} alt="" className="w-11 h-16 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-16 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-text-muted">
                            {(opt.animeData?.russian || opt.anime || '?')[0]}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pr-5">
                        <span className="block text-xs font-medium truncate text-text">
                          {opt.animeData?.russian || opt.anime}
                        </span>
                      </div>
                      {showCorrectHighlight && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-success/20 border border-success/50 flex items-center justify-center">
                          <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                      )}
                      {showWrongHighlight && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-danger/20 border border-danger/50 flex items-center justify-center">
                          <svg className="w-3 h-3 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className={`inline-flex flex-col items-center gap-1 rounded-xl px-6 py-3 border backdrop-blur-sm ${
                    lastAnswer ? 'bg-success/10 border-success/30' : 'bg-danger/10 border-danger/30'
                  }`}>
                    <p className={`text-sm font-bold ${lastAnswer ? 'text-success' : 'text-danger'}`}>
                      {lastAnswer ? 'Верно!' : `Неверно — это ${currentSong.animeData?.russian || currentSong.anime}`}
                    </p>
                    {currentSong.title && (
                      <p className="text-[10px] text-text-muted font-mono truncate max-w-[320px]">♪ {currentSong.title}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2.5 mt-4">
                    <button
                      onClick={() => setReplayKey((k) => k + 1)}
                      className="btn-ghost text-xs !py-2.5"
                    >
                      ↻ Переслушать
                    </button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext} className="btn-primary btn-shine text-xs !py-2.5">
                      {round >= ROUNDS ? 'Результат' : 'Далее →'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {phase === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-10"
            >
              <div className="hero-panel relative overflow-hidden px-6 sm:px-10 py-12 text-center">
                <div className="absolute inset-0 neon-grid pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 bg-neon-600/[0.08] rounded-full blur-[90px] pointer-events-none" />
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                    className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 bg-surface-1 border border-neon-400/20 shadow-glow-neon"
                  >
                    <svg className={`w-10 h-10 ${score >= 8 ? 'text-neon-400' : 'text-text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {score >= 8 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      )}
                    </svg>
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
                    {score >= 9 ? 'Идеальный слух!' : score >= 8 ? 'Великолепно!' : score >= 5 ? 'Хороший результат!' : 'Стоит попробовать ещё раз'}
                  </h2>
                  <div className="my-6">
                    <div className="text-6xl font-bold text-neon-400 drop-shadow-[0_0_25px_rgba(187,243,81,0.3)]" style={{ fontFamily: 'Source Code Pro' }}>
                      {score}<span className="text-2xl text-text-muted">/{ROUNDS}</span>
                    </div>
                    <div className="label !mb-0 mt-2">верных ответов · {Math.round((score / ROUNDS) * 100)}%</div>
                    <div className="max-w-xs mx-auto mt-4 h-2 rounded-full bg-surface-3 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-neon-600 to-neon-300"
                        initial={{ width: 0 }}
                        animate={{ width: `${(score / ROUNDS) * 100}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={startGame} className="btn-primary btn-shine text-xs !py-3">
                      Заново
                    </button>
                    <Link to="/" className="btn-ghost text-xs !py-3">
                      На главную
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
