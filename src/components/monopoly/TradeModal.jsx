import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOARD } from '../../data/boardData'

const formatMoney = (amount) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`
  return `$${amount}`
}

export default function TradeModal({ myPlayer, targetPlayer, gameState, onOffer, onClose, existingTrade, onAccept, onDecline, onCounter }) {
  const [offerMoney, setOfferMoney] = useState(0)
  const [requestMoney, setRequestMoney] = useState(0)
  const [offerProps, setOfferProps] = useState([])
  const [requestProps, setRequestProps] = useState([])
  const [offerJailCards, setOfferJailCards] = useState(0)
  const [requestJailCards, setRequestJailCards] = useState(0)

  if (!myPlayer || !targetPlayer) return null

  const myProps = myPlayer.properties || []
  const targetProps = targetPlayer.properties || []

  const toggle = (id, list, setList) => {
    setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id])
  }

  const handleSend = () => {
    if (offerProps.length === 0 && offerMoney === 0 && requestProps.length === 0 && requestMoney === 0 && offerJailCards === 0 && requestJailCards === 0) return
    onOffer({
      toId: targetPlayer.userId,
      offer: { properties: offerProps, money: offerMoney, jailCards: offerJailCards },
      request: { properties: requestProps, money: requestMoney, jailCards: requestJailCards }
    })
  }

  if (existingTrade) {
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div className="relative w-full max-w-md rounded-2xl p-5" style={{ background: 'rgba(17,17,20,0.97)', border: '1px solid rgba(255,255,255,0.08)' }} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="font-bold text-sm mb-4" style={{ fontFamily: 'Space Grotesk' }}>Предложение обмена</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Вы отдаёте:</p>
                {existingTrade.offer.properties.map((id) => <div key={id} className="text-[10px] py-0.5">{BOARD[id]?.name}</div>)}
                {existingTrade.offer.money > 0 && <div className="text-[10px] text-amber-400">${existingTrade.offer.money}</div>}
                {existingTrade.offer.jailCards > 0 && <div className="text-[10px]">🃏 ×{existingTrade.offer.jailCards}</div>}
              </div>
              <div>
                <p className="text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Вы получаете:</p>
                {existingTrade.request.properties.map((id) => <div key={id} className="text-[10px] py-0.5">{BOARD[id]?.name}</div>)}
                {existingTrade.request.money > 0 && <div className="text-[10px] text-amber-400">${existingTrade.request.money}</div>}
                {existingTrade.request.jailCards > 0 && <div className="text-[10px]">🃏 ×{existingTrade.request.jailCards}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onAccept?.(existingTrade.id)} className="flex-1 btn-primary text-xs">Принять</button>
              <button onClick={() => onDecline?.(existingTrade.id)} className="flex-1 text-xs py-2 rounded-xl" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>Отклонить</button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative w-full max-w-lg rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: 'rgba(17,17,20,0.97)', border: '1px solid rgba(255,255,255,0.08)' }} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Обмен с <span style={{ color: targetPlayer.color }}>{targetPlayer.username}</span></h3>
            <button onClick={onClose} className="text-white/20 hover:text-white/50">×</button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-[10px] mb-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Вы отдаёте</p>
              {myProps.map((id) => (
                <motion.button
                  key={id}
                  onClick={() => toggle(id, offerProps, setOfferProps)}
                  className="w-full text-left text-[10px] px-2 py-1.5 rounded-lg mb-1 transition-all"
                  style={{
                    background: offerProps.includes(id) ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${offerProps.includes(id) ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)'}`,
                    color: offerProps.includes(id) ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {BOARD[id]?.name}
                </motion.button>
              ))}
              <div className="flex items-center gap-1 mt-1 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>$</span>
                <input
                  type="number"
                  value={offerMoney || ''}
                  onChange={(e) => setOfferMoney(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  max={myPlayer.balance}
                  className="bg-transparent text-[10px] w-full outline-none font-mono"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                />
                <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.1)' }}>/ {formatMoney(myPlayer.balance)}</span>
              </div>
              {myPlayer.getOutOfJailCards > 0 && (
                <div className="flex items-center gap-2 mt-1 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[9px]">🃏 Карты из тюрьмы:</span>
                  <select
                    value={offerJailCards}
                    onChange={(e) => setOfferJailCards(parseInt(e.target.value))}
                    className="bg-transparent text-[10px] outline-none text-white/70"
                    style={{ border: 'none', background: 'transparent' }}
                  >
                    {Array.from({ length: myPlayer.getOutOfJailCards + 1 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] mb-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Запрашиваете</p>
              {targetProps.map((id) => (
                <motion.button
                  key={id}
                  onClick={() => toggle(id, requestProps, setRequestProps)}
                  className="w-full text-left text-[10px] px-2 py-1.5 rounded-lg mb-1 transition-all"
                  style={{
                    background: requestProps.includes(id) ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${requestProps.includes(id) ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)'}`,
                    color: requestProps.includes(id) ? '#c084fc' : 'rgba(255,255,255,0.4)',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {BOARD[id]?.name}
                </motion.button>
              ))}
              <div className="flex items-center gap-1 mt-1 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>$</span>
                <input
                  type="number"
                  value={requestMoney || ''}
                  onChange={(e) => setRequestMoney(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  max={targetPlayer.balance}
                  className="bg-transparent text-[10px] w-full outline-none font-mono"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                />
                <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.1)' }}>/ {formatMoney(targetPlayer.balance)}</span>
              </div>
              {targetPlayer.getOutOfJailCards > 0 && (
                <div className="flex items-center gap-2 mt-1 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[9px]">🃏 Карты из тюрьмы:</span>
                  <select
                    value={requestJailCards}
                    onChange={(e) => setRequestJailCards(parseInt(e.target.value))}
                    className="bg-transparent text-[10px] outline-none text-white/70"
                    style={{ border: 'none', background: 'transparent' }}
                  >
                    {Array.from({ length: targetPlayer.getOutOfJailCards + 1 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <motion.button
            onClick={handleSend}
            disabled={offerProps.length === 0 && offerMoney === 0 && requestProps.length === 0 && requestMoney === 0 && offerJailCards === 0 && requestJailCards === 0}
            className="btn-primary w-full text-xs"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{ opacity: offerProps.length === 0 && offerMoney === 0 && requestProps.length === 0 && requestMoney === 0 && offerJailCards === 0 && requestJailCards === 0 ? 0.5 : 1 }}
          >
            Отправить предложение
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}