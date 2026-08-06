import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPanel({ messages, players, currentUserId, onSend, onTyping, typingUsers }) {
  const [input, setInput] = useState('')
  const [chatMode, setChatMode] = useState('public')
  const [pmTarget, setPmTarget] = useState(null)
  const [showPmMenu, setShowPmMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filteredMessages = messages.filter((msg) => {
    if (chatMode === 'public') return msg.type === 'public'
    return (msg.type === 'private' && (msg.senderId === currentUserId || msg.toId === currentUserId))
  })

  const handleSend = () => {
    if (!input.trim()) return
    if (chatMode === 'private' && pmTarget) {
      onSend(input, pmTarget)
    } else {
      onSend(input)
    }
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(chatMode === 'private' ? pmTarget : null)
    }, 500)
  }

  const getPmName = (userId) => players.find((p) => p.id === userId)?.name || 'Unknown'

  const otherPlayers = players.filter((p) => p.id !== currentUserId && !p.isBankrupt)

  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <button
          onClick={() => { setChatMode('public'); setPmTarget(null) }}
          className={`text-xs px-3 py-1 rounded-lg transition-all ${chatMode === 'public' ? 'text-amber-400 bg-amber-500/10' : 'text-white/25 hover:text-white/40'}`}
        >
          Общий
        </button>
        <button
          onClick={() => { setChatMode('private'); setShowPmMenu(!showPmMenu) }}
          className={`text-xs px-3 py-1 rounded-lg transition-all relative ${chatMode === 'private' ? 'text-purple-400 bg-purple-500/10' : 'text-white/25 hover:text-white/40'}`}
        >
          Личные {pmTarget && <span className="text-purple-400 ml-0.5">•</span>}
        </button>

        <AnimatePresence>
          {showPmMenu && chatMode === 'private' && !pmTarget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-50 w-48"
              style={{ background: 'rgba(17,17,20,0.97)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 16px 48px -12px rgba(0,0,0,0.7)' }}
            >
              {otherPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPmTarget(p.id); setShowPmMenu(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs text-white/60">{p.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {pmTarget && (
          <span className="text-[10px] text-purple-400/60 ml-auto">
            → {getPmName(pmTarget)}
            <button onClick={() => setPmTarget(null)} className="ml-1 text-white/20 hover:text-white/40">×</button>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {filteredMessages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.1)' }}>
              {chatMode === 'public' ? 'Пока нет сообщений' : 'Нет личных сообщений'}
            </p>
          </div>
        )}
        {filteredMessages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          const sender = players.find((p) => p.id === msg.senderId)
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: sender?.color || '#666' }} />
                <span className="text-[10px] font-medium" style={{ color: sender?.color || 'rgba(255,255,255,0.3)' }}>
                  {msg.senderName}
                </span>
                {msg.type === 'private' && (
                  <span className="text-[8px] text-purple-400/50">ЛС</span>
                )}
                <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.1)' }}>
                  {new Date(msg.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div
                className="px-3 py-1.5 rounded-xl max-w-[85%] text-xs leading-relaxed"
                style={{
                  background: isMine
                    ? 'rgba(251,191,36,0.08)'
                    : msg.type === 'private'
                      ? 'rgba(168,85,247,0.08)'
                      : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isMine ? 'rgba(251,191,36,0.12)' : msg.type === 'private' ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)'}`,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {msg.message}
              </div>
            </div>
          )
        })}
        {typingUsers.length > 0 && (
          <div className="text-[10px] px-2" style={{ color: 'rgba(255,255,255,0.15)' }}>
            {typingUsers.map((u) => u.username).join(', ')} печатает...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={chatMode === 'private' && pmTarget ? `ЛС ${getPmName(pmTarget)}...` : 'Сообщение...'}
            className="flex-1 text-xs px-3 py-2 rounded-xl focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
