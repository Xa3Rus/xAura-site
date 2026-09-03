import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DICE_FACES = {
  1: [[1,1]],
  2: [[0,2],[2,0]],
  3: [[0,2],[1,1],[2,0]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
}

function DiceFace({ value, size = 36 }) {
  const dots = DICE_FACES[value] || []
  const dotSize = size / 6

  return (
    <div
      className="rounded-lg flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="grid grid-cols-3 gap-[2px]" style={{ width: size * 0.6, height: size * 0.6 }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3)
          const col = i % 3
          const hasDot = dots.some(([r, c]) => r === row && c === col)
          return (
            <div key={i} className="flex items-center justify-center">
              {hasDot && (
                <div
                  className="rounded-full"
                  style={{
                    width: dotSize,
                    height: dotSize,
                    background: 'rgba(255,255,255,0.8)',
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

export default function DominionDice({ onRoll, disabled, dice, rolling }) {
  const [d1, setD1] = useState(1)
  const [d2, setD2] = useState(1)
  const [rollingAnim, setRollingAnim] = useState(false)

  const handleRoll = () => {
    if (disabled || rollingAnim) return
    setRollingAnim(true)

    let count = 0
    const interval = setInterval(() => {
      setD1(Math.floor(Math.random() * 6) + 1)
      setD2(Math.floor(Math.random() * 6) + 1)
      count++
      if (count >= 10) {
        clearInterval(interval)
        setRollingAnim(false)
        onRoll()
      }
    }, 80)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        <motion.div
          animate={rollingAnim ? { rotate: [0, 90, 180, 270, 360] } : { rotate: 0 }}
          transition={{ duration: 0.1, repeat: rollingAnim ? Infinity : 0 }}
        >
          <DiceFace value={dice?.[0] || d1} size={36} />
        </motion.div>
        <motion.div
          animate={rollingAnim ? { rotate: [0, -90, -180, -270, -360] } : { rotate: 0 }}
          transition={{ duration: 0.1, repeat: rollingAnim ? Infinity : 0 }}
        >
          <DiceFace value={dice?.[1] || d2} size={36} />
        </motion.div>
      </div>
      <button
        onClick={handleRoll}
        disabled={disabled || rollingAnim}
        className="btn-primary text-xs !py-2 !px-5 disabled:opacity-40"
      >
        {rollingAnim ? 'Бросок...' : 'Бросить'}
      </button>
    </div>
  )
}
