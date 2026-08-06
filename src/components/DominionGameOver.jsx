import { motion } from 'framer-motion'

export default function DominionGameOver({ winner, players, onPlayAgain }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        className="relative w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: 'rgba(17,17,20,0.97)', border: '1px solid rgba(251,191,36,0.2)', boxShadow: '0 0 80px rgba(251,191,36,0.05)' }}
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
      >
        <motion.div
          className="text-5xl mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
        >
          🏆
        </motion.div>

        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>
          <span className="text-amber-400" style={{ textShadow: '0 0 20px rgba(251,191,36,0.3)' }}>Победа!</span>
        </h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ color: winner?.color }}>{winner?.name}</span> одержал победу!
        </p>

        <div className="space-y-2 mb-6">
          {[...players]
            .sort((a, b) => b.balance - a.balance)
            .map((p, idx) => (
              <motion.div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: p.id === winner?.id ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${p.id === winner?.id ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)'}`,
                  opacity: p.isBankrupt ? 0.4 : 1,
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: p.isBankrupt ? 0.4 : 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
              >
                <span className="text-xs font-mono font-bold w-6 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  #{idx + 1}
                </span>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                <span className="text-sm font-medium flex-1 text-left">{p.name}</span>
                {p.isBankrupt ? (
                  <span className="text-xs text-coral-400">Банкрот</span>
                ) : (
                  <span className="text-sm font-mono font-bold" style={{ color: p.color }}>${p.balance}</span>
                )}
              </motion.div>
            ))}
        </div>

        <button onClick={onPlayAgain} className="btn-primary w-full">
          Играть снова
        </button>
      </motion.div>
    </motion.div>
  )
}
