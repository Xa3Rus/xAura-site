import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

const RANKS = [
  { min: 25, title: 'Бог аниме', color: 'text-amber-400' },
  { min: 18, title: 'Легенда', color: 'text-fuchsia-400' },
  { min: 12, title: 'Мастер', color: 'text-cyan-400' },
  { min: 7, title: 'Знаток', color: 'text-neon-400' },
  { min: 3, title: 'Новичок', color: 'text-text-secondary' },
  { min: 0, title: 'Зритель', color: 'text-text-muted' },
]

function getRank(score) {
  return RANKS.find((r) => score >= r.min)
}

export default function GameOverModal({ score, bestScore, isNewRecord, onRestart }) {
  const rank = getRank(score)

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
          <div className="absolute inset-0 neon-grid opacity-30 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-56 bg-neon-600/[0.07] rounded-full blur-[90px] -translate-y-1/2" />

          {/* шахматный мат — серия прервана */}
          <motion.div
            className="relative mx-auto w-40 h-24 rounded-xl overflow-hidden border border-neon-400/25 shadow-glow-neon mb-4"
            initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
          >
            <picture>
              <source srcSet="https://i.giphy.com/media/6Aw9RGkNOmla5PTC0z/giphy.webp" type="image/webp" />
              <img src="https://media.giphy.com/media/6Aw9RGkNOmla5PTC0z/giphy.gif" alt="Шах и мат" className="w-full h-full object-cover" />
            </picture>
            <span className="absolute bottom-1 right-1.5 px-1.5 py-px rounded bg-black/70 backdrop-blur-sm font-mono text-[8px] font-bold uppercase tracking-widest text-neon-300">
              checkmate
            </span>
          </motion.div>

          <motion.div initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative">
            <h2 className="text-2xl font-bold mb-1 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
              {isNewRecord ? 'Новый рекорд!' : 'Game Over'}
            </h2>
            <p className="text-xs text-text-muted font-mono">серия прервана</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
            className="my-6 relative"
          >
            <div className="text-6xl font-bold text-neon-400 mb-1" style={{ fontFamily: 'Source Code Pro', textShadow: '0 0 30px rgba(187,243,81,0.3)' }}>{score}</div>
            <div className="label !mb-0">очков</div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mt-3 inline-block px-3 py-1 rounded-lg bg-surface-2/80 border border-neon-400/15"
            >
              <span className={`text-xs font-bold font-display uppercase tracking-wider ${rank.color}`}>{rank.title}</span>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-7 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-text-muted font-mono">ЛУЧШИЙ РЕЗУЛЬТАТ</span>
              <span className="text-xs font-bold text-neon-400 font-mono">{bestScore}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isNewRecord ? 'bg-gradient-to-r from-neon-600 to-neon-300' : 'bg-neon-400/50'}`}
                initial={{ width: 0 }}
                animate={{ width: `${bestScore > 0 ? Math.min(100, (score / bestScore) * 100) : 0}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              />
            </div>
          </motion.div>

          <div className="flex flex-col gap-2.5 relative">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRestart} className="btn-primary btn-shine !py-3">
              Играть снова
            </motion.button>
            <div className="flex gap-2.5">
              <Link to="/" className="btn-ghost !py-2.5 text-center flex-1 text-xs">
                Зал славы
              </Link>
              <Link to="/profile" className="btn-ghost !py-2.5 text-center flex-1 text-xs">
                В профиль
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
