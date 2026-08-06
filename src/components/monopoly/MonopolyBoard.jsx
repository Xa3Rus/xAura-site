import { memo, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOARD, COLOR_GROUPS } from '../../data/boardData'

const CELL_COLORS = {
  brown: '#8B4513', lightblue: '#87CEEB', pink: '#FF69B4', orange: '#FFA500',
  red: '#FF0000', yellow: '#FFD700', green: '#228B22', darkblue: '#00008B',
}

const CELL_COLORS_LIGHT = {
  brown: '#A0522D', lightblue: '#87CEEB', pink: '#FFB6C1', orange: '#FFB84D',
  red: '#FF4444', yellow: '#FFEB3B', green: '#32CD32', darkblue: '#1E3A8A',
}

function getGridPosition(cellId) {
  if (cellId <= 10) return { row: 10, col: cellId }
  if (cellId <= 19) return { row: 10 - (cellId - 10), col: 10 }
  if (cellId <= 30) return { row: 0, col: 10 - (cellId - 20) }
  return { row: cellId - 30, col: 0 }
}

function getCellBackground(cell, isHighlighted, isSelected) {
  if (isSelected) return 'rgba(251,191,36,0.2)'
  if (isHighlighted) return 'rgba(251,191,36,0.15)'
  switch (cell.type) {
    case 'go': return 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)'
    case 'jail': return 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.03) 100%)'
    case 'parking': return 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.03) 100%)'
    case 'gotojail': return 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)'
    case 'chance': return 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.03) 100%)'
    case 'community': return 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.03) 100%)'
    case 'tax': return 'linear-gradient(135deg, rgba(234,179,8,0.1) 0%, rgba(234,179,8,0.03) 100%)'
    default: return 'rgba(255,255,255,0.02)'
  }
}

function getCellName(cell) {
  if (cell.type === 'go') return 'СТАРТ'
  if (cell.type === 'jail') return 'ТЮРЬМА'
  if (cell.type === 'parking') return 'ПАРКОВКА'
  if (cell.type === 'gotojail') return 'В ТЮРЬМУ'
  if (cell.type === 'chance') return 'ШАНС'
  if (cell.type === 'community') return 'КАЗНА'
  if (cell.type === 'tax') return 'НАЛОГ'
  return cell.name
}

function getCellNameColor(cell) {
  if (cell.type === 'go') return '#34d399'
  if (cell.type === 'gotojail' || cell.type === 'jail') return '#f87171'
  if (cell.type === 'tax') return '#fbbf24'
  if (cell.type === 'chance') return '#c084fc'
  if (cell.type === 'community') return '#60a5fa'
  return 'rgba(255,255,255,0.85)'
}

function BoardCell({ cell, owner, houses, isMortgaged, playersOnCell, isHighlighted, isSelected, onClick, onMouseEnter, onMouseLeave }) {
  const colorHex = cell.color ? CELL_COLORS[cell.color] : null
  const colorHexLight = cell.color ? CELL_COLORS_LIGHT[cell.color] : null
  const hasHotel = houses === 5
  const houseCount = hasHotel ? 0 : houses

  return (
    <motion.div
      className="relative flex flex-col rounded overflow-hidden cursor-pointer select-none"
      style={{
        background: getCellBackground(cell, isHighlighted, isSelected),
        border: `2px solid ${isSelected ? 'rgba(251,191,36,0.8)' : isHighlighted ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.04)'}`,
        boxShadow: isSelected ? '0 0 20px rgba(251,191,36,0.3)' : 'none',
      }}
      whileHover={{ scale: 1.04, zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {colorHex && (
        <motion.div
          className="h-[5px] w-full flex-shrink-0"
          style={{
            background: `linear-gradient(90deg, ${colorHex} 0%, ${colorHexLight} 50%, ${colorHex} 100%)`,
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {cell.type === 'go' && <div className="h-[5px] w-full flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-400" />}
      {cell.type === 'gotojail' && <div className="h-[5px] w-full flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600" />}
      {cell.type === 'jail' && <div className="h-[5px] w-full flex-shrink-0 bg-gradient-to-r from-red-400 to-red-500 opacity-60" />}

      <div className="flex-1 flex flex-col justify-between px-1.5 py-1.5 min-w-0">
        <span
          className="text-[8px] sm:text-[10px] md:text-[11px] font-bold truncate leading-tight"
          style={{
            color: getCellNameColor(cell),
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            fontFamily: 'Space Grotesk',
          }}
        >
          {getCellName(cell)}
        </span>

        {cell.price && (
          <span className="text-[6px] sm:text-[8px] md:text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            ${cell.price}
          </span>
        )}
        {cell.amount && (
          <span className="text-[6px] sm:text-[8px] md:text-[9px] font-mono text-amber-400">-${cell.amount}</span>
        )}

        <div className="flex items-center justify-center gap-[2px] flex-wrap min-h-[18px]">
          {houseCount > 0 && (
            <motion.div
              className="flex gap-[2px] flex-wrap justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
            >
              {Array.from({ length: houseCount }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[7px] h-[7px] sm:w-[9px] sm:h-[9px] rounded-sm"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    boxShadow: '0 2px 4px rgba(34,197,94,0.4)',
                  }}
                />
              ))}
            </motion.div>
          )}
          {hasHotel && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.15 }}
            >
              <div className="relative">
                <div className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] rounded-lg flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  boxShadow: '0 3px 8px rgba(249,115,22,0.5)',
                }}>
                  <span className="text-[7px] sm:text-[9px] font-bold text-white">🏨</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {owner && (
          <motion.div
            className="absolute top-[4px] right-[4px] w-[10px] h-[10px] rounded-full border-2 border-black/40"
            style={{ background: owner.color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.2 }}
          />
        )}
        {isMortgaged && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <svg className="w-[60%] h-[60%] text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="0" y1="0" x2="24" y2="24" />
            </svg>
          </div>
        )}
      </div>

      {playersOnCell?.length > 0 && (
        <motion.div
          className="absolute bottom-[3px] left-[3px] right-[3px] flex gap-[3px] px-[3px] pb-[3px] flex-wrap justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {playersOnCell.map((p, i) => (
            <motion.div
              key={p.userId}
              className="relative"
              style={{ zIndex: playersOnCell.length - i }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: i * 0.05 }}
            >
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-black/60 shadow-lg"
                style={{ backgroundColor: p.color }}
              >
                {p.username && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background: p.color, color: '#fff' }}>
                    {p.username[0].toUpperCase()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

const MemoBoardCell = memo(BoardCell)

export default function MonopolyBoard({ gameState, currentPlayerId, onCellClick, highlightedCell, selectedCell, animatingPositions }) {
  const [hoveredCell, setHoveredCell] = useState(null)

  const grid = useMemo(() => {
    const g = Array.from({ length: 121 }).fill(null)
    for (let i = 0; i < BOARD.length; i++) {
      const pos = getGridPosition(i)
      g[pos.row * 11 + pos.col] = { ...BOARD[i], cellIndex: i }
    }
    return g
  }, [])

  const playerPositions = useMemo(() => {
    if (!gameState?.players) return {}
    const map = {}
    gameState.players.forEach((p) => {
      const pos = animatingPositions?.[p.userId] ?? p.position
      if (!map[pos]) map[pos] = []
      map[pos].push(p)
    })
    return map
  }, [gameState?.players, animatingPositions])

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
      <div style={{ width: 'min(100%, 100vh - 80px)', aspectRatio: '1/1' }}>
        <motion.div
          className="grid grid-cols-11 grid-rows-11 gap-[2px] sm:gap-[3px] w-full h-full"
          style={{ gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, 1fr)' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
        >
        {grid.map((item, idx) => {
          if (!item) {
            const row = Math.floor(idx / 11)
            const col = idx % 11
            const isCenter = row >= 2 && row <= 8 && col >= 2 && col <= 8
            return (
              <div key={`e-${idx}`} className="rounded" style={{ background: isCenter ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                {isCenter && row === 5 && col === 5 && (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 150, damping: 15 }}
                    >
                      <div className="text-[10px] sm:text-sm font-bold" style={{ fontFamily: 'Space Grotesk', color: 'rgba(255,255,255,0.15)' }}>xAura</div>
                      <div className="text-[6px] sm:text-[8px]" style={{ color: 'rgba(255,255,255,0.08)' }}>Monopoly</div>
                      <div className="mt-2 flex gap-1 justify-center">
                        {[0,1,2,3].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'][i] }}
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )
          }

          const cell = item
          const propData = gameState?.properties?.[cell.cellIndex]
const owner = propData ? gameState.players.find((p) => p.userId === propData.ownerId) : null
            const playersHere = playerPositions[cell.cellIndex] || []

            return (
              <MemoBoardCell
                key={cell.id}
                cell={cell}
                owner={owner ? { color: owner.color, username: owner.username } : null}
                houses={propData?.houses || 0}
                isMortgaged={propData?.isMortgaged || false}
                playersOnCell={playersHere}
                isHighlighted={highlightedCell === cell.cellIndex}
                isSelected={selectedCell === cell.cellIndex || hoveredCell === cell.cellIndex}
                onClick={() => onCellClick?.(cell.cellIndex)}
                onMouseEnter={() => setHoveredCell(cell.cellIndex)}
                onMouseLeave={() => setHoveredCell(null)}
              />
            )
        })}
      </motion.div>
      </div>
    </div>
  )
}