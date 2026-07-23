import { useState, useEffect, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'
import BattleCard from '../components/BattleCard'
import GameOverModal from '../components/GameOverModal'
import Loader from '../components/Loader'

function generatePair(pool) {
  if (pool.length < 2) return null
  let a, b, attempts = 0
  do {
    a = pool[Math.floor(Math.random() * pool.length)]
    b = pool[Math.floor(Math.random() * pool.length)]
    attempts++
  } while (
    (a.id === b.id || Number(a.score) === Number(b.score) || Math.abs(Number(a.score) - Number(b.score)) > 0.7) &&
    attempts < 100
  )
  if (attempts >= 100) {
    a = pool[Math.floor(Math.random() * pool.length)]
    const candidates = pool.filter((x) => x.id !== a.id && Number(x.score) !== Number(a.score))
    if (candidates.length > 0) {
      b = candidates[Math.floor(Math.random() * candidates.length)]
    } else {
      b = pool.filter((x) => x.id !== a.id)[Math.floor(Math.random() * (pool.length - 1))]
    }
  }
  return [a, b]
}

function buildBattlePool(allAnime) {
  const popular = allAnime.filter((a) => Number(a.score) >= 7)
  const niche = allAnime.filter((a) => Number(a.score) >= 5 && Number(a.score) < 7)

  const shuffledPopular = [...popular].sort(() => Math.random() - 0.5)
  const shuffledNiche = [...niche].sort(() => Math.random() - 0.5)

  return [...shuffledPopular, ...shuffledNiche.slice(0, Math.floor(popular.length * 0.2))]
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
  const [battlePool, setBattlePool] = useState([])

  useEffect(() => {
    loadAnimeData().then((data) => {
      const pool = data.filter((a) => a.score > 0 && a.image?.original && !a.image.original.includes('missing_') && Number(a.aired_on?.split('-')[0]) > 1990)
      setAllAnime(pool)
      setBattlePool(buildBattlePool(pool))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) {
      supabase.from('battle_games').select('score').eq('user_id', user.id).order('score', { ascending: false }).limit(1).then(({ data }) => {
        if (data?.length) setBestScore(data[0].score)
      })
    }
  }, [user])

  const startGame = useCallback(() => {
    setScore(0)
    setGameOver(false)
    setIsNewRecord(false)
    setStarted(true)
    setResult(null)
    const newPool = buildBattlePool(allAnime)
    setBattlePool(newPool)
    setPair(generatePair(newPool))
  }, [allAnime])

  useEffect(() => {
    if (battlePool.length > 0 && !started) {
      setPair(generatePair(battlePool))
      setStarted(true)
    }
  }, [battlePool, started])

  const handleChoice = async (chosenAnime) => {
    if (disabled || !pair) return
    setDisabled(true)

    const [left, right] = pair
    const other = chosenAnime.id === left.id ? right : left
    const chosenScore = Number(chosenAnime.score)
    const otherScore = Number(other.score)

    const isCorrect = chosenScore >= otherScore

    if (isCorrect) {
      const newScore = score + 1
      setScore(newScore)

      if (newScore > bestScore) {
        setBestScore(newScore)
        setIsNewRecord(true)
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#f59e0b', '#10b981', '#f97316', '#fbbf24'] })
      }

      setResult({ winner: chosenAnime.id, loser: other.id })

      setTimeout(() => {
        const newPair = generatePair(battlePool)
        setPair(newPair)
        setResult(null)
        setDisabled(false)
      }, 1200)
    } else {
      setResult({ wrong: chosenAnime.id, correct: other.id })

      setTimeout(() => {
        setGameOver(true)
        setDisabled(false)
        if (user) saveResult(score)
      }, 1500)
    }
  }

  const saveResult = async (finalScore) => {
    if (!user) return
    await supabase.from('battle_games').insert({
      user_id: user.id,
      score: finalScore,
      mode: 'rating',
    })
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader text="Загрузка..." /></div>

  if (!pair) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-sm" style={{ color: 'rgba(255,255,255,0.15)' }}>Недостаточно аниме</p></div>

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8 page-enter">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>Битва тайтлов</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Какое аниме имеет более высокий рейтинг?</p>
        </div>

        <div className="text-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={score}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="inline-block"
            >
              <span className="text-4xl font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono', textShadow: '0 0 30px rgba(251,191,36,0.2)' }}>{score}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
          <BattleCard
            anime={pair[0]}
            side="left"
            result={
              result?.winner === pair[0].id ? 'winner' :
              result?.loser === pair[0].id ? 'loser' :
              result?.wrong === pair[0].id ? 'wrong' :
              result?.correct === pair[0].id && result?.wrong ? 'winner' : null
            }
            onClick={() => handleChoice(pair[0])}
            disabled={disabled}
          />

          <BattleCard
            anime={pair[1]}
            side="right"
            result={
              result?.winner === pair[1].id ? 'winner' :
              result?.loser === pair[1].id ? 'loser' :
              result?.wrong === pair[1].id ? 'wrong' :
              result?.correct === pair[1].id && result?.wrong ? 'winner' : null
            }
            onClick={() => handleChoice(pair[1])}
            disabled={disabled}
          />
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mb-4"
            >
              <div className="inline-block rounded-xl px-5 py-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Рейтинги: </span>
                {pair.map((a) => (
                  <span key={a.id} className={`text-xs font-bold mx-1.5 ${
                    result.winner === a.id || result.correct === a.id ? 'text-mint-400' : 'text-coral-400'
                  }`} style={{ fontFamily: 'JetBrains Mono' }}>
                    {a.russian || a.name} — {Number(a.score).toFixed(2)}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
