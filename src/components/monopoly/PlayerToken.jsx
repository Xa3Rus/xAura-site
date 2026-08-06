import { motion } from 'framer-motion'

export default function PlayerToken({ color, size = 24, isCurrent, isJail }) {
  return (
    <motion.div
      className="rounded-full border-2 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: `${color}30`,
        borderColor: color,
        boxShadow: isCurrent ? `0 0 12px ${color}40` : 'none',
      }}
      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {isJail && <span className="text-[8px]">🔒</span>}
    </motion.div>
  )
}
