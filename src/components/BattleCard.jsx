import { motion } from 'framer-motion'
import { shikimoriImg } from '../utils/imgUrl'

const ACCENTS = {
  neon: {
    hoverBorder: 'rgba(187,243,81,0.45)',
    idleBorder: 'rgba(187,243,81,0.08)',
    hoverGlow: '0 0 30px -6px rgba(187,243,81,0.35)',
    key: 'text-neon-400',
  },
  cyan: {
    hoverBorder: 'rgba(0,229,255,0.45)',
    idleBorder: 'rgba(0,229,255,0.08)',
    hoverGlow: '0 0 30px -6px rgba(0,229,255,0.35)',
    key: 'text-cyan-400',
  },
}

function ResultBadge({ kind }) {
  const common = 'w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border'
  if (kind === 'winner') {
    return (
      <div className={`${common} bg-success/20 border-success/50 shadow-[0_0_16px_-2px_rgba(0,204,136,0.5)]`}>
        <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (kind === 'wrong') {
    return (
      <div className={`${common} bg-danger/20 border-danger/50 shadow-[0_0_16px_-2px_rgba(255,51,102,0.5)]`}>
        <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    )
  }
  return (
    <div className={`${common} bg-surface-2/80 border-surface-4`}>
      <span className="text-xs font-bold text-text-muted font-mono">×</span>
    </div>
  )
}

export default function BattleCard({ anime, side, accent = 'neon', kbd, result, revealed, onClick, disabled }) {
  const isLeft = side === 'left'
  const a = ACCENTS[accent]
  const isWinner = result === 'winner'
  const isLoser = result === 'loser'
  const isWrong = result === 'wrong'

  const scoreNum = Number(anime.score)
  const isHigher = revealed && isWinner

  return (
    <motion.div
      initial={{ x: isLeft ? -140 : 140, opacity: 0, rotate: isLeft ? -2 : 2 }}
      animate={{ x: 0, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={!disabled ? { scale: 1.02, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`group relative overflow-hidden cursor-pointer transition-opacity duration-300 ${
        disabled ? 'pointer-events-none' : ''
      } ${isLoser ? 'opacity-30 saturate-50' : ''} ${isWrong ? 'shadow-[0_0_35px_-5px_rgba(255,51,102,0.35)]' : ''}`}
      style={{
        background: '#0A0A0A',
        border: isWinner
          ? '1px solid rgba(0,204,136,0.5)'
          : isWrong
            ? '1px solid rgba(255,51,102,0.5)'
            : `1px solid ${a.idleBorder}`,
        boxShadow: !result ? a.hoverGlow.replace(/0\.35/, '0') : isWinner ? '0 0 30px -6px rgba(0,204,136,0.4)' : undefined,
        animation: isWrong ? 'shake 0.5s ease-in-out' : undefined,
      }}
      onMouseEnter={(e) => {
        if (disabled || result) return
        e.currentTarget.style.borderColor = a.hoverBorder
        e.currentTarget.style.boxShadow = a.hoverGlow
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isWinner ? 'rgba(0,204,136,0.5)' : isWrong ? 'rgba(255,51,102,0.5)' : a.idleBorder
        e.currentTarget.style.boxShadow = isWinner ? '0 0 30px -6px rgba(0,204,136,0.4)' : 'none'
      }}
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-surface-2">
        {anime.image?.original && !anime.image.original.includes('missing_') ? (
          <img
            src={shikimoriImg(anime.image.original) || ''}
            alt={anime.russian || anime.name}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${!disabled ? 'group-hover:scale-105' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-text-subtle" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{(anime.russian || anime.name || '?')[0]}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute inset-0 scanlines pointer-events-none opacity-60" />

        {/* верхняя кромка со стороной и клавишей */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold font-display border backdrop-blur-sm ${a.key} bg-black/40`} style={{ borderColor: 'currentColor' }}>
            {isLeft ? 'A' : 'B'}
          </span>
          {!disabled && !result && kbd && (
            <kbd className="px-1.5 py-0.5 border border-white/15 bg-black/40 backdrop-blur-sm font-mono text-[10px] text-white/50">
              {kbd}
            </kbd>
          )}
        </div>

        {/* раскрытый рейтинг */}
        {revealed && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute top-12 left-1/2 -translate-x-1/2"
          >
            <div className={`px-3 py-1.5 font-mono font-bold text-lg backdrop-blur-md border ${
              isHigher ? 'bg-success/20 border-success/50 text-success' : 'bg-black/50 border-danger/40 text-danger'
            }`}>
              ★ {scoreNum.toFixed(2)}
            </div>
          </motion.div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <h3 className="font-bold text-sm truncate mb-0.5 text-white" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{anime.russian || anime.name}</h3>
          <div className="text-[10px] text-white/60 font-mono">{anime.aired_on?.split('-')[0] || '—'}</div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(anime.genres || []).slice(0, 2).map((g) => (
              <span key={g.id || g.name} className="tag !text-[9px] !bg-white/20 !border-white/20 !text-white">{g.russian || g.name}</span>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="absolute top-2.5 right-2.5"
        >
          <ResultBadge kind={isWinner ? 'winner' : isWrong ? 'wrong' : 'loser'} />
        </motion.div>
      )}
    </motion.div>
  )
}
