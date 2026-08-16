import { useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getMonopolySocket, getSocket, waitConnected } from '../services/monopolySocket'
import { ROOM_CODE_KEY } from './MonopolyLobby'
import MonopolyBoard from '../components/monopoly/MonopolyBoard'
import Dice from '../components/monopoly/Dice'
import TradeModal from '../components/monopoly/TradeModal'
import AuctionModal from '../components/monopoly/AuctionModal'
import CardModal from '../components/monopoly/CardModal'
import GameOverModal from '../components/monopoly/GameOverModal'
import BankruptModal from '../components/monopoly/BankruptModal'
import PlayerPanel from '../components/monopoly/PlayerPanel'
import PropertyCard from '../components/monopoly/PropertyCard'
import GameLog from '../components/monopoly/GameLog'
import { BOARD } from '../data/boardData'
import { initAudio, playDiceRoll, playDiceLand, playBuy, playBuild, playJail, playJailRelease, playBankrupt, playCardDraw, playTurnEnd, playError, playAuctionBid, playTradeOffer, playMoneyGain, playMoneyLoss, playNotification, playWin, playStep, toggleMute, isMuted } from '../utils/sounds'

export default function MonopolyGame() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const [gameState, setGameState] = useState(null)
  const [room, setRoom] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [eventOverlay, setEventOverlay] = useState([])
  const [incomingTrades, setIncomingTrades] = useState([])
  const [showCard, setShowCard] = useState(null)
  const [showBankrupt, setShowBankrupt] = useState(null)
  const [showTrade, setShowTrade] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [gameError, setGameError] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [lastDice, setLastDice] = useState(null)
  const [animatingPositions, setAnimatingPositions] = useState(null)
  const [connected, setConnected] = useState(true)
  const [muted, setMuted] = useState(isMuted())

  const socketRef = useRef(null)
  const rollingRef = useRef(false)
  const chatEndRef = useRef(null)
  const prevPositions = useRef({})
  const animInterval = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    initAudio()
    return () => { document.body.style.overflow = ''; document.documentElement.style.overflow = '' }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    // always rejoin through the socket — the server is the source of truth.
    // location.state survives page refreshes (history.state) and would be a
    // stale snapshot, so it's only used as a fallback for the room code.
    const restore = async () => {
      try {
        const code = localStorage.getItem(ROOM_CODE_KEY) || location.state?.room?.code || location.state?.gameState?.roomId
        if (!code) { navigate('/monopoly'); return }
        let s = getSocket()
        if (!s) {
          const { data } = await supabase.auth.getSession()
          if (cancelled) return
          if (!data?.session?.access_token) { navigate('/login'); return }
          s = getMonopolySocket(data.session.access_token)
        }
        socketRef.current = s
        setupSocketListeners(s)
        await waitConnected(s, 8000)
        if (cancelled) return
        s.emit('room:join', { code }, (res) => {
          if (cancelled) return
          if (res?.gameState) {
            setGameState(res.gameState)
            setRoom({ code })
            prevPositions.current = {}
            res.gameState.players?.forEach((p) => { prevPositions.current[p.userId] = p.position })
          } else if (res?.room) {
            // game hasn't started yet — back to lobby
            navigate('/monopoly')
          } else {
            localStorage.removeItem(ROOM_CODE_KEY)
            navigate('/monopoly')
          }
        })
      } catch {
        if (!cancelled) navigate('/monopoly')
      }
    }
    restore()

    return () => {
      cancelled = true
      if (animInterval.current) { clearInterval(animInterval.current); animInterval.current = null }
      if (socketRef.current) {
        const sk = socketRef.current
        sk.off('game:updated')
        sk.off('chat:message')
        sk.off('game:event')
        sk.off('auction:started')
        sk.off('auction:updated')
        sk.off('auction:ended')
        sk.off('trade:offered')
        sk.off('trade:accepted')
        sk.off('trade:declined')
        sk.off('room:updated')
        sk.off('error')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // re-map socket to room after network reconnect
  useEffect(() => {
    const s = socketRef.current
    if (!s) return
    const onConnect = () => {
      setConnected(true)
      const code = room?.code || gameState?.roomId
      if (code && s.connected) s.emit('room:join', { code }, () => {})
    }
    const onDisconnect = () => setConnected(false)
    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    setConnected(s.connected)
    return () => { s.off('connect', onConnect); s.off('disconnect', onDisconnect) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.code, gameState?.roomId, gameState])

  const setupSocketListeners = useCallback((s) => {
    if (!s) return

    s.off('game:updated')
    s.off('chat:message')
    s.off('game:event')
    s.off('auction:started')
    s.off('auction:updated')
    s.off('auction:ended')
    s.off('trade:offered')
    s.off('trade:accepted')
    s.off('trade:declined')
    s.off('room:updated')
    s.off('error')

    s.on('game:updated', (newState) => {
      if (!newState) return
      const prev = prevPositions.current
      const animations = []

      newState.players?.forEach((p) => {
        const oldPos = prev[p.userId]
        if (oldPos !== undefined && oldPos !== p.position) {
          animations.push({ userId: p.userId, from: oldPos, to: p.position, username: p.username })
        }
      })

      // apply server state immediately — token movement is a visual overlay only,
      // so UI (buy buttons, phase) never waits for the animation to finish
      setGameState(newState)
      prevPositions.current = {}
      newState.players?.forEach((p) => { prevPositions.current[p.userId] = p.position })
      if (animations.length > 0) runMovementAnimation(animations)

      if (newState?.lastCard) {
        setShowCard({ card: newState.lastCard, type: newState.lastCardType || 'chance' })
        addEventOverlay({ text: `${newState.lastCard.text}`, type: 'card' })
        setTimeout(() => {
          setGameState((prev) => prev ? { ...prev, lastCard: null, lastCardType: null } : prev)
        }, 100)
      }

      if (newState?.lastBankrupt) {
        const bp = newState.players?.find((p) => p.userId === newState.lastBankrupt)
        const creditor = newState.lastCreditor ? newState.players?.find((p) => p.userId === newState.lastCreditor) : null
        if (bp) setShowBankrupt({ player: bp, creditor })
      }

      rollingRef.current = false
      setRolling(false)
    })

    s.on('chat:message', (msg) => {
      setChatMessages((prev) => [...prev, msg])
    })

    s.on('game:event', (msg) => {
      setChatMessages((prev) => [...prev, msg])
      if (msg.type === 'jail') playJail()
      if (msg.type === 'jailRelease') playJailRelease()
      if (msg.type === 'bankrupt') playBankrupt()
      if (msg.type === 'card') playCardDraw()
      if (msg.type === 'buy') playBuy()
      if (msg.type === 'build') playBuild()
      if (msg.type === 'auction:started') playAuctionBid()
      if (msg.type === 'trade:offered') playTradeOffer()
      if (msg.type === 'rent') playMoneyLoss()
      if (msg.type === 'pay') playMoneyLoss()
      if (msg.type === 'receive') playMoneyGain()
    })

    s.on('auction:started', () => { addEventOverlay({ text: 'Auction started!', type: 'info' }); playAuctionBid() })
    s.on('auction:ended', () => addEventOverlay({ text: 'Auction ended', type: 'info' }))

    s.on('trade:offered', (trade) => {
      playTradeOffer()
      setIncomingTrades((prev) => {
        if (prev.find((t) => t.id === trade.id)) return prev
        return [...prev, trade]
      })
    })
    s.on('trade:accepted', (trade) => setIncomingTrades((prev) => prev.filter((t) => t.id !== trade.id)))
    s.on('trade:declined', (trade) => setIncomingTrades((prev) => prev.filter((t) => t.id !== trade.id)))
    s.on('room:updated', (updatedRoom) => setRoom(updatedRoom))
    s.on('error', (msg) => {
      setGameError(typeof msg === 'string' ? msg : msg?.message || 'Error')
      setTimeout(() => setGameError(null), 4000)
    })
  }, [])

  const runMovementAnimation = useCallback((moves) => {
    if (animInterval.current) { clearInterval(animInterval.current); animInterval.current = null }
    const TOTAL_CELLS = 40
    let step = 0
    const maxSteps = moves.reduce((max, m) => {
      const dist = m.to >= m.from ? m.to - m.from : TOTAL_CELLS - m.from + m.to
      return Math.max(max, dist)
    }, 0)

    animInterval.current = setInterval(() => {
      step++
      playStep()
      setAnimatingPositions((prev) => {
        const next = {}
        moves.forEach((m) => {
          const dist = m.to >= m.from ? m.to - m.from : TOTAL_CELLS - m.from + m.to
          if (step >= dist) {
            next[m.userId] = m.to
          } else {
            next[m.userId] = (m.from + step) % TOTAL_CELLS
          }
        })
        return next
      })
      if (step >= maxSteps) {
        clearInterval(animInterval.current)
        animInterval.current = null
        setAnimatingPositions(null)
      }
    }, 150)
  }, [])

  const addEventOverlay = useCallback((event) => {
    setEventOverlay((prev) => [...prev, { ...event, id: Date.now() + Math.random() }])
    setTimeout(() => {
      setEventOverlay((prev) => prev.slice(1))
    }, 4000)
  }, [])

  const currentPlayer = gameState?.players?.find((p) => p.userId === user?.id)
  const currentTurnPlayer = gameState?.players?.[gameState?.currentPlayerIndex]
  const isMyTurn = currentTurnPlayer?.userId === user?.id
  const isGameOver = gameState?.phase === 'game_over'

  // sound cue when it becomes my turn
  const prevMyTurn = useRef(false)
  useEffect(() => {
    if (isMyTurn && !prevMyTurn.current && !isGameOver) {
      playNotification()
      addEventOverlay({ text: 'Ваш ход!', type: 'info' })
    }
    prevMyTurn.current = isMyTurn
  }, [isMyTurn, isGameOver, addEventOverlay])

  useEffect(() => {
    if (isGameOver) playWin()
  }, [isGameOver])

  const emitSafe = useCallback((event, data, cb) => {
    const s = socketRef.current
    if (!s || !s.connected) {
      setGameError('No connection')
      setTimeout(() => setGameError(null), 3000)
      return
    }
    s.emit(event, data, (res) => {
      if (res?.error) { setGameError(res.error); setTimeout(() => setGameError(null), 4000) }
      if (cb) cb(res)
    })
  }, [])

  const handleRollDice = useCallback(() => {
    if (!isMyTurn || rollingRef.current) return
    rollingRef.current = true
    setRolling(true)
    playDiceRoll()
    emitSafe('game:rollDice', null, (res) => {
      if (res?.error) { rollingRef.current = false; setRolling(false); return }
      if (res?.dice) {
        setLastDice(res.dice)
        playDiceLand()
        addEventOverlay({ text: `${currentPlayer?.username || 'Player'} rolled ${res.dice.d1} + ${res.dice.d2} = ${(res.dice.d1 || 0) + (res.dice.d2 || 0)}`, type: 'dice' })
      }
    })
  }, [isMyTurn, emitSafe, currentPlayer?.username, addEventOverlay])

  const handleBuy = useCallback((cellIndex) => {
    playBuy()
    emitSafe('game:buy', { cellIndex })
  }, [emitSafe])

  const handleDeclineBuy = useCallback(() => {
    playTurnEnd()
    emitSafe('game:declineBuy')
  }, [emitSafe])

  const handleEndTurn = useCallback(() => {
    setSelectedCell(null)
    setLastDice(null)
    playTurnEnd()
    emitSafe('game:endTurn')
  }, [emitSafe])

  const handleBuildHouse = useCallback((cellIndex) => { playBuild(); emitSafe('game:buildHouse', { cellIndex }) }, [emitSafe])
  const handleBuildHotel = useCallback((cellIndex) => { playBuild(); emitSafe('game:buildHotel', { cellIndex }) }, [emitSafe])
  const handleSellHouse = useCallback((cellIndex) => { playMoneyGain(); emitSafe('game:sellHouse', { cellIndex }) }, [emitSafe])
  const handleMortgage = useCallback((cellIndex) => { playMoneyGain(); emitSafe('game:mortgage', { cellIndex }) }, [emitSafe])
  const handleUnmortgage = useCallback((cellIndex) => { playMoneyLoss(); emitSafe('game:unmortgage', { cellIndex }) }, [emitSafe])
  const handlePayJail = useCallback(() => { playMoneyLoss(); emitSafe('game:payJail') }, [emitSafe])
  const handleUseJailCard = useCallback(() => { playJailRelease(); emitSafe('game:useJailCard') }, [emitSafe])
  const handleSendMessage = useCallback((msg) => { if (!msg?.trim()) return; emitSafe('chat:send', { message: msg }) }, [emitSafe])

  const handleTradeOffer = useCallback((offer) => {
    playTradeOffer()
    emitSafe('trade:offer', offer, (res) => { if (!res?.error) setShowTrade(null) })
  }, [emitSafe])
  const handleTradeAccept = useCallback((tradeId) => { emitSafe('trade:accept', { tradeId }); setIncomingTrades((p) => p.filter((t) => t.id !== tradeId)) }, [emitSafe])
  const handleTradeDecline = useCallback((tradeId) => { emitSafe('trade:decline', { tradeId }); setIncomingTrades((p) => p.filter((t) => t.id !== tradeId)) }, [emitSafe])
  const handlePlayerClick = useCallback((playerId) => { if (playerId !== user?.id) setShowTrade({ targetId: playerId }) }, [user?.id])
  const handleCellClick = useCallback((cellIndex) => setSelectedCell((p) => p === cellIndex ? null : cellIndex), [])

  if (!gameState) {
    return <div className="h-screen flex items-center justify-center bg-surface-0"><p className="text-text-muted text-sm">Loading...</p></div>
  }

  const selectedCellData = selectedCell != null ? BOARD[selectedCell] : null
  // server stores diceResult as [d1, d2]; lastDice from ack is { d1, d2 }
  const dicePair = lastDice
    ? [lastDice.d1, lastDice.d2]
    : Array.isArray(gameState?.diceResult)
      ? gameState.diceResult
      : gameState?.diceResult
        ? [gameState.diceResult.d1, gameState.diceResult.d2]
        : null
  const selectedCellPropData = gameState?.properties?.[selectedCell]
  const selectedCellOwner = selectedCellPropData?.ownerId || null
  const selectedCellOwnerPlayer = selectedCellOwner ? gameState?.players?.find((p) => p.userId === selectedCellOwner) : null
  const isMySelectedProperty = selectedCellOwner === user?.id

  const getActionContent = () => {
    if (isGameOver) return null
    if (!isMyTurn) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: currentTurnPlayer?.color || '#fff' }} />
            <span className="text-xs" style={{ color: '#A0A0A0' }}>
            <span className="text-text font-medium">{currentTurnPlayer?.username}</span>'s turn
          </span>
        </div>
      )
    }
    if (currentPlayer?.inJail) {
      return (
              <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#707070' }}>In jail!</span>
          {currentPlayer.getOutOfJailCards > 0 && (
                <button onClick={handleUseJailCard} className="text-[10px] px-3 py-1.5 rounded-xl" style={{ color: '#BF5AF2', border: '1px solid rgba(191,90,242,0.2)' }}>Card</button>
          )}
              <button onClick={handlePayJail} className="text-[10px] px-3 py-1.5 rounded-xl" style={{ color: '#A0A0A0', border: '1px solid rgba(187,243,81,0.1)' }}>Pay $50</button>
          {gameState.phase === 'jail_roll' && <Dice onRoll={handleRollDice} disabled={rolling} dice={dicePair} rolling={rolling} isMyTurn={isMyTurn} />}
        </div>
      )
    }
    if (gameState.phase === 'roll') {
      return <Dice onRoll={handleRollDice} disabled={rolling} dice={dicePair} rolling={rolling} isMyTurn={isMyTurn} />
    }
    if (gameState.phase === 'action') {
      const cellIndex = gameState.pendingCellIndex ?? currentPlayer?.position
      const landedCell = cellIndex != null ? BOARD[cellIndex] : null
      if (gameState.pendingAction === 'buy_offer') {
        return (
          <div className="flex items-center gap-2">
            <span className="text-[11px] mr-1" style={{ color: '#A0A0A0' }}>{landedCell?.name} — ${landedCell?.price}</span>
            <button onClick={() => handleBuy(gameState.pendingCellIndex)} className="btn-primary text-[11px] !py-1.5 !px-4">Buy ${landedCell?.price}</button>
            <button onClick={handleDeclineBuy} className="text-[11px] px-3 py-1.5 rounded-xl text-text-muted border border-neon-400/10 hover:bg-surface-2/50">Skip</button>
          </div>
        )
      }
            return <button onClick={handleEndTurn} className="text-[11px] px-4 py-1.5 rounded-xl text-text-muted border border-neon-400/10 hover:bg-surface-2/50">End Turn</button>
    }
    return null
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (chatInput.trim()) { handleSendMessage(chatInput); setChatInput('') }
  }

  const logMessages = chatMessages.filter((m) => m.type)

  const centerContent = (
    <div className="flex flex-col h-full min-h-0 rounded-lg overflow-hidden" style={{ background: 'rgba(9,9,9,0.94)', border: '1px solid rgba(187,243,81,0.1)' }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0" style={{ borderColor: 'rgba(187,243,81,0.1)' }}>
        <span className="text-[10px] font-bold tracking-[0.18em]" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
          <span className="text-text">xAURA</span> <span className="text-neon-400">MONOPOLY</span>
        </span>
        {lastDice && (
          <span className="text-[11px] font-mono" style={{ color: '#A0A0A0' }}>
            🎲 {lastDice.d1 || 0} + {lastDice.d2 || 0} = <span className="text-neon-400 font-bold">{(lastDice.d1 || 0) + (lastDice.d2 || 0)}</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(187,243,81,0.15) transparent' }}>
        {chatMessages.length === 0 && (
          <p className="text-[10px] text-center mt-6" style={{ color: '#4A4A4A' }}>Чат и игровые события появятся здесь</p>
        )}
        {chatMessages.map((msg, i) => {
          const player = gameState.players?.find((p) => p.userId === msg.userId)
          const isEvent = !!msg.type
          if (isEvent) {
            return (
              <div key={i} className="text-[10px] leading-relaxed italic" style={{ color: '#7A7A7A' }}>
                {msg.text || msg.message}
              </div>
            )
          }
          return (
            <div key={i} className="text-[11px] leading-relaxed" style={{ color: '#C8C8C8' }}>
              <span className="font-semibold" style={{ color: player?.color || '#BBF351' }}>{msg.username || msg.senderName || '???'}:</span>{' '}
              {msg.text || msg.message}
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleChatSubmit} className="flex gap-1.5 p-2 border-t flex-shrink-0" style={{ borderColor: 'rgba(187,243,81,0.1)' }}>
        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Сообщение..." maxLength={200} className="input flex-1 !py-1.5 !text-[11px]" />
        <button type="submit" className="btn-primary !py-1.5 !px-3 text-[12px]">➤</button>
      </form>
    </div>
  )

  return (
    <div className="h-screen flex overflow-hidden bg-surface-0">
      {/* Left: Players */}
      <div className="w-52 flex-shrink-0 p-3 hidden md:flex flex-col border-r border-neon-400/10">
        <div className="px-1 mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A0A0A0', fontFamily: 'Quantico, Inter, sans-serif' }}>
            Players {gameState.players?.filter((p) => !p.isBankrupt).length}/{gameState.players?.length}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(187,243,81,0.2) transparent' }}>
          <PlayerPanel players={gameState.players || []} currentPlayerId={user?.id} currentPlayerIndex={gameState.currentPlayerIndex} onPlayerClick={handlePlayerClick} />
        </div>
      </div>

      {/* Center: Board */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex items-center justify-between px-4 py-2 border-b border-neon-400/10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/monopoly')} className="text-[11px] text-text-muted hover:text-text transition-colors">&larr; Lobby</button>
              <h1 className="text-xs font-bold" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
              <span className="text-text">xAura</span><span className="text-neon-400 ml-1">Monopoly</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full border"
              style={{
                color: connected ? '#00CC88' : '#FF6688',
                borderColor: connected ? 'rgba(0,204,136,0.25)' : 'rgba(255,51,102,0.3)',
                background: connected ? 'rgba(0,204,136,0.06)' : 'rgba(255,51,102,0.08)',
              }}
              title={connected ? 'Соединение с сервером активно' : 'Переподключение к серверу...'}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: connected ? '#00CC88' : '#FF6688' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              {connected ? 'online' : 'reconnecting'}
            </span>
            <button
              onClick={() => setMuted(toggleMute())}
              className="text-sm w-7 h-7 rounded-lg flex items-center justify-center transition-colors border"
              style={{ borderColor: 'rgba(187,243,81,0.15)', opacity: muted ? 0.5 : 1 }}
              title={muted ? 'Включить звук' : 'Выключить звук'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            {isMyTurn && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(187,243,81,0.1)', color: '#BBF351', border: '1px solid rgba(187,243,81,0.2)' }}>
                YOUR TURN
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-2 min-h-0 relative overflow-hidden">
          <MonopolyBoard
            gameState={gameState}
            currentPlayerId={user?.id}
            onCellClick={handleCellClick}
            selectedCell={selectedCell}
            animatingPositions={animatingPositions}
            centerContent={centerContent}
          />

          {/* Center Event Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <AnimatePresence>
              {eventOverlay.slice(-3).map((evt, i) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 py-2 rounded-xl text-sm font-medium mb-1"
                  style={{
                    background: evt.type === 'card' ? 'rgba(191,90,242,0.15)' : evt.type === 'dice' ? 'rgba(187,243,81,0.12)' : 'rgba(10,10,10,0.8)',
                    border: `1px solid ${evt.type === 'card' ? 'rgba(191,90,242,0.3)' : evt.type === 'dice' ? 'rgba(187,243,81,0.25)' : 'rgba(187,243,81,0.1)'}`,
                    color: evt.type === 'card' ? '#BF5AF2' : evt.type === 'dice' ? '#BBF351' : '#F0F0F0',
                    transform: `translateY(${i * -40}px)`,
                  }}
                >
                  {evt.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Property card */}
        <AnimatePresence>
          {selectedCellData && selectedCell != null && (
            <motion.div className="fixed left-1/2 bottom-24 z-30 w-52 -translate-x-1/2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <PropertyCard cellIndex={selectedCell} propData={selectedCellPropData} owner={selectedCellOwnerPlayer} gameState={gameState} onBuild={handleBuildHouse} onSell={handleSellHouse} onMortgage={handleMortgage} isMyProperty={isMySelectedProperty} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incoming trades */}
        <AnimatePresence>
          {incomingTrades.length > 0 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 space-y-1 z-20">
              {incomingTrades.map((trade) => {
                const offerer = gameState.players?.find((p) => p.userId === trade.fromId)
                return (
                  <motion.div key={trade.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl px-4 py-2 flex items-center gap-3" style={{ background: 'rgba(191,90,242,0.12)', border: '1px solid rgba(191,90,242,0.25)' }}>
                    <span className="text-[11px] text-text">{offerer?.username || 'Player'} offers a trade</span>
                    <button onClick={() => handleTradeAccept(trade.id)} className="text-[11px] text-green-400 hover:text-green-300">Accept</button>
                    <button onClick={() => handleTradeDecline(trade.id)} className="text-[11px] text-red-400 hover:text-red-300">Decline</button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Actions + Chat */}
      <div className="w-72 flex-shrink-0 flex flex-col border-l border-neon-400/10">
        <div className="p-3 border-b border-neon-400/10">
          <div className="flex items-center gap-2 flex-wrap">
            {getActionContent()}
            {isMyTurn && gameState.phase === 'action' && selectedCell != null && isMySelectedProperty && !selectedCellPropData?.isMortgaged && (
              <>
                {selectedCellPropData?.houses < 4 && <button onClick={() => handleBuildHouse(selectedCell)} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: '#00CC88', border: '1px solid rgba(0,204,136,0.2)' }}>+House</button>}
                {selectedCellPropData?.houses === 4 && <button onClick={() => handleBuildHotel(selectedCell)} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: '#FF8A33', border: '1px solid rgba(255,138,51,0.2)' }}>+Hotel</button>}
                {selectedCellPropData?.houses > 0 && <button onClick={() => handleSellHouse(selectedCell)} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: '#FF6688', border: '1px solid rgba(255,102,136,0.2)' }}>Sell</button>}
                <button onClick={() => handleMortgage(selectedCell)} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: '#BF5AF2', border: '1px solid rgba(191,90,242,0.2)' }}>Mortgage</button>
              </>
            )}
            {isMyTurn && selectedCell != null && selectedCellPropData?.isMortgaged && isMySelectedProperty && (
              <button onClick={() => handleUnmortgage(selectedCell)} className="text-[10px] px-2 py-1 rounded-lg" style={{ color: '#00CC88', border: '1px solid rgba(0,204,136,0.2)' }}>Unmortgage</button>
            )}
          </div>
        </div>

        {/* Game log */}
        <div className="flex-1 min-h-0">
          <GameLog messages={logMessages} />
        </div>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {gameError && (
          <motion.div className="fixed top-20 left-1/2 z-[10000] px-5 py-3 rounded-xl text-xs font-medium" style={{ background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.3)', color: '#FF6688' }} initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}>
            {gameError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showCard && <CardModal card={showCard.card} type={showCard.type} onClose={() => setShowCard(null)} />}
        {showBankrupt && <BankruptModal player={showBankrupt.player} creditor={showBankrupt.creditor} onClose={() => setShowBankrupt(null)} />}
        {showTrade && <TradeModal myPlayer={currentPlayer} targetPlayer={gameState.players?.find((p) => p.userId === showTrade.targetId)} gameState={gameState} onOffer={handleTradeOffer} onClose={() => setShowTrade(null)} />}
        {gameState.phase === 'auction' && <AuctionModal gameState={gameState} currentPlayer={currentPlayer} onBid={(amount) => emitSafe('auction:bid', { amount })} onClose={() => {}} />}
        {isGameOver && <GameOverModal winner={gameState.players?.find((p) => p.userId === gameState.winner)} players={gameState.players || []} onClose={() => { localStorage.removeItem(ROOM_CODE_KEY); navigate('/monopoly') }} />}
      </AnimatePresence>
    </div>
  )
}
