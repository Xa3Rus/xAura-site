import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const FACES = {
  1: [[1,1]],
  2: [[0,2],[2,0]],
  3: [[0,2],[1,1],[2,0]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
}

function Die({ value, size = 56, className = '' }) {
  const dots = FACES[value] || []

  return (
    <div className={`relative rounded-xl flex items-center justify-center ${className}`} style={{ width: size, height: size, background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.3)' }}>
      <div className="grid grid-cols-3 gap-[3px] p-1" style={{ width: size * 0.7, height: size * 0.7 }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const hasDot = dots.some(([r, c]) => r === Math.floor(i / 3) && c === i % 3)
          return (
            <div key={i} className="flex items-center justify-center">
              {hasDot && (
                <motion.div
                  className="rounded-full"
                  style={{ width: size / 7, height: size / 7, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.05 }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dice({ onRoll, disabled, dice, rolling, isMyTurn }) {
  const [d1, setD1] = useState(1)
  const [d2, setD2] = useState(1)
  const [animating, setAnimating] = useState(false)
  const [rollResult, setRollResult] = useState(null)
  const diceRef = useRef(null)
  const rollCountRef = useRef(0)

  const handleRoll = () => {
    if (disabled || animating) return
    setAnimating(true)
    rollCountRef.current = 0

    const interval = setInterval(() => {
      setD1(Math.floor(Math.random() * 6) + 1)
      setD2(Math.floor(Math.random() * 6) + 1)
      rollCountRef.current++
      if (rollCountRef.current >= 18) {
        clearInterval(interval)
        setAnimating(false)
        if (dice) {
          setRollResult(dice)
          setTimeout(() => setRollResult(null), 2000)
        }
        onRoll()
      }
    }, 50)
  }

  useEffect(() => {
    if (dice && !animating) {
      setD1(dice[0])
      setD2(dice[1])
    }
  }, [dice, animating])

  const currentD1 = rollResult ? rollResult[0] : d1
  const currentD2 = rollResult ? rollResult[1] : d2
  const isDouble = currentD1 === currentD2
  const total = currentD1 + currentD2

  return (
    <div className="flex items-center gap-3">
      <motion.div
        ref={diceRef}
        className="flex gap-2"
        animate={{
          rotateY: animating ? 720 : 0,
          rotateX: animating ? 360 : 0,
          rotateZ: animating ? 180 : 0,
        }}
        transition={{ duration: 0.6, ease: 'easeOut', repeat: animating ? Infinity : 0 }}
      >
        <motion.div
          className="relative"
          animate={{
            rotateY: animating ? [0, 360, 720] : 0,
            rotateX: animating ? [0, -360, -720] : 0,
          }}
          transition={{ duration: 0.6, ease: 'easeInOut', repeat: animating ? Infinity : 0 }}
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
          <Die value={currentD1} size={56} />
        </motion.div>
        <motion.div
          className="relative"
          animate={{
            rotateY: animating ? [0, -360, -720] : 0,
            rotateX: animating ? [0, 360, 720] : 0,
          }}
          transition={{ duration: 0.6, ease: 'easeInOut', repeat: animating ? Infinity : 0 }}
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
          <Die value={currentD2} size={56} />
        </motion.div>
      </motion.div>

      {isMyTurn && (
        <motion.button
          onClick={handleRoll}
          disabled={disabled || animating}
          className="btn-primary text-sm !py-3 !px-6 disabled:opacity-40"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ minWidth: '120px' }}
        >
          {animating ? (
            <span className="flex items-center gap-2">
              <motion.div
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
              />
              Бросок...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-lg">🎲</span>
              Бросить
            </span>
          )}
        </motion.button>
      )}

      {total > 0 && !animating && (
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isDouble ? '⚡ Дубль: ' : '🎲 '}
            <span className="text-amber-400 font-bold text-lg">{currentD1} + {currentD2} = <span className="text-xl">{total}</span></span>
          </span>
        </motion.div>
      )}
    </div>
  )
}