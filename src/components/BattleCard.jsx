import { motion } from 'framer-motion'

export default function BattleCard({ anime, side, result, onClick, disabled }) {
  const isLeft = side === 'left'
  const isWinner = result === 'winner'
  const isLoser = result === 'loser'
  const isWrong = result === 'wrong'

  return (
    <motion.div
      initial={{ x: isLeft ? -200 : 200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`relative glass-card overflow-hidden cursor-pointer transition-all duration-300 ${
        disabled ? 'pointer-events-none' : 'hover:border-purple-500/50'
      } ${isWinner ? 'ring-2 ring-green-400 shadow-lg shadow-green-500/20' : ''} ${isLoser ? 'opacity-40' : ''} ${isWrong ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/20' : ''}`}
      style={{ animation: isWrong ? 'shake 0.5s ease-in-out' : undefined }}
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        {anime.image?.original && !anime.image.original.includes('missing_') ? (
          <img
            src={`https://shikimori.io${anime.image.original}`}
            alt={anime.russian || anime.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-dark-600 flex items-center justify-center">
            <span className="text-gray-500 text-5xl font-bold">{(anime.russian || anime.name || '?')[0]}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-lg truncate mb-1">{anime.russian || anime.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span>{anime.aired_on?.split('-')[0] || '—'}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {(anime.genres || []).slice(0, 3).map((g) => (
              <span key={g.id || g.name} className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                {g.russian || g.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          {isWinner && <span className="text-3xl">✅</span>}
          {isLoser && <span className="text-3xl">💀</span>}
          {isWrong && <span className="text-3xl">❌</span>}
        </motion.div>
      )}
    </motion.div>
  )
}
