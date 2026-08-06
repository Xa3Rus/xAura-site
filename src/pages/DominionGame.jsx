import { useState, useContext, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { getSocket } from '../services/socket'
import DominionBoard from '../components/DominionBoard'
import DominionDice from '../components/DominionDice'
import ChatPanel from '../components/ChatPanel'
import TradeModal from '../components/TradeModal'
import DominionEventModal from '../components/DominionEventModal'
import DominionGameOver from '../components/DominionGameOver'
import { CELLS } from '../dominion/gameData'

export default function DominionGame() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [gameState, setGameState] = useState(null)
  const [room, setRoom] = useState(null)
  const [cellAction, setCellAction] = useState(null)
  const [showEvent, setShowEvent] = useState(null)
  const [showTrade, setShowTrade] = useState(false)
  const [tradeTarget, setTradeTarget] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    const gs = location.state?.gameState
    if (gs) {
      setGameState(gs)
      const s = getSocket(user.id, user.username)
      socketRef.current = s
      s.emit('room:state', null, (res) => { if (res?.room) setRoom(res.room) })
    } else {
      navigate('/dominion')
    }
  }, [user, navigate, location.state])

  useEffect(() => {
    const s = socketRef.current
    if (!s) return

    s.on('game:updated', (newState) => {
      setGameState(newState)
      if (newState.phase === 'waiting_for_roll') {
        setCellAction(null)
        setShowEvent(null)
        setPendingAction(null)
      }
      if (newState.winner) {
        // game over handled by phase
      }
    })

    s.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    s.on('chat:typing', (data) => {
      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === data.userId)
        if (exists) return prev
        const timeout = setTimeout(() => {
          setTypingUsers((p) => p.filter((u) => u.userId !== data.userId))
        }, 3000)
        return [...prev, { ...data, timeout }]
      })
    })

    s.on('trade:offered', (trade) => {
      setGameState((prev) => {
        if (!prev) return prev
        return { ...prev, activeTrades: [...(prev.activeTrades || []), trade] }
      })
    })

    s.on('trade:completed', () => {
      setGameState((prev) => prev ? { ...prev } : prev)
    })

    s.on('trade:declined', () => {
      setGameState((prev) => prev ? { ...prev } : prev)
    })

    s.on('room:updated', (updatedRoom) => {
      setRoom(updatedRoom)
    })

    return () => {
      s.off('game:updated')
      s.off('chat:message')
      s.off('chat:typing')
      s.off('trade:offered')
      s.off('trade:completed')
      s.off('trade:declined')
      s.off('room:updated')
    }
  }, [])

  const currentPlayer = gameState?.players?.find((p) => p.id === user?.id)
  const currentTurnPlayer = gameState?.players?.[gameState?.currentPlayerIdx]
  const isMyTurn = currentTurnPlayer?.id === user?.id

  const emitAction = useCallback((action, data) => {
    const s = socketRef.current
    if (!s) return
    return new Promise((resolve) => {
      s.emit('game:action', action, data, (res) => {
        if (res?.error) console.error(res.error)
        resolve(res)
      })
    })
  }, [])

  const handleRoll = useCallback(async () => {
    if (!isMyTurn || animating) return
    setAnimating(true)
    const res = await emitAction('roll_dice')
    setTimeout(async () => {
      setAnimating(false)
      if (res?.success !== false) {
        // after roll, need to show cell action
        const actionRes = await emitAction('cell_action')
        if (actionRes?.state) setGameState(actionRes.state)
        setCellAction(actionRes)
      }
    }, 1200)
  }, [isMyTurn, animating, emitAction])

  const handleBuy = useCallback(async () => {
    const res = await emitAction('buy')
    if (res?.success) setCellAction(null)
  }, [emitAction])

  const handlePayRent = useCallback(async () => {
    const res = await emitAction('pay_rent')
    setCellAction(null)
  }, [emitAction])

  const handlePayTax = useCallback(async () => {
    const res = await emitAction('pay_tax')
    setCellAction(null)
  }, [emitAction])

  const handleEvent = useCallback(async () => {
    const res = await emitAction('event')
    if (res?.event) setShowEvent(res.event)
    setCellAction(null)
  }, [emitAction])

  const handleUpgrade = useCallback(async (cellId) => {
    await emitAction('upgrade', { cellId })
  }, [emitAction])

  const handleEndTurn = useCallback(async () => {
    setShowEvent(null)
    setCellAction(null)
    setPendingAction(null)
    await emitAction('end_turn')
  }, [emitAction])

  const handleTrade = useCallback((targetId) => {
    setTradeTarget(targetId)
    setShowTrade(true)
  }, [])

  const handleSendMessage = useCallback((message, toId) => {
    const s = socketRef.current
    if (!s || !message.trim()) return
    if (toId) {
      s.emit('chat:private', { message, toId })
    } else {
      s.emit('chat:send', { message })
    }
  }, [])

  const handleTyping = useCallback((toId) => {
    const s = socketRef.current
    if (!s) return
    s.emit('chat:typing', { toId })
  }, [])

  const handleTradeOffer = useCallback((offer) => {
    const s = socketRef.current
    if (!s) return
    s.emit('trade:offer', offer, (res) => {
      if (res?.error) console.error(res.error)
      else setShowTrade(false)
    })
  }, [])

  const handleTradeAccept = useCallback((tradeId) => {
    const s = socketRef.current
    if (!s) return
    s.emit('trade:accept', { tradeId })
  }, [])

  const handleTradeDecline = useCallback((tradeId) => {
    const s = socketRef.current
    if (!s) return
    s.emit('trade:decline', { tradeId })
  }, [])

  if (!gameState) return <div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-white/20">Загрузка...</p></div>

  const canUpgrade = (cellId) => {
    if (!isMyTurn) return false
    if (!currentPlayer) return false
    if (gameState.cellOwners[cellId] !== currentPlayer.id) return false
    const level = gameState.upgrades[cellId] || 0
    if (level >= 3) return false
    const cell = CELLS.find((c) => c.id === cellId)
    if (!cell) return false
    const cost = Math.floor(cell.price * 0.5 * (level + 1))
    return currentPlayer.balance >= cost
  }

  const getMyPendingTrades = () => {
    if (!gameState?.activeTrades || !user) return []
    return gameState.activeTrades.filter((t) => t.targetId === user.id && t.status === 'pending')
  }

  return (
    <div className="min-h-screen pt-16 pb-4 px-2 sm:px-4" style={{ background: '#0a0a0c' }}>
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-3 h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dominion')} className="text-xs text-white/20 hover:text-white/50 transition-colors">
                ← Лобби
              </button>
              <h1 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                <span className="text-white/60">xAura</span>
                <span className="text-amber-400 ml-1">Dominion</span>
              </h1>
            </div>
            <button onClick={() => setChatOpen(!chatOpen)} className="lg:hidden text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              Чат {messages.length > 0 && <span className="text-amber-400 ml-1">•</span>}
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <DominionBoard
              gameState={gameState}
              currentPlayerId={user?.id}
              onUpgrade={handleUpgrade}
              canUpgrade={canUpgrade}
            />
          </div>

          <div className="mt-3">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Ход: <span className="text-white/50 font-medium">{currentTurnPlayer?.name}</span>
                    {isMyTurn && <span className="text-amber-400 ml-1">(Вы)</span>}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {gameState.players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                        style={{
                          background: p.id === currentTurnPlayer?.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                          border: `1px solid ${p.id === currentTurnPlayer?.id ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                          opacity: p.isBankrupt ? 0.3 : 1,
                        }}
                        onClick={() => !p.isBankrupt && handleTrade(p.id)}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-xs" style={{ color: p.isBankrupt ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)' }}>{p.name}</span>
                        <span className="text-xs font-mono font-bold" style={{ color: p.balance < 0 ? '#f43f5e' : p.color }}>
                          ${p.balance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isMyTurn && (
                    <>
                      {gameState.phase === 'waiting_for_roll' && (
                        <DominionDice
                          onRoll={handleRoll}
                          disabled={animating}
                          dice={gameState.dice}
                          rolling={animating}
                        />
                      )}
                      {gameState.phase === 'action' && cellAction?.action === 'can_buy' && (
                        <div className="flex gap-2">
                          <button onClick={handleBuy} className="btn-primary text-xs !py-2">Купить</button>
                          <button onClick={handleEndTurn} className="text-xs px-4 py-2 rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            Пропустить
                          </button>
                        </div>
                      )}
                      {gameState.phase === 'action' && cellAction?.action === 'pay_rent' && (
                        <button onClick={handlePayRent} className="btn-primary text-xs !py-2">
                          Заплатить ${cellAction.rent} аренду
                        </button>
                      )}
                      {gameState.phase === 'action' && cellAction?.action === 'pay_tax' && (
                        <button onClick={handlePayTax} className="btn-primary text-xs !py-2">
                          Заплатить налог ${cellAction.amount}
                        </button>
                      )}
                      {gameState.phase === 'action' && cellAction?.action === 'event' && (
                        <button onClick={handleEvent} className="btn-primary text-xs !py-2">Открыть событие</button>
                      )}
                      {gameState.phase === 'action' && (cellAction?.action === 'none' || cellAction?.action === 'just_visiting' || cellAction?.action === 'own_property') && (
                        <button onClick={handleEndTurn} className="text-xs px-4 py-2 rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          Завершить ход
                        </button>
                      )}
                    </>
                  )}
                  {!isMyTurn && gameState.phase !== 'game_over' && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Ожидание хода...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {getMyPendingTrades().length > 0 && (
            <div className="mt-2 space-y-1">
              {getMyPendingTrades().map((trade) => {
                const offerer = gameState.players.find((p) => p.id === trade.offererId)
                return (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
                  >
                    <span className="text-xs text-white/50">{offerer?.name} предлагает обмен</span>
                    <button onClick={() => handleTradeAccept(trade.id)} className="text-xs text-mint-400 hover:text-mint-300 transition-colors">Принять</button>
                    <button onClick={() => handleTradeDecline(trade.id)} className="text-xs text-coral-400 hover:text-coral-300 transition-colors">Отклонить</button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <div className={`w-full lg:w-80 flex-shrink-0 ${chatOpen ? 'block' : 'hidden lg:block'}`}>
          <ChatPanel
            messages={messages}
            players={gameState.players}
            currentUserId={user?.id}
            onSend={handleSendMessage}
            onTyping={handleTyping}
            typingUsers={typingUsers}
          />
        </div>
      </div>

      <AnimatePresence>
        {showEvent && (
          <DominionEventModal event={showEvent} onClose={() => setShowEvent(null)} />
        )}
        {gameState.phase === 'game_over' && (
          <DominionGameOver
            winner={gameState.players.find((p) => p.id === gameState.winner)}
            players={gameState.players}
            onPlayAgain={() => navigate('/dominion')}
          />
        )}
        {showTrade && (
          <TradeModal
            myPlayer={currentPlayer}
            targetPlayer={gameState.players.find((p) => p.id === tradeTarget)}
            gameState={gameState}
            onOffer={handleTradeOffer}
            onClose={() => { setShowTrade(false); setTradeTarget(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
