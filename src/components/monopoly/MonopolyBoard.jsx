import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BOARD } from '../../data/boardData'

// classic monopoly group colors, tuned for dark neon theme
const GROUP_COLORS = {
  brown: '#9A5B33', lightblue: '#7FC8E8', pink: '#E0559B', orange: '#F7941D',
  red: '#E8443A', yellow: '#F2D300', green: '#2FB559', darkblue: '#3D6DC9',
}

const SPECIAL_META = {
  go: { label: 'СТАРТ', icon: '💵', color: '#00CC88' },
  jail: { label: 'ТЮРЬМА', icon: '🔒', color: '#FF8A33' },
  parking: { label: 'ПАРКОВКА', icon: '🅿️', color: '#00E5FF' },
  gotojail: { label: 'В ТЮРЬМУ', icon: '👮', color: '#FF5570' },
  chance: { label: 'ШАНС', icon: '❓', color: '#BF5AF2' },
  community: { label: 'КАЗНА', icon: '💰', color: '#00E5FF' },
  tax: { label: 'НАЛОГ', icon: '💸', color: '#FF8A33' },
}

function getGridPosition(cellId) {
  if (cellId <= 10) return { row: 10, col: cellId }
  if (cellId <= 19) return { row: 10 - (cellId - 10), col: 10 }
  if (cellId <= 30) return { row: 0, col: 10 - (cellId - 20) }
  return { row: cellId - 30, col: 0 }
}

// which board side the cell sits on → color band faces the center
function getSide(row, col) {
  if (row === 10) return 'bottom'
  if (row === 0) return 'top'
  if (col === 0) return 'left'
  return 'right'
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function BoardCell({ cell, row, col, owner, houses, isMortgaged, playersOnCell, isSelected, onClick }) {
  const side = getSide(row, col)
  const vertical = side === 'top' || side === 'bottom'
  const bandColor = cell.color ? GROUP_COLORS[cell.color] : null
  const special = SPECIAL_META[cell.type]
  const isSpecial = !!special
  const hasHotel = houses === 5
  const houseCount = hasHotel ? 0 : houses

  const border = isSelected
    ? '2px solid #BBF351'
    : owner
      ? `2px solid ${owner.color}`
      : '1px solid rgba(255,255,255,0.09)'

  const background = isSelected
    ? 'rgba(187,243,81,0.14)'
    : owner
      ? hexToRgba(owner.color, 0.12)
      : isSpecial
        ? hexToRgba(special.color, 0.05)
        : '#101010'

  const boxShadow = isSelected
    ? '0 0 18px rgba(187,243,81,0.4), inset 0 0 16px rgba(187,243,81,0.1)'
    : owner
      ? `0 0 12px ${hexToRgba(owner.color, 0.25)}, inset 0 0 18px ${hexToRgba(owner.color, 0.12)}`
      : 'none'

  // color band element, oriented toward board center
  const band = bandColor && (
    <div
      className="flex-shrink-0"
      style={{
        width: vertical ? '100%' : '18%',
        height: vertical ? '20%' : '100%',
        background: `linear-gradient(${vertical ? '180deg' : side === 'right' ? '90deg' : '270deg'}, ${bandColor} 0%, ${hexToRgba(bandColor, 0.75)} 100%)`,
        borderBottom: vertical && side === 'bottom' ? '1px solid rgba(0,0,0,0.45)' : undefined,
        borderTop: vertical && side === 'top' ? '1px solid rgba(0,0,0,0.45)' : undefined,
        borderRight: !vertical && side === 'right' ? '1px solid rgba(0,0,0,0.45)' : undefined,
        borderLeft: !vertical && side === 'left' ? '1px solid rgba(0,0,0,0.45)' : undefined,
      }}
    />
  )

  // houses / hotel placed next to the color band
  const housesRow = (houseCount > 0 || hasHotel) && (
    <div
      className="absolute flex items-center justify-center gap-[2px]"
      style={
        side === 'bottom' ? { top: '23%', left: 0, right: 0 }
        : side === 'top' ? { bottom: '23%', left: 0, right: 0 }
        : side === 'right' ? { left: '21%', top: 0, bottom: 0, flexDirection: 'column' }
        : { right: '21%', top: 0, bottom: 0, flexDirection: 'column' }
      }
    >
      {hasHotel ? (
        <motion.div
          className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-[2px] flex items-center justify-center"
          style={{ background: '#E8443A', boxShadow: '0 0 8px rgba(232,68,58,0.7)' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          title="Отель"
        >
          <span className="text-[5px] md:text-[6px] font-bold text-white leading-none">H</span>
        </motion.div>
      ) : (
        Array.from({ length: houseCount }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-[2px]"
            style={{ background: '#2FB559', boxShadow: '0 0 6px rgba(47,181,89,0.7)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, delay: i * 0.05 }}
            title={`Домов: ${houseCount}`}
          />
        ))
      )}
    </div>
  )

  const content = (
    <div className="flex-1 flex flex-col items-center justify-center min-w-0 min-h-0 px-[4%] py-[3%] gap-[1px]">
      {isSpecial ? (
        <>
          <span className="text-sm md:text-base lg:text-xl leading-none" style={{ filter: `drop-shadow(0 0 6px ${hexToRgba(special.color, 0.5)})` }}>
            {special.icon}
          </span>
          <span
            className="text-[7px] md:text-[8px] lg:text-[9px] font-bold text-center leading-tight"
            style={{ color: special.color, fontFamily: 'Quantico, Inter, sans-serif' }}
          >
            {special.label}
          </span>
          {cell.amount && <span className="text-[7px] md:text-[8px] font-mono" style={{ color: '#8A8A8A' }}>-${cell.amount}</span>}
        </>
      ) : (
        <>
          {(cell.type === 'railroad' || cell.type === 'utility') && (
            <span className="text-[10px] md:text-xs lg:text-sm leading-none">
              {cell.type === 'railroad' ? '🚂' : cell.id === 12 ? '⚡' : '💧'}
            </span>
          )}
          <span
            className="text-[7px] md:text-[8px] lg:text-[9px] font-semibold text-center leading-[1.15] overflow-hidden"
            style={{
              color: owner ? '#FFFFFF' : '#D8D8D8',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}
          >
            {cell.name}
          </span>
          {cell.price && (
            <span className="text-[7px] md:text-[8px] font-mono leading-none" style={{ color: owner ? hexToRgba('#FFFFFF', 0.75) : '#8A8A8A' }}>
              ${cell.price}
            </span>
          )}
        </>
      )}
    </div>
  )

  return (
    <motion.div
      className={`relative flex ${vertical ? 'flex-col' : 'flex-row'} overflow-hidden cursor-pointer select-none`}
      style={{
        gridRow: row + 1,
        gridColumn: col + 1,
        background,
        border,
        boxShadow,
        borderRadius: 4,
        zIndex: isSelected ? 20 : 1,
      }}
      whileHover={{ scale: 1.07, zIndex: 30, boxShadow: '0 8px 28px rgba(0,0,0,0.7)' }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      onClick={onClick}
      title={cell.name}
    >
      {(side === 'bottom' || side === 'right') && band}
      {content}
      {(side === 'top' || side === 'left') && band}

      {housesRow}

      {/* owner badge */}
      {owner && (
        <motion.div
          className="absolute w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border border-black/50"
          style={{
            top: side === 'bottom' ? '24%' : 2,
            bottom: side === 'top' ? '24%' : undefined,
            right: side === 'left' ? '22%' : 2,
            left: side === 'right' ? '22%' : undefined,
            background: owner.color,
            boxShadow: `0 0 6px ${owner.color}`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          title={`Владелец: ${owner.username}`}
        />
      )}

      {/* mortgaged overlay */}
      {isMortgaged && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center" style={{ backdropFilter: 'grayscale(1)' }}>
          <span className="text-[7px] md:text-[8px] font-bold uppercase" style={{ color: '#8A8A8A', transform: 'rotate(-18deg)' }}>Залог</span>
        </div>
      )}

      {/* player tokens */}
      {playersOnCell?.length > 0 && (
        <div className="absolute inset-x-0 bottom-[2px] flex justify-center gap-[2px] flex-wrap px-[2px]">
          {playersOnCell.map((p, i) => (
            <motion.div
              key={p.userId}
              className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-black/60 flex items-center justify-center"
              style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${hexToRgba(p.color, 0.6)}`, zIndex: playersOnCell.length - i }}
              initial={{ scale: 0, y: 6 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20, delay: i * 0.04 }}
              title={p.username}
            >
              {p.token ? (
                <span className="text-[8px] md:text-[10px] leading-none">{p.token}</span>
              ) : (
                <span className="text-[6px] font-bold text-white">{p.username?.[0]?.toUpperCase()}</span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

const MemoBoardCell = memo(BoardCell)

export default function MonopolyBoard({ gameState, currentPlayerId, onCellClick, selectedCell, animatingPositions, centerContent }) {
  const cells = useMemo(
    () => BOARD.map((cell, i) => ({ ...cell, cellIndex: i, pos: getGridPosition(i) })),
    []
  )

  const playerPositions = useMemo(() => {
    if (!gameState?.players) return {}
    const map = {}
    gameState.players.forEach((p) => {
      if (p.isBankrupt) return
      const pos = animatingPositions?.[p.userId] ?? p.position
      if (!map[pos]) map[pos] = []
      map[pos].push(p)
    })
    return map
  }, [gameState?.players, animatingPositions])

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div style={{ width: 'min(100%, 100vh - 96px)', aspectRatio: '1/1' }}>
        <motion.div
          className="grid w-full h-full"
          style={{
            gridTemplateColumns: 'repeat(11, 1fr)',
            gridTemplateRows: 'repeat(11, 1fr)',
            gap: 3,
            padding: 4,
            background: 'rgba(8,8,8,0.9)',
            borderRadius: 14,
            border: '1px solid rgba(187,243,81,0.12)',
            boxShadow: '0 0 60px rgba(187,243,81,0.06), 0 20px 60px rgba(0,0,0,0.5)',
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 22 }}
        >
          {cells.map((cell) => {
            const propData = gameState?.properties?.[cell.cellIndex]
            const ownerPlayer = propData?.ownerId ? gameState?.players?.find((p) => p.userId === propData.ownerId) : null
            return (
              <MemoBoardCell
                key={cell.id}
                cell={cell}
                row={cell.pos.row}
                col={cell.pos.col}
                owner={ownerPlayer ? { color: ownerPlayer.color, username: ownerPlayer.username } : null}
                houses={propData?.houses || 0}
                isMortgaged={propData?.isMortgaged || false}
                playersOnCell={playerPositions[cell.cellIndex] || []}
                isSelected={selectedCell === cell.cellIndex}
                onClick={() => onCellClick?.(cell.cellIndex)}
              />
            )
          })}

          {/* center area (chat / info) */}
          <div
            style={{ gridColumn: '2 / span 9', gridRow: '2 / span 9', minWidth: 0, minHeight: 0, zIndex: 0 }}
            className="overflow-hidden"
          >
            {centerContent}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
