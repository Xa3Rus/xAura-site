import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { loadAnimeData } from '../utils/animeData'
import { shikimoriImg } from '../utils/imgUrl'
import { Corners, DossierPanel } from '../components/profile/SharedBits'

const ROUNDS = 10
const BEST_KEY = 'oped_best_score'

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

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Приборная плитка показателя
function Readout({ value, label, code, color = '#BBF351' }) {
  return (
    <div className="cut-wrap cut-sm min-w-[92px]" style={{ background: `linear-gradient(150deg, ${color}26, rgba(45,74,15,0.2))` }}>
      <div className="cut-inner cut-sm relative bg-[#070905] px-3 py-2 overflow-hidden">
        <div className="absolute bottom-0 inset-x-0 h-1.5 gauge-ticks opacity-25" />
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display font-bold text-base leading-none" style={{ color }}>{value}</span>
          <span className="font-mono text-[8px] text-text-subtle">{code}</span>
        </div>
        <span className="block mt-1 text-[8px] uppercase tracking-[0.14em] font-mono text-text-subtle">{label}</span>
      </div>
    </div>
  )
}

function ListeningState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-2 overflow-hidden">
      <div className="absolute inset-0 scanlines pointer-events-none opacity-50" />
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
            className="w-1 bg-neon-400/70"
            animate={{ height: [6, 18, 10, 20, 6] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="dossier-note">слушай и угадывай</span>
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
  // разбор раундов: { ok, anime, title, channel, type }
  const [answers, setAnswers] = useState([])
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)
  const [isNewBest, setIsNewBest] = useState(false)
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
    setIsNewBest(false)
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
    setAnswers((prev) => [...prev, {
      ok: option.isCorrect,
      anime: currentSong.animeData?.russian || currentSong.anime,
      title: currentSong.title,
      channel: currentSong.channel,
      type: currentSong.type_number || currentSong.type,
    }])
    if (option.isCorrect) setScore((s) => s + 1)
    setPlayedIds((prev) => new Set([...prev, currentSong.video_id]))
  }

  // выбор клавишами 1–4, подтверждение — Enter/Space
  useEffect(() => {
    const onKey = (e) => {
      if (phase === 'playing' && selected === null) {
        const idx = ['1', '2', '3', '4'].indexOf(e.key)
        if (idx !== -1 && options[idx]) handleSelect(options[idx])
      } else if (phase === 'playing' && showResult && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        handleNext()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, selected, options, currentSong, showResult])

  const handleNext = () => {
    if (round >= ROUNDS) {
      setPhase('gameover')
    } else {
      nextRound()
    }
  }

  // фиксация лучшего результата
  useEffect(() => {
    if (phase !== 'gameover') return
    if (score > bestScore) {
      localStorage.setItem(BEST_KEY, String(score))
      setIsNewBest(true)
      setBestScore(score)
    }
  }, [phase])

  const getPosterUrl = (song) => {
    const img = song.animeData?.image?.original
    return shikimoriImg(img)
  }

  const lastAnswer = answers[answers.length - 1]
  const accuracy = Math.round((score / ROUNDS) * 100)

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[560px] h-[380px] rounded-full opacity-70" style={{ background: 'radial-gradient(circle, rgba(187,243,81,0.08), transparent 70%)' }} />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-5">
          <Ribbon left="OP/ED // МУЗЫКАЛЬНАЯ ВИКТОРИНА" right={`${songs.length || '…'} треков в базе`} />
        </div>

        <AnimatePresence mode="wait">
          {phase === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-6"
            >
              <DossierPanel cut="cut-lg" className="overflow-hidden px-6 sm:px-10 py-12 text-center">
                <div className="absolute inset-0 dots-bg opacity-20 pointer-events-none" />
                <Corners inset={4} size={11} />
                <div className="absolute bottom-0 inset-x-0 h-2 gauge-ticks opacity-20 pointer-events-none" />

                <div className="relative">
                  <motion.div
                    className="w-20 h-20 mx-auto flex items-center justify-center mb-6 bg-surface-1 border border-neon-400/20 shadow-glow-neon"
                    animate={{ rotate: [0, -4, 4, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg className="w-9 h-9 text-neon-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </motion.div>

                  <div className="flex items-center gap-2.5 justify-center mb-4">
                    <span className="w-1.5 h-1.5 bg-neon-400 animate-pulse" />
                    <span className="dossier-note !text-neon-400/75">угадай аниме по опенингу или эндингу</span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Угадай аниме</h1>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mb-7">
                    100 секунд трека · 4 варианта · 10 раундов
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <Readout value={songs.length || '…'} label="треков" code="DB" />
                    <Readout value={ROUNDS} label="раундов" code="RND" />
                    <Readout value="4" label="варианта" code="OPT" />
                    {bestScore > 0 && <Readout value={bestScore} label="твой рекорд" code="REC" color="#00E5FF" />}
                  </div>

                  <button onClick={startGame} className="btn-primary btn-shine text-sm !px-10 !py-3">
                    Начать ▶
                  </button>
                  <p className="mt-5 dossier-note">клавиши 1–4 · ввод — далее</p>
                </div>
              </DossierPanel>
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
              <div className="mt-6 dossier-note">наушники recommended</div>
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
                        className={`relative h-[4px] flex-1 overflow-hidden ${answered ? (answers[i].ok ? 'bg-success' : 'bg-danger') : isCurrent ? 'bg-neon-400/25' : 'bg-surface-3'}`}
                      >
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 chevron-fill opacity-60"
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="font-mono text-[10px] text-text-muted whitespace-nowrap">{round}/{ROUNDS}</span>
                <span className="font-mono text-xs font-bold text-neon-400 whitespace-nowrap">★ {score}</span>
              </div>

              {/* видеорамка */}
              <div className="relative mb-5 bg-surface-1 border border-brand-medium/50 shadow-neon">
                <Corners size={10} inset={3} />
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
                <div className="absolute top-2.5 left-2.5 flex items-center gap-2 pointer-events-none">
                  <span className="px-1.5 py-px bg-black/70 backdrop-blur-sm font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-neon-400 border border-neon-400/30">
                    трек {round}/{ROUNDS}
                  </span>
                  {showVideo && (
                    <span className="px-1.5 py-px bg-black/70 backdrop-blur-sm font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/70 border border-white/20">
                      {currentSong.type === 'opening' ? 'Opening' : 'Ending'}{currentSong.theme_number ? ` ${currentSong.theme_number}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-center mb-3 dossier-note">
                какое это аниме? · клавиши 1–4
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
                      className={`relative flex items-center gap-3 p-2.5 text-left transition-all duration-300 border ${
                        showCorrectHighlight
                          ? 'ring-2 ring-success border-success/40 bg-success/10'
                          : showWrongHighlight
                            ? 'ring-2 ring-danger border-danger/40 bg-danger/10'
                            : showResult
                              ? 'border-surface-3 bg-surface-1/60 opacity-50'
                              : 'border-neon-400/10 bg-surface-1 hover:border-neon-400/40'
                      }`}
                    >
                      <span className="absolute top-1.5 left-1.5 w-4 h-4 flex items-center justify-center font-mono text-[9px] font-bold bg-black/60 text-text-muted border border-white/10 z-10">
                        {i + 1}
                      </span>
                      {poster ? (
                        <img src={poster} alt="" className="w-11 h-16 rounded-sm object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-16 rounded-sm bg-surface-2 flex items-center justify-center flex-shrink-0">
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
                  <div
                    className="cut-wrap cut-sm inline-block text-left"
                    style={{ background: lastAnswer?.ok ? 'linear-gradient(150deg, rgba(0,204,136,0.35), rgba(0,80,55,0.3))' : 'linear-gradient(150deg, rgba(255,51,102,0.32), rgba(77,0,26,0.3))' }}
                  >
                    <div className={`cut-inner cut-sm relative px-5 py-3 bg-[#070905]`}>
                      <span className={`dossier-note block mb-1 ${lastAnswer?.ok ? '!text-success/80' : '!text-danger/80'}`}>
                        {lastAnswer?.ok ? 'верно' : 'неверно'}
                      </span>
                      <p className={`text-sm font-bold mb-1 ${lastAnswer?.ok ? 'text-success' : 'text-danger'}`}>
                        {lastAnswer?.ok ? 'В точку!' : `Это ${currentSong.animeData?.russian || currentSong.anime}`}
                      </p>
                      {currentSong.title && (
                        <p className="text-[10px] text-text-muted font-mono truncate max-w-[320px]">♪ {currentSong.title}</p>
                      )}
                      {currentSong.channel && (
                        <p className="text-[9px] text-text-subtle font-mono truncate max-w-[320px]">{currentSong.channel}</p>
                      )}
                    </div>
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
              className="py-6"
            >
              <DossierPanel cut="cut-lg" className="overflow-hidden px-6 sm:px-10 py-12 text-center">
                <div className="absolute inset-0 dots-bg opacity-20 pointer-events-none" />
                <Corners inset={4} size={11} />

                <div className="relative">
                  <div className="flex items-center gap-2.5 justify-center mb-5">
                    <span className={`w-1.5 h-1.5 animate-pulse ${isNewBest ? 'bg-neon-400' : 'bg-cyan-400'}`} />
                    <span className="dossier-note !text-neon-400/75">протокол прослушивания завершён</span>
                  </div>

                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                    className="w-20 h-20 mx-auto flex items-center justify-center mb-6 bg-surface-1 border border-neon-400/20 shadow-glow-neon"
                  >
                    <svg className={`w-10 h-10 ${score >= 8 ? 'text-neon-400' : 'text-text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {score >= 8 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      )}
                    </svg>
                  </motion.div>

                  <h2 className="text-2xl font-bold mb-1 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
                    {score >= 9 ? 'Идеальный слух!' : score >= 8 ? 'Великолепно!' : score >= 5 ? 'Хороший результат!' : 'Стоит попробовать ещё раз'}
                  </h2>

                  {isNewBest && (
                    <span className="stamp inline-block px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-neon-400 mb-2">
                      новый рекорд
                    </span>
                  )}

                  <div className="my-6">
                    <div className="text-6xl font-bold text-neon-400 drop-shadow-[0_0_25px_rgba(187,243,81,0.3)]" style={{ fontFamily: 'Source Code Pro' }}>
                      {score}<span className="text-2xl text-text-muted">/{ROUNDS}</span>
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted mt-2">
                      верных ответов · {accuracy}%
                    </div>
                    <div className="max-w-xs mx-auto mt-4 relative h-2 bg-surface-3 overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 chevron-fill opacity-70"
                        initial={{ width: 0 }}
                        animate={{ width: `${accuracy}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                      />
                    </div>
                  </div>

                  {/* разбор раундов */}
                  {answers.length > 0 && (
                    <div className="relative text-left border border-brand-medium/50 bg-black/30 mb-7">
                      <Corners size={8} inset={2} color="rgba(187,243,81,0.3)" />
                      <div className="px-4 py-2 border-b border-brand-medium/40">
                        <span className="dossier-note">разбор раундов</span>
                      </div>
                      <div className="divide-y divide-brand-medium/25 max-h-56 overflow-y-auto">
                        {answers.map((a, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2">
                            <span className="font-mono text-[10px] font-bold text-text-subtle w-5">{String(i + 1).padStart(2, '0')}</span>
                            <span className={`font-mono text-[10px] font-bold w-4 ${a.ok ? 'text-success' : 'text-danger'}`}>{a.ok ? '✓' : '✗'}</span>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[11px] text-text truncate">{a.anime}</span>
                              {a.title && <span className="block text-[9px] text-text-subtle font-mono truncate">♪ {a.title}</span>}
                            </div>
                            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-text-subtle whitespace-nowrap hidden sm:inline">
                              {a.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button onClick={startGame} className="btn-primary btn-shine text-xs !py-3">
                      Заново
                    </button>
                    <Link to="/" className="btn-ghost text-xs !py-3">
                      На главную
                    </Link>
                  </div>
                  <p className="mt-5 dossier-note">лучший: {bestScore}/{ROUNDS} · сохраняется локально</p>
                </div>
              </DossierPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
