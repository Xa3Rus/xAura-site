import { useState } from 'react'
import { motion } from 'framer-motion'
import { CELLS } from '../dominion/gameData'

export default function TradeModal({ myPlayer, targetPlayer, gameState, onOffer, onClose }) {
  const [offerMoney, setOfferMoney] = useState(0)
  const [requestMoney, setRequestMoney] = useState(0)
  const [offerAssets, setOfferAssets] = useState([])
  const [requestAssets, setRequestAssets] = useState([])

  if (!myPlayer || !targetPlayer) return null

  const myProperties = CELLS.filter((c) =>
    (c.type === 'property' || c.type === 'music') && gameState.cellOwners[c.id] === myPlayer.id
  )
  const targetProperties = CELLS.filter((c) =>
    (c.type === 'property' || c.type === 'music') && gameState.cellOwners[c.id] === targetPlayer.id
  )

  const toggleAsset = (cellId, list, setList) => {
    if (list.includes(cellId)) setList(list.filter((id) => id !== cellId))
    else setList([...list, cellId])
  }

  const handleSubmit = () => {
    if (offerAssets.length === 0 && offerMoney === 0 && requestAssets.length === 0 && requestMoney === 0) return
    onOffer({
      targetId: targetPlayer.id,
      offererAssets,
      offererMoney: offerMoney,
      targetAssets: requestAssets,
      targetMoney: requestMoney,
    })
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: '#0A0A0A', border: '1px solid rgba(187,243,81,0.15)' }}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-sm" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
            Обмен с <span style={{ color: targetPlayer.color }}>{targetPlayer.name}</span>
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-sm transition-colors">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <h3 className="text-[10px] mb-2 font-medium" style={{ color: '#A0A0A0' }}>
              Вы отдаёте
            </h3>
            <div className="space-y-1.5">
              {myProperties.map((cell) => (
                <button
                  key={cell.id}
                  onClick={() => toggleAsset(cell.id, offerAssets, setOfferAssets)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left"
                  style={{
                    background: offerAssets.includes(cell.id) ? 'rgba(187,243,81,0.1)' : 'rgba(10,10,10,0.5)',
                    border: `1px solid ${offerAssets.includes(cell.id) ? 'rgba(187,243,81,0.2)' : 'rgba(187,243,81,0.06)'}`,
                    color: offerAssets.includes(cell.id) ? '#BBF351' : '#A0A0A0',
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cell.color }} />
                  <span className="truncate flex-1">{cell.name}</span>
                  <span className="font-mono text-[10px]">${cell.price}</span>
                </button>
              ))}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
                <span className="text-[10px]" style={{ color: '#A0A0A0' }}>$</span>
                <input
                  type="number"
                  value={offerMoney || ''}
                  onChange={(e) => setOfferMoney(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  max={myPlayer.balance}
                  className="bg-transparent text-xs w-full outline-none font-mono"
                  style={{ color: '#F0F0F0' }}
                />
                <span className="text-[10px]" style={{ color: '#A0A0A0' }}>/ ${myPlayer.balance}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] mb-2 font-medium" style={{ color: '#A0A0A0' }}>
              Запрашиваете
            </h3>
            <div className="space-y-1.5">
              {targetProperties.map((cell) => (
                <button
                  key={cell.id}
                  onClick={() => toggleAsset(cell.id, requestAssets, setRequestAssets)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left"
                  style={{
                    background: requestAssets.includes(cell.id) ? 'rgba(191,90,242,0.1)' : 'rgba(10,10,10,0.5)',
                    border: `1px solid ${requestAssets.includes(cell.id) ? 'rgba(191,90,242,0.2)' : 'rgba(187,243,81,0.06)'}`,
                    color: requestAssets.includes(cell.id) ? '#BF5AF2' : '#A0A0A0',
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cell.color }} />
                  <span className="truncate flex-1">{cell.name}</span>
                  <span className="font-mono text-[10px]">${cell.price}</span>
                </button>
              ))}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass">
                <span className="text-[10px]" style={{ color: '#A0A0A0' }}>$</span>
                <input
                  type="number"
                  value={requestMoney || ''}
                  onChange={(e) => setRequestMoney(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  max={targetPlayer.balance}
                  className="bg-transparent text-xs w-full outline-none font-mono"
                  style={{ color: '#F0F0F0' }}
                />
                <span className="text-[10px]" style={{ color: '#A0A0A0' }}>/ ${targetPlayer.balance}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={offerAssets.length === 0 && offerMoney === 0 && requestAssets.length === 0 && requestMoney === 0}
          className="btn-primary w-full disabled:opacity-40"
        >
          Предложить обмен
        </button>
      </motion.div>
    </motion.div>
  )
}
