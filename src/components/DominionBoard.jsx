import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CELLS, PLAYER_COLORS } from '../dominion/gameData'

const GRID_SIZE = 11

function getGridPosition(cellId) {
  if (cellId <= 10) return { row: GRID_SIZE - 1, col: cellId }
  if (cellId <= 19) return { row: GRID_SIZE - 1 - (cellId - 10), col: GRID_SIZE - 1 }
  if (cellId <= 30) return { row: 0, col: GRID_SIZE - 1 - (cellId - 20) }
  return { row: cellId - 30, col: 0 }
}

function Tile({ cell, owner, ownerColor, upgradeLevel, playersOnCell, isMyProperty, canUpgradeCell, onUpgrade, isCorner }) {
  const level = upgradeLevel || 0
  const isOwned = !!owner
  const hasPlayers = playersOnCell.length > 0

  return (
    <div
      className={`relative flex flex-col rounded-lg overflow-hidden transition-all duration-200 ${isCorner ? 'min-h-[70px]' : 'min-h-[56px]'}`}
      style={{
        background: cell.type === 'start' ? 'rgba(0,204,136,0.08)' :
                    cell.type === 'jail' ? 'rgba(255,51,102,0.06)' :
                    cell.type === 'parking' ? 'rgba(0,229,255,0.06)' :
                    cell.type === 'tax' ? 'rgba(187,243,81,0.06)' :
                    cell.type === 'event' ? 'rgba(191,90,242,0.06)' :
                    'rgba(255,255,255,0.02)',
        border: `1px solid ${isOwned ? (ownerColor + '30') : 'rgba(255,255,255,0.04)'}`,
      }}
    >
      {cell.color && (
        <div className="h-1 w-full flex-shrink-0" style={{ background: cell.color }} />
      )}
      {cell.type === 'start' && <div className="h-1 w-full flex-shrink-0 bg-mint-500" />}
      {cell.type === 'jail' && <div className="h-1 w-full flex-shrink-0 bg-coral-500" />}

      <div className="flex-1 flex flex-col justify-between px-1 py-0.5 min-w-0">
        <span className="text-[7px] sm:text-[8px] font-medium truncate leading-tight" style={{
          color: cell.type === 'start' ? '#00CC88' :
                 cell.type === 'jail' ? '#FF6688' :
                 cell.type === 'tax' ? '#FF8A33' :
                 cell.type === 'event' ? '#BF5AF2' :
                 'rgba(255,255,255,0.45)'
        }}>
          {cell.name}
        </span>

        {cell.price && (
          <span className="text-[6px] sm:text-[7px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
            ${cell.price}
          </span>
        )}
        {cell.amount && cell.type === 'tax' && (
          <span className="text-[6px] sm:text-[7px] font-mono text-neon-400">-${cell.amount}</span>
        )}

        {level > 0 && (
          <div className="flex gap-px">
            {Array.from({ length: level }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ background: ownerColor || '#FF8A33' }} />
            ))}
          </div>
        )}
      </div>

      {isMyProperty && canUpgradeCell && level < 3 && (
        <button
          onClick={(e) => { e.stopPropagation(); onUpgrade(cell.id) }}
          className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold z-10 transition-all hover:scale-110"
          style={{ background: 'rgba(187,243,81,0.9)', color: '#000000' }}
        >
          +
        </button>
      )}

      {hasPlayers && (
        <div className="absolute bottom-0.5 left-0.5 flex gap-0.5 z-10">
          {playersOnCell.map((p) => (
            <motion.div
              key={p.id}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-black/50"
              style={{ backgroundColor: p.color }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            />
          ))}
        </div>
      )}

      {owner && (
        <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-bl-md" style={{ background: ownerColor || '#666' }} />
      )}
    </div>
  )
}

const MemoTile = memo(Tile)

function DominionBoard({ gameState, currentPlayerId, onUpgrade, canUpgrade }) {
  const grid = useMemo(() => {
    const g = Array.from({ length: GRID_SIZE * GRID_SIZE }).fill(null)
    for (let i = 0; i < CELLS.length; i++) {
      const pos = getGridPosition(i)
      g[pos.row * GRID_SIZE + pos.col] = { ...CELLS[i], cellIndex: i }
    }
    return g
  }, [])

  const playerPositions = useMemo(() => {
    if (!gameState?.players) return {}
    const map = {}
    gameState.players.forEach((p) => {
      if (!map[p.position]) map[p.position] = []
      map[p.position].push(p)
    })
    return map
  }, [gameState?.players, gameState?.players?.map((p) => p.position).join(',')])

  if (!gameState) return null

  return (
    <div className="w-full max-w-[min(90vw,620px)] aspect-square mx-auto">
      <div className="grid gap-[3px] sm:gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
        {grid.map((cell, idx) => {
          if (!cell) {
            const row = Math.floor(idx / GRID_SIZE)
            const col = idx % GRID_SIZE
            const isCenter = row >= 2 && row <= 8 && col >= 2 && col <= 8
            return (
              <div
                key={`empty-${idx}`}
                className="rounded-lg flex items-center justify-center"
                style={{
                  background: isCenter ? 'rgba(255,255,255,0.01)' : 'transparent',
                  border: isCenter ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}
              >
                {isCenter && row === 5 && col === 5 && (
                  <div className="text-center">
                    <div className="text-[10px] sm:text-xs font-bold" style={{ fontFamily: 'Quantico, Inter, sans-serif', color: 'rgba(255,255,255,0.15)' }}>
                      xAura
                    </div>
                    <div className="text-[7px] sm:text-[8px]" style={{ color: 'rgba(255,255,255,0.06)' }}>Dominion</div>
                  </div>
                )}
              </div>
            )
          }

          const owner = gameState.cellOwners[cell.id]
          const ownerPlayer = owner ? gameState.players.find((p) => p.id === owner) : null
          const playersOnCell = playerPositions[cell.cellIndex] || []
          const isCorner = [0, 10, 20, 30].includes(cell.id)
          const isMyProperty = owner === currentPlayerId
          const upgradeLevel = gameState.upgrades[cell.id] || 0
          const canUpgradeThis = canUpgrade ? canUpgrade(cell.id) : false

          return (
            <MemoTile
              key={cell.id}
              cell={cell}
              owner={owner}
              ownerColor={ownerPlayer?.color}
              upgradeLevel={upgradeLevel}
              playersOnCell={playersOnCell}
              isMyProperty={isMyProperty}
              canUpgradeCell={canUpgradeThis}
              onUpgrade={onUpgrade}
              isCorner={isCorner}
            />
          )
        })}
      </div>
    </div>
  )
}

export default memo(DominionBoard)
