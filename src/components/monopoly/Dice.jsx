import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const FACES = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
}

const rand = () => Math.floor(Math.random() * 6) + 1

export function Die({ value, size = 52, glow = false }) {
  const dots = FACES[value] || []
  return (
    <div
      className="rounded-xl"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #161616 0%, #0A0A0A 100%)',
        border: `1px solid ${glow ? 'rgba(187,243,81,0.5)' : 'rgba(187,243,81,0.2)'}`,
        boxShadow: glow
          ? '0 0 16px rgba(187,243,81,0.35), inset 0 1px 2px rgba(255,255,255,0.06)'
          : '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.06)',
      }}
    >
      <div className="grid grid-cols-3 w-full h-full" style={{ padding: '16%', gap: '4%' }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const hasDot = dots.some(([r, c]) => r === Math.floor(i / 3) && c === i % 3)
          return (
            <div key={i} className="flex items-center justify-center">
              {hasDot && (
                <div
                  className="rounded-full"
                  style={{
                    width: '80%',
                    height: '80%',
                    background: 'radial-gradient(circle at 30% 30%, #DDFF99 0%, #BBF351 70%)',
                    boxShadow: '0 0 6px rgba(187,243,81,0.6)',
                  }}
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
  const [faces, setFaces] = useState([1, 1])
  const [landed, setLanded] = useState(false)
  const shuffleRef = useRef(null)

  useEffect(() => () => clearInterval(shuffleRef.current), [])

  // while the roll is in flight — tumble with random faces;
  // when it settles (rolling=false and result known) — snap to result with a bounce
  useEffect(() => {
    if (rolling) {
      setLanded(false)
      shuffleRef.current = setInterval(() => setFaces([rand(), rand()]), 75)
      return () => clearInterval(shuffleRef.current)
    }
    if (dice?.[0] && dice?.[1]) {
      clearInterval(shuffleRef.current)
      setFaces([dice[0], dice[1]])
      setLanded(true)
      const t = setTimeout(() => setLanded(false), 600)
      return () => clearTimeout(t)
    }
  }, [rolling, dice])

  const handleRoll = () => {
    if (disabled || rolling) return
    setLanded(false)
    onRoll()
  }

  const isDouble = faces[0] === faces[1]
  const total = (faces[0] || 0) + (faces[1] || 0)
  const showTotal = !rolling && dice

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="flex gap-2"
        animate={
          rolling
            ? { rotate: [0, -10, 9, -7, 6, 0], y: [0, -7, 2, -4, 0] }
            : landed
              ? { rotate: 0, y: 0, scale: [1, 1.16, 1] }
              : { rotate: 0, y: 0, scale: 1 }
        }
        transition={
          rolling
            ? { duration: 0.45, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.45, ease: 'easeOut' }
        }
      >
        <motion.div animate={rolling ? { rotate: [-8, 12, -10, 8, -8] } : { rotate: 0 }} transition={rolling ? { duration: 0.4, repeat: Infinity } : { duration: 0.3 }}>
          <Die value={faces[0]} size={48} glow={landed} />
        </motion.div>
        <motion.div animate={rolling ? { rotate: [10, -12, 8, -9, 10] } : { rotate: 0 }} transition={rolling ? { duration: 0.4, repeat: Infinity, delay: 0.05 } : { duration: 0.3 }}>
          <Die value={faces[1]} size={48} glow={landed} />
        </motion.div>
      </motion.div>

      {isMyTurn && (
        <motion.button
          onClick={handleRoll}
          disabled={disabled || rolling}
          className="btn-primary text-sm !py-3 !px-6 disabled:opacity-40"
          whileHover={{ scale: disabled || rolling ? 1 : 1.03 }}
          whileTap={{ scale: disabled || rolling ? 1 : 0.97 }}
          style={{ minWidth: 120 }}
        >
          {rolling ? (
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

      {showTotal && (
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(187,243,81,0.12)', border: '1px solid rgba(187,243,81,0.25)' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: landed ? [0, 1, 1] : 1, scale: landed ? [0.7, 1.1, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-[11px] font-mono" style={{ color: '#A0A0A0' }}>
            {isDouble ? '⚡ Дубль: ' : '🎲 '}
            <span className="text-neon-400 font-bold text-lg">
              {faces[0]} + {faces[1]} = <span className="text-xl">{total}</span>
            </span>
          </span>
        </motion.div>
      )}
    </div>
  )
}
