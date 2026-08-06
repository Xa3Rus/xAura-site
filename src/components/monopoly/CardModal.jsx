import { motion, AnimatePresence } from 'framer-motion'

export default function CardModal({ card, type, onClose }) {
  if (!card) return null

  const isChance = type === 'chance'

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-xs rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(17,17,20,0.97)',
            border: `1px solid ${isChance ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)'}`,
            boxShadow: `0 0 60px ${isChance ? 'rgba(168,85,247,0.05)' : 'rgba(59,130,246,0.05)'}`,
          }}
          initial={{ rotateY: 90, scale: 0.8 }}
          animate={{ rotateY: 0, scale: 1 }}
          exit={{ rotateY: -90, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center relative overflow-hidden"
            style={{
              background: isChance ? 'rgba(168,85,247,0.1)' : 'rgba(59,130,246,0.1)',
              border: `1px solid ${isChance ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)'}`,
            }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-3xl">{isChance ? '❓' : '🏛️'}</span>
            <motion.div
              className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)` }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <h3 className="font-bold text-sm mb-1" style={{ fontFamily: 'Space Grotesk', color: isChance ? '#c084fc' : '#60a5fa' }}>
            {isChance ? 'Шанс' : 'Общественная казна'}
          </h3>
          <p className="text-xs mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.text}</p>
          <motion.button
            onClick={onClose}
            className="btn-primary w-full text-xs"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Отлично
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}