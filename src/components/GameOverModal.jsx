import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function GameOverModal({ score, bestScore, isNewRecord, onRestart }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="glass-card p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-black mb-2">
              {isNewRecord ? '🏆 Новый рекорд!' : '💥 Game Over'}
            </h2>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="my-6"
          >
            <div className="text-6xl font-black text-purple-400 mb-2">{score}</div>
            <div className="text-gray-400">очков</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6 text-sm text-gray-400"
          >
            <div>Лучший результат: <span className="text-purple-400 font-bold">{bestScore}</span></div>
          </motion.div>

          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRestart}
              className="gradient-btn text-lg !py-3"
            >
              Играть снова
            </motion.button>
            <Link to="/profile" className="gradient-btn-outline text-center text-lg !py-3">
              В профиль
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
