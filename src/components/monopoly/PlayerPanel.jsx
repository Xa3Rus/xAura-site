import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOARD, COLOR_GROUPS } from '../../data/boardData'

const CELL_COLORS = {
  brown: '#8B4513', lightblue: '#87CEEB', pink: '#FF69B4', orange: '#FFA500',
  red: '#FF0000', yellow: '#FFD700', green: '#228B22', darkblue: '#00008B',
}

export default function PlayerPanel({ players, currentPlayerId, onPlayerClick, currentPlayerIndex }) {
  const [expandedPlayer, setExpandedPlayer] = useState(null)

  const getPlayerNetWorth = (player, gameState) => {
    if (!gameState?.properties) return player.balance
    return player.properties.reduce((sum, cellIndex) => {
      const cell = BOARD[cellIndex]
      const prop = gameState.properties[cellIndex]
      if (!prop) return sum
      let value = cell.price || 0
      if (prop.houses > 0) value += prop.houses * cell.housePrice
      if (prop.hotel) value += 5 * cell.housePrice
      if (prop.isMortgaged) value = Math.floor(value * 0.5)
      return sum + value
    }, player.balance)
  }

  const getMonopolyColors = (player, gameState) => {
    if (!gameState?.properties) return []
    return Object.entries(COLOR_GROUPS).filter(([color, indices]) => {
      const firstOwner = gameState.properties[indices[0]]?.ownerId
      return firstOwner === player.userId && indices.every(idx => gameState.properties[idx]?.ownerId === player.userId)
    }).map(([color]) => color)
  }

  const formatMoney = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`
    return `$${amount}`
  }

  return (
    <div className="space-y-2">
      {players.map((p, idx) => {
        const isCurrent = p.userId === currentPlayerId
        const isActive = idx === currentPlayerIndex
        const isBankrupt = p.isBankrupt
        const propCount = p.properties?.length || 0
        const monopolyColors = getMonopolyColors(p, { properties: players.flatMap(pl => pl.properties?.map(c => ({ cellIndex: c, ownerId: pl.userId }))) })
        const netWorth = getPlayerNetWorth(p, { properties: players.flatMap(pl => pl.properties?.map(c => ({ cellIndex: c, ownerId: pl.userId }))) })

        return (
          <motion.div
            key={p.userId}
            className="relative rounded-2xl overflow-hidden cursor-pointer transition-all"
            style={{
              background: isCurrent
                ? `linear-gradient(135deg, ${p.color}15 0%, ${p.color}08 100%)`
                  : isBankrupt
                  ? 'rgba(255,51,102,0.05)'
                  : 'rgba(10,10,10,0.6)',
              border: `1px solid ${isCurrent ? `${p.color}30` : isBankrupt ? 'rgba(255,51,102,0.15)' : 'rgba(187,243,81,0.1)'}`,
              opacity: isBankrupt ? 0.6 : 1,
            }}
            whileHover={{ y: -2, boxShadow: `0 8px 32px ${p.color}20` }}
            onClick={() => !isBankrupt && onPlayerClick?.(p.userId)}
            animate={{ opacity: expandedPlayer === p.userId ? 1 : 1 }}
          >
            {isActive && !isBankrupt && (
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ border: `2px solid ${p.color}`, boxShadow: `0 0 20px ${p.color}30` }}
                animate={{ opacity: [0.3, 1, 0.3], boxShadow: [`0 0 10px ${p.color}30`, `0 0 30px ${p.color}50`, `0 0 10px ${p.color}30`] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            <div className="p-3">
              <div className="flex items-center gap-3">
                <motion.div
                  className="relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${p.color}30 0%, ${p.color}10 100%)`,
                    border: `2px solid ${p.color}`,
                    color: p.color,
                    boxShadow: isActive ? `0 0 20px ${p.color}40` : 'none',
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {p.token || p.username?.[0]?.toUpperCase() || '?'}
                  {isBankrupt && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                      <span className="text-[10px]">💀</span>
                    </div>
                  )}
                  {p.getOutOfJailCards > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: '#FF8A33', color: '#000' }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🃏
                    </motion.div>
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      className="text-xs font-semibold truncate"
                      style={{ color: isCurrent ? '#F0F0F0' : isBankrupt ? '#707070' : '#F0F0F0' }}
                    >
                      {p.username}
                    </motion.span>
                    {isCurrent && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}>YOU</span>}
                    {isBankrupt && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,51,102,0.2)', color: '#FF6688', border: '1px solid rgba(255,51,102,0.3)' }}>BANKRUPT</span>}
                    {p.inJail && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,51,102,0.2)', color: '#FF6688', border: '1px solid rgba(255,51,102,0.3)' }}>🔒 JAIL</span>}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5">
                    <motion.span
                      className="text-sm font-bold font-mono"
                      style={{ color: p.balance < 0 ? '#FF3366' : p.color }}
                    >
                      {formatMoney(p.balance)}
                    </motion.span>
                    <span className="text-[9px]" style={{ color: '#707070' }}>
                      {propCount} {propCount === 1 ? 'св-во' : propCount < 5 ? 'св-ва' : 'св-в'}
                    </span>
                    <span className="text-[9px]" style={{ color: '#2A2A2A' }}>
                      • NW: {formatMoney(netWorth)}
                    </span>
                  </div>
                </div>

                <motion.button
                  onClick={(e) => { e.stopPropagation(); setExpandedPlayer(expandedPlayer === p.userId ? null : p.userId) }}
                  className="p-1 rounded-lg text-text-muted hover:text-text transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedPlayer === p.userId ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                  </svg>
                </motion.button>
              </div>

              <AnimatePresence>
                {expandedPlayer === p.userId && !isBankrupt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 pt-3 overflow-hidden"
                    style={{ borderTop: '1px solid rgba(187,243,81,0.1)' }}
                  >
                    {monopolyColors.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[9px] font-medium mb-1.5" style={{ color: '#707070', fontFamily: 'Quantico, Inter, sans-serif' }}>МОНОПОЛИИ</div>
                        <div className="flex flex-wrap gap-1">
                          {monopolyColors.map(color => (
                            <motion.div
                              key={color}
                              className="px-2 py-1 rounded-lg text-[8px] font-bold uppercase"
                              style={{
                                background: `${CELL_COLORS[color]}30`,
                                border: `1px solid ${CELL_COLORS[color]}50`,
                                color: CELL_COLORS[color],
                              }}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.05 }}
                            >
                              {color}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.properties?.length > 0 && (
                          <div className="space-y-1 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(187,243,81,0.1) transparent' }}>
                        {p.properties.slice(0, 8).map((cellIndex) => {
                          const cell = BOARD[cellIndex]
                          if (!cell) return null
                          return (
                            <motion.div
                              key={cellIndex}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                              style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(187,243,81,0.1)' }}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.02 }}
                            >
                              <div className="w-1.5 h-1.5 rounded" style={{ background: CELL_COLORS[cell.color] || '#666' }} />
                              <span className="text-[10px] truncate flex-1" style={{ color: '#A0A0A0' }}>{cell.name}</span>
                            </motion.div>
                          )
                        })}
                        {p.properties.length > 8 && (
                          <div className="text-[9px] text-center py-1" style={{ color: '#707070' }}>
                            +{p.properties.length - 8} св-в
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isActive && !isBankrupt && (
              <motion.div
                className="flex items-center gap-1.5 mt-2 pt-2"
                style={{ borderTop: '1px solid rgba(187,243,81,0.1)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: p.color }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-[9px]" style={{ color: '#707070' }}>Ваш ход...</span>
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}