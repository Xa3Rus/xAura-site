import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Select({ value, onChange, options, placeholder = 'Выбрать', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find((o) => o.value === value)
  const display = selected?.label || placeholder

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 text-sm transition-all duration-300 cursor-pointer bg-surface-1 border border-surface-3 rounded-xl focus:outline-none focus:border-neon-400/50 focus:shadow-[0_0_0_3px_rgba(187,243,81,0.1)]"
        style={{
          color: selected ? '#F0F0F0' : '#A0A0A0',
          padding: '10px 14px',
        }}
      >
        <span className="truncate text-left">{display}</span>
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full mt-1 left-0 right-0 max-h-60 overflow-y-auto rounded-xl z-50 bg-surface-1 border border-neon-400/10 shadow-soft-lg"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-3.5 py-2.5 text-xs transition-all duration-150 ${
                  opt.value === value
                    ? 'bg-neon-400/10 text-neon-400 font-medium'
                    : 'text-text-secondary hover:bg-surface-2/50 hover:text-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
