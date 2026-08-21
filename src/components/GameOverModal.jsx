import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DossierPanel, Corners } from './profile/SharedBits'

const RANKS = [
  { min: 25, title: 'Бог аниме', color: '#FFD700' },
  { min: 18, title: 'Легенда', color: '#BF5AF2' },
  { min: 12, title: 'Мастер', color: '#00E5FF' },
  { min: 7, title: 'Знаток', color: '#BBF351' },
  { min: 3, title: 'Новичок', color: '#A0A0A0' },
  { min: 0, title: 'Зритель', color: '#707070' },
]

function getRank(score) {
  return RANKS.find((r) => score >= r.min)
}

export default function GameOverModal({ score, bestScore, isNewRecord, onRestart }) {
  const rank = getRank(score)

  // Enter — играть снова
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') onRestart()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onRestart])

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
          className="max-w-md w-full"
        >
          <DossierPanel cut="cut-lg" className="overflow-hidden px-7 sm:px-8 pt-7 pb-8 text-center">
            <div className="absolute inset-0 dots-bg opacity-20 pointer-events-none" />
            <Corners inset={4} size={11} />
            <div className="absolute bottom-0 inset-x-0 h-2 gauge-ticks opacity-20 pointer-events-none" />

            <div className="relative">
              {/* техлента */}
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-1.5 h-1.5 bg-danger animate-pulse" />
                <span className="dossier-note !text-danger/80">сессия прервана</span>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/60 to-transparent" />
              </div>

              {/* шахматный мат — серия прервана */}
              <motion.div
                className="relative mx-auto w-40 h-24 overflow-hidden border border-neon-400/25 shadow-glow-neon mb-4"
                initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
              >
                <picture>
                  <source srcSet="https://i.giphy.com/media/6Aw9RGkNOmla5PTC0z/giphy.webp" type="image/webp" />
                  <img src="https://media.giphy.com/media/6Aw9RGkNOmla5PTC0z/giphy.gif" alt="Шах и мат" className="w-full h-full object-cover" />
                </picture>
                <div className="absolute inset-0 scanlines pointer-events-none" />
                <span className="absolute bottom-1 right-1.5 px-1.5 py-px bg-black/70 backdrop-blur-sm font-mono text-[8px] font-bold uppercase tracking-widest text-neon-300">
                  checkmate
                </span>
              </motion.div>

              <motion.div initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <h2 className="text-2xl font-bold mb-1 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
                  {isNewRecord ? 'Новый рекорд!' : 'Game Over'}
                </h2>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
                className="my-5"
              >
                <div className="text-6xl font-bold text-neon-400 mb-1" style={{ fontFamily: 'Source Code Pro', textShadow: '0 0 30px rgba(187,243,81,0.3)' }}>{score}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">очков в серии</div>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mt-3 inline-block"
                >
                  <span className="stamp inline-block px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: rank.color }}>
                    ранг: {rank.title}
                  </span>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-7">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.14em]">лучший результат</span>
                  <span className="text-xs font-bold text-neon-400 font-mono">{bestScore}</span>
                </div>
                <div className="relative h-1.5 bg-surface-3 overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 chevron-fill opacity-70"
                    initial={{ width: 0 }}
                    animate={{ width: `${bestScore > 0 ? Math.min(100, (score / bestScore) * 100) : 0}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                  />
                </div>
              </motion.div>

              <div className="flex flex-col gap-2.5">
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

              <p className="mt-4 dossier-note">enter — играть снова</p>
            </div>
          </DossierPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
