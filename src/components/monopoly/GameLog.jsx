import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EVENT_COLORS = {
  move: 'rgba(255,255,255,0.4)',
  buy: '#22c55e',
  rent: '#f97316',
  tax: '#ef4444',
  doubles: '#fbbf24',
  jail: '#ef4444',
  jailRelease: '#22c55e',
  jailRoll: '#f97316',
  passGo: '#22c55e',
  chance: '#a855f7',
  community: '#3b82f6',
  bankrupt: '#ef4444',
  info: 'rgba(255,255,255,0.35)',
  error: '#ef4444',
  winner: '#fbbf24',
  card: '#a855f7',
  decline: 'rgba(255,255,255,0.3)',
}

export default function GameLog({ messages }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Space Grotesk' }}>
          Game Log
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const color = EVENT_COLORS[msg.type] || 'rgba(255,255,255,0.3)'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] leading-relaxed py-0.5"
                style={{ color }}
              >
                {msg.text || msg.message}
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  )
}
