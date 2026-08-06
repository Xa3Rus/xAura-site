import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOARD } from '../../data/boardData'

export default function AuctionModal({ auction, gameState, myUserId, onBid, onClose }) {
  const [bid, setBid] = useState(() => (auction?.currentBid || 0) + 1)
  const [timer, setTimer] = useState(auction?.timer || 30)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (!auction) return
    setBid((auction.currentBid || 0) + 1)
    setTimer(auction.timer || 30)
  }, [auction?.currentBid, auction?.timer])

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer((prev) => prev - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  useEffect(() => {
    if (timer <= 10 && timer > 0) {
      const p = setInterval(() => setPulse(p => !p), 500)
      return () => clearInterval(p)
    } else {
      setPulse(false)
    }
  }, [timer])

  if (!auction) return null
  const cell = BOARD[auction.cellIndex]
  const isLeader = auction.currentBidder === myUserId
  const minBid = (auction.currentBid || 0) + 1
  const leader = auction.currentBidder ? gameState?.players?.find((p) => p.userId === auction.currentBidder) : null

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-sm rounded-2xl p-5 text-center"
          style={{
            background: 'rgba(17,17,20,0.97)',
            border: '1px solid rgba(251,191,36,0.3)',
            boxShadow: '0 0 60px rgba(251,191,36,0.1)',
          }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <motion.div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-lg">🔨</span>
            </motion.div>
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk', color: '#fbbf24' }}>Аукцион</h3>
          </div>

          <p className="text-xs mb-3 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{cell?.name}</p>

          <motion.div
            className="mb-1"
            animate={{ scale: pulse ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-3xl font-bold font-mono text-amber-400 mb-1" style={{ fontFamily: 'JetBrains Mono' }}>${auction.currentBid || 0}</div>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {isLeader ? 'Вы лидер!' : leader ? `Лидер: ${leader.username}` : 'Нет ставок'}
            </p>
          </motion.div>

          <motion.div
            className="text-lg font-mono mb-4"
            style={{ color: timer <= 5 ? '#f87171' : timer <= 10 ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono' }}
            animate={{ scale: timer <= 10 ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 1, repeat: timer <= 10 ? Infinity : 0 }}
          >
            {timer}с
          </motion.div>

          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={bid}
              onChange={(e) => setBid(Math.max(minBid, parseInt(e.target.value) || minBid))}
              min={minBid}
              className="flex-1 text-center text-sm font-mono px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.8)',
              }}
            />
            <motion.button
              onClick={() => { onBid(bid); setBid(bid + 1) }}
              disabled={isLeader}
              className="btn-primary text-xs disabled:opacity-40"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Ставка
            </motion.button>
          </div>

          <motion.button
            onClick={onClose}
            className="text-[10px] w-full py-2 rounded-xl"
            style={{ color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
            whileHover={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.98 }}
          >
            Пасс
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}