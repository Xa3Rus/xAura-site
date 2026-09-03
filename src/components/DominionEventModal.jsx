import { motion } from 'framer-motion'

export default function DominionEventModal({ event, onClose }) {
  if (!event) return null

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl p-6 text-center"
        style={{ background: '#0A0A0A', border: '1px solid rgba(191,90,242,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.2)' }}>
          <span className="text-2xl">🎉</span>
        </div>
        <h3 className="font-bold text-sm mb-2" style={{ fontFamily: 'Quantico, Inter, sans-serif', color: '#BF5AF2' }}>Аниме-фестиваль</h3>
        <p className="text-xs mb-5 leading-relaxed" style={{ color: '#A0A0A0' }}>{event.text}</p>
        <button onClick={onClose} className="btn-primary w-full text-xs">
          Отлично
        </button>
      </motion.div>
    </motion.div>
  )
}
