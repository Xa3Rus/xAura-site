import { motion, AnimatePresence } from 'framer-motion'

export default function GameOverModal({ winner, players, onPlayAgain, onExit }) {
  const sortedPlayers = [...(players || [])].sort((a, b) => (b.balance || 0) - (a.balance || 0))

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onExit} />
        <motion.div
          className="relative w-full max-w-md rounded-2xl p-8 text-center"
          style={{ background: '#0A0A0A', border: '1px solid rgba(187,243,81,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
          initial={{ scale: 0.8, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <motion.div
            className="text-5xl mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.5 }}
          >
            🏆
          </motion.div>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
            <span className="text-neon-400" style={{ textShadow: 'none' }}>Победа!</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: '#A0A0A0' }}>
            <span style={{ color: winner?.color }}>{winner?.username}</span> одержал победу!
          </p>

          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
            {sortedPlayers.map((p, i) => (
              <motion.div
                key={p.userId}
                className="flex items-center gap-3 p-2 rounded-xl text-left"
                style={{ background: p.userId === winner?.userId ? `rgba(${p.color.slice(1)},0.1)` : 'rgba(10,10,10,0.6)', border: p.userId === winner?.userId ? `1px solid ${p.color}40` : '1px solid rgba(187,243,81,0.1)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <span className="text-sm font-bold" style={{ color: p.userId === winner?.userId ? '#BBF351' : '#707070' }}>#{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: p.color, color: '#fff' }}>
                  {p.username?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm font-medium flex-1 truncate" style={{ color: p.userId === winner?.userId ? '#F0F0F0' : '#F0F0F0' }}>
                  {p.username}
                  {p.isBankrupt && <span className="ml-2 text-[10px] text-red-400">💀</span>}
                </span>
                <span className="text-sm font-bold font-mono" style={{ color: p.balance < 0 ? '#FF3366' : p.color }}>
                  ${p.balance}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={onPlayAgain}
              className="flex-1 btn-primary text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🔄 Играть снова
            </motion.button>
            <motion.button
              onClick={onExit}
              className="flex-1 text-sm py-2.5 rounded-xl"
              style={{ color: '#A0A0A0', border: '1px solid rgba(187,243,81,0.1)' }}
              whileHover={{ background: '#111111', color: '#F0F0F0' }}
              whileTap={{ scale: 0.98 }}
            >
              В лобби
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}