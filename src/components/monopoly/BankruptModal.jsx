import { motion, AnimatePresence } from 'framer-motion'

export default function BankruptModal({ player, creditor, onClose }) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div className="relative w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: 'rgba(17,17,20,0.97)', border: '1px solid rgba(239,68,68,0.2)' }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
          <motion.div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center relative" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="text-3xl">💸</span>
            <motion.div className="absolute inset-0 rounded-2xl" style={{ border: '2px solid rgba(239,68,68,0.3)' }} animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </motion.div>
          <h3 className="font-bold text-sm mb-1" style={{ fontFamily: 'Space Grotesk', color: '#f87171' }}>Банкрот!</h3>
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {player?.username} обанкротился
            {creditor && <><br/>Всё имущество перешло к <span style={{ color: creditor.color }}>{creditor.username}</span></>}
            {!creditor && <><br/>Имущество вернулось банку</>}
          </p>
          <motion.button onClick={onClose} className="btn-primary w-full text-xs" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Продолжить</motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}