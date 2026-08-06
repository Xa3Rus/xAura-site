import { motion } from 'framer-motion'
import { BOARD, COLOR_GROUPS } from '../../data/boardData'

const CELL_COLORS = {
  brown: '#8B4513', lightblue: '#87CEEB', pink: '#FF69B4', orange: '#FFA500',
  red: '#FF0000', yellow: '#FFD700', green: '#228B22', darkblue: '#00008B',
}

export default function PropertyCard({ cellIndex, propData, owner, gameState, onBuild, onSell, onMortgage, isMyProperty }) {
  const cell = BOARD[cellIndex]
  if (!cell) return null
  const colorHex = CELL_COLORS[cell.color]
  const houses = propData?.houses || 0
  const hasHotel = houses === 5
  const isMortgaged = propData?.isMortgaged

  const canBuild = isMyProperty && !isMortgaged && houses < 5 && gameState?.bank?.houses > 0
  const canSell = isMyProperty && houses > 0
  const canMortgage = isMyProperty && !isMortgaged && houses === 0
  const canUnmortgage = isMyProperty && isMortgaged

  const hasMonopoly = cell.color && COLOR_GROUPS[cell.color]?.every(idx => {
    const p = gameState?.properties?.[idx]
    return p?.ownerId === owner?.userId
  })

  const mortgageValue = cell.mortgageValue
  const unmortgagePrice = Math.ceil(mortgageValue * 1.1)

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {colorHex && (
        <motion.div
          className="h-8 flex items-center justify-center relative overflow-hidden"
          style={{ background: colorHex }}
          initial={{ height: 0 }}
          animate={{ height: 32 }}
        >
          <span className="text-xs font-bold text-white drop-shadow z-10 relative">{cell.name}</span>
          <motion.div
            className="absolute inset-0"
            style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`, backgroundSize: '200% 100%' }}
            animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
      <div className="p-3 space-y-2">
        <div className="text-[10px] flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <span>Стоимость: <span className="font-mono text-amber-400">${cell.price}</span></span>
          {cell.housePrice && (
            <span className="ml-auto">Дом: <span className="font-mono text-green-400">${cell.housePrice}</span></span>
          )}
        </div>

        <div className="text-[10px] space-y-0.5">
          <div className="font-medium mb-1 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>Аренда:</span>
            {hasMonopoly && <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">МОНОПОЛИЯ x2</span>}
          </div>
          {cell.rent?.map((r, i) => (
            <motion.div
              key={i}
              className="flex justify-between"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <span>{i === 0 ? 'Базовая' : i === 5 ? 'Отель' : `${i} дом${i === 1 ? '' : i < 5 ? 'а' : 'ов'}`}</span>
              <span className="font-mono ${i === houses || (hasHotel && i === 5) ? 'text-amber-400' : ''}">${r}</span>
            </motion.div>
          ))}
        </div>

        {owner && (
          <motion.div
            className="flex items-center gap-2 text-[10px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: owner.color }} />
            <span>{owner.username}</span>
            <span className="ml-auto font-mono">
              {hasHotel ? '🏨 Отель' : houses > 0 ? `🏠 ${houses}` : '—'}
            </span>
          </motion.div>
        )}

        {isMortgaged && (
          <motion.div
            className="text-[10px] text-red-400 text-center py-1.5 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            🔒 Заложено (ипотека) — ${mortgageValue}
          </motion.div>
        )}

        {isMyProperty && !isMortgaged && (
          <motion.div
            className="flex gap-1 flex-wrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {canBuild && (
              <motion.button
                onClick={() => onBuild?.(cellIndex)}
                className="text-[9px] px-2.5 py-1.5 rounded-lg text-green-400 font-medium"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
                whileHover={{ background: 'rgba(34,197,94,0.2)' }}
                whileTap={{ scale: 0.97 }}
              >
                🏠 Дом ${cell.housePrice}
              </motion.button>
            )}
            {canSell && (
              <motion.button
                onClick={() => onSell?.(cellIndex)}
                className="text-[9px] px-2.5 py-1.5 rounded-lg text-amber-400 font-medium"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
                whileHover={{ background: 'rgba(251,191,36,0.2)' }}
                whileTap={{ scale: 0.97 }}
              >
                Продать ${Math.floor(cell.housePrice / 2)}
              </motion.button>
            )}
            {canMortgage && (
              <motion.button
                onClick={() => onMortgage?.(cellIndex)}
                className="text-[9px] px-2.5 py-1.5 rounded-lg text-red-400 font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                whileHover={{ background: 'rgba(239,68,68,0.2)' }}
                whileTap={{ scale: 0.97 }}
              >
                Заложить ${mortgageValue}
              </motion.button>
            )}
          </motion.div>
        )}

        {isMyProperty && isMortgaged && canUnmortgage && (
          <motion.div
            className="flex gap-1 flex-wrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={() => onMortgage?.(cellIndex)}
              className="text-[9px] px-2.5 py-1.5 rounded-lg text-green-400 font-medium"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
              whileHover={{ background: 'rgba(34,197,94,0.2)' }}
              whileTap={{ scale: 0.97 }}
            >
              Снять с заклада ${unmortgagePrice}
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}