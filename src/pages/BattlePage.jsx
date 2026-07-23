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
    setBattlePool(buildBattlePool(allAnime))
    setPair(generatePair(buildBattlePool(allAnime)))
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
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#a855f7', '#7c3aed', '#22d3ee', '#4ade80'] })
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

  if (!pair) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-gray-400">Недостаточно аниме</p></div>

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-3xl font-black mb-2">🎮 Битва тайтлов</h1>
          <p className="text-gray-400">Какое аниме имеет более высокий рейтинг?</p>
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
              <span className="text-5xl font-black text-purple-400">{score}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mb-6"
            >
              <div className="glass-card inline-block px-6 py-3">
                <span className="text-gray-400">Рейтинги: </span>
                {pair.map((a) => (
                  <span key={a.id} className={`font-bold mx-2 ${
                    result.winner === a.id || result.correct === a.id ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {a.russian || a.name} — ★ {Number(a.score).toFixed(2)}
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
