import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EVENT_COLORS = {
  move: '#A0A0A0',
  buy: '#00CC88',
  rent: '#FF8A33',
  tax: '#FF3366',
  doubles: '#FF8A33',
  jail: '#FF3366',
  jailRelease: '#00CC88',
  jailRoll: '#FF8A33',
  passGo: '#00CC88',
  chance: '#BF5AF2',
  community: '#00E5FF',
  bankrupt: '#FF3366',
  info: '#A0A0A0',
  error: '#FF3366',
  winner: '#FF8A33',
  card: '#BF5AF2',
  decline: '#707070',
}

export default function GameLog({ messages }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(187,243,81,0.1)' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#707070', fontFamily: 'Quantico, Inter, sans-serif' }}>
          Game Log
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(187,243,81,0.1) transparent' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const color = EVENT_COLORS[msg.type] || '#707070'
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
