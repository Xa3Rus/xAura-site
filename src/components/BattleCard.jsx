import { motion } from 'framer-motion'

export default function BattleCard({ anime, side, result, onClick, disabled }) {
  const isLeft = side === 'left'
  const isWinner = result === 'winner'
  const isLoser = result === 'loser'
  const isWrong = result === 'wrong'

  return (
    <motion.div
      initial={{ x: isLeft ? -120 : 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`relative overflow-hidden cursor-pointer transition-all duration-400 rounded-2xl ${
        disabled ? 'pointer-events-none' : ''
      } ${isWinner ? 'shadow-glow-mint' : ''} ${isLoser ? 'opacity-25' : ''} ${isWrong ? 'shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: isWinner ? '1px solid rgba(52,211,153,0.3)' : isWrong ? '1px solid rgba(244,63,94,0.3)' : '1px solid rgba(255,255,255,0.05)',
        animation: isWrong ? 'shake 0.5s ease-in-out' : undefined,
      }}
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-surface-3">
        {anime.image?.original && !anime.image.original.includes('missing_') ? (
          <img
            src={`https://shikimori.one${anime.image.original}`}
            alt={anime.russian || anime.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: 'rgba(255,255,255,0.08)', fontFamily: 'Space Grotesk' }}>{(anime.russian || anime.name || '?')[0]}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <h3 className="font-bold text-sm truncate mb-0.5" style={{ fontFamily: 'Space Grotesk' }}>{anime.russian || anime.name}</h3>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono' }}>{anime.aired_on?.split('-')[0] || '—'}</div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(anime.genres || []).slice(0, 2).map((g) => (
              <span key={g.id || g.name} className="tag !text-[9px]">{g.russian || g.name}</span>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="absolute top-2.5 right-2.5"
        >
          {isWinner && <span className="text-xl drop-shadow-lg">✅</span>}
          {isLoser && <span className="text-xl">💀</span>}
          {isWrong && <span className="text-xl">❌</span>}
        </motion.div>
      )}
    </motion.div>
  )
}
