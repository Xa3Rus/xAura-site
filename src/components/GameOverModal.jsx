import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function GameOverModal({ score, bestScore, isNewRecord, onRestart }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden bg-surface-1 border border-neon-400/10 shadow-xl glass"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon-600/[0.04] rounded-full blur-[80px] -translate-y-1/2" />

          <motion.div initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold mb-2 relative" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
              {isNewRecord ? '🏆 Рекорд!' : '💥 Game Over'}
            </h2>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
            className="my-6"
          >
            <div className="text-5xl font-bold text-neon-400 mb-1" style={{ fontFamily: 'Source Code Pro', textShadow: '0 0 30px rgba(187,243,81,0.25)' }}>{score}</div>
            <div className="label">очков</div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-8 text-xs text-text-muted">
            Лучший результат: <span className="text-neon-400 font-bold" style={{ fontFamily: 'Source Code Pro' }}>{bestScore}</span>
          </motion.div>

          <div className="flex flex-col gap-2.5">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRestart} className="btn-primary !py-3">
              Играть снова
            </motion.button>
            <Link to="/profile" className="btn-ghost !py-3 text-center">
              В профиль
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
