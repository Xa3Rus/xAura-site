import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { loadAnimeData } from '../utils/animeData'

const ROUNDS = 10

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
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
    if (option.isCorrect) setScore((s) => s + 1)
    setPlayedIds((prev) => new Set([...prev, currentSong.video_id]))
  }

  const handleNext = () => {
    if (round >= ROUNDS) {
      setPhase('gameover')
    } else {
      nextRound()
    }
  }

  const getPosterUrl = (song) => {
    const img = song.animeData?.image?.original
    if (img && !img.includes('missing_')) return `https://shikimori.one${img}`
    return null
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-2xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {phase === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,115,22,0.08))', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk' }}>Угадай аниме</h1>
                <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>по опенингу или эндингу</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{songs.length} треков из {allAnime.length} аниме</p>
              </div>
              <button onClick={startGame} className="btn-primary text-sm !px-8 !py-3">
                Начать
              </button>
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
              <motion.span
                key={countdown}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="text-7xl font-bold text-amber-400"
                style={{ fontFamily: 'JetBrains Mono' }}
              >
                {countdown || '▶'}
              </motion.span>
            </motion.div>
          )}

          {phase === 'playing' && currentSong && (
            <motion.div
              key={`round-${round}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>
                    {round} / {ROUNDS}
                  </span>
                  <span className="tag !bg-amber-500/10 !text-amber-400 !border-amber-500/15">
                    {currentSong.type === 'opening' ? 'Opening' : 'Ending'}
                  </span>
                  {currentSong.type_number && (
                    <span className="tag">{currentSong.type_number}</span>
                  )}
                </div>
                <span className="text-sm font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono' }}>
                  ★ {score}
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden mb-6 relative" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                  {!showVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(10,10,12,0.95)' }}>
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                          <div className="flex items-end gap-1 h-6">
                            {[1,2,3,4,5].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-amber-400 rounded-full"
                                animate={{ height: [8, 20, 12, 24, 8] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Слушай и угадывай...</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-center mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Какое аниме?
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
                      whileHover={selected === null ? { scale: 1.02 } : {}}
                      whileTap={selected === null ? { scale: 0.98 } : {}}
                      className={`relative flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-300 ${
                        showCorrectHighlight ? 'ring-2 ring-green-500' : showWrongHighlight ? 'ring-2 ring-red-500' : ''
                      }`}
                      style={{
                        background: showCorrectHighlight
                          ? 'rgba(34,197,94,0.1)'
                          : showWrongHighlight
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                          showCorrectHighlight
                            ? 'rgba(34,197,94,0.3)'
                            : showWrongHighlight
                            ? 'rgba(239,68,68,0.3)'
                            : 'rgba(255,255,255,0.05)'
                        }`,
                      }}
                    >
                      {poster ? (
                        <img src={poster} alt="" className="w-10 h-14 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-14 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.1)' }}>
                            {(opt.animeData?.russian || opt.anime || '?')[0]}
                          </span>
                        </div>
                      )}
                      <span className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {opt.animeData?.russian || opt.anime}
                      </span>
                      {showCorrectHighlight && <span className="ml-auto text-green-400 text-sm">✓</span>}
                      {showWrongHighlight && <span className="ml-auto text-red-400 text-sm">✗</span>}
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
                  <p className="text-sm mb-4" style={{ color: selected?.isCorrect ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)' }}>
                    {selected?.isCorrect ? 'Верно!' : `Неверно! Это ${currentSong.animeData?.russian || currentSong.anime}`}
                  </p>
                  <div className="flex items-center justify-center gap-2.5">
                    <button
                      onClick={() => setReplayKey((k) => k + 1)}
                      className="btn-ghost text-xs !py-2.5"
                    >
                      ↻ Переслушать
                    </button>
                    <button onClick={handleNext} className="btn-primary text-xs !py-2.5">
                      {round >= ROUNDS ? 'Результат' : 'Далее →'}
                    </button>
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
              className="text-center py-16"
            >
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6" style={{ background: score >= 8 ? 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,115,22,0.08))' : 'rgba(255,255,255,0.03)', border: `1px solid ${score >= 8 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                  <svg className={`w-10 h-10 ${score >= 8 ? 'text-amber-400' : 'text-white/20'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {score >= 8 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    )}
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  {score >= 8 ? 'Великолепно!' : score >= 5 ? 'Хороший результат!' : 'Стоит попробовать ещё раз'}
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {score} из {ROUNDS} верных ответов
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono' }}>
                    ★ {score}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button onClick={startGame} className="btn-primary text-xs !py-2.5">
                  Заново
                </button>
                <Link to="/" className="btn-ghost text-xs !py-2.5">
                  На главную
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
