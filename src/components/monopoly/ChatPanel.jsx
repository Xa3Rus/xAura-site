import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPanel({ messages, players, currentUserId, onSend, onTyping, typingUsers }) {
  const [input, setInput] = useState('')
  const [chatMode, setChatMode] = useState('public')
  const [pmTarget, setPmTarget] = useState(null)
  const [showPmMenu, setShowPmMenu] = useState(false)
  const endRef = useRef(null)
  const typingRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const filtered = messages.filter((msg) => {
    if (chatMode === 'public') return msg.type === 'public' || msg.type === 'system'
    return msg.type === 'private' && (msg.senderId === currentUserId || msg.toId === currentUserId)
  })

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input, chatMode === 'private' ? pmTarget : null)
    setInput('')
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    if (typingRef.current) clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => onTyping(chatMode === 'private' ? pmTarget : null), 500)
  }

  const getPmName = (id) => players?.find((p) => p.userId === id)?.name || 'Unknown'

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden" style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(187,243,81,0.1)' }}>
      <div className="px-3 py-2 flex items-center gap-1.5 border-b" style={{ borderColor: 'rgba(187,243,81,0.1)' }}>
        <button onClick={() => { setChatMode('public'); setPmTarget(null) }} className={`text-[10px] px-2 py-1 rounded transition-all ${chatMode === 'public' ? 'text-neon-400 bg-neon-400/10' : 'text-text-muted hover:text-text-muted'}`}>Общий</button>
        <button onClick={() => { setChatMode('private'); setShowPmMenu(!showPmMenu) }} className={`text-[10px] px-2 py-1 rounded transition-all ${chatMode === 'private' ? 'text-purple-400 bg-purple-500/10' : 'text-text-muted hover:text-text-muted'}`}>ЛС</button>
        {pmTarget && <span className="text-[9px] text-purple-400/60 ml-auto">→ {getPmName(pmTarget)} <button onClick={() => setPmTarget(null)} className="ml-1">×</button></span>}

        <AnimatePresence>
          {showPmMenu && chatMode === 'private' && !pmTarget && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-full left-0 mt-1 rounded-xl z-50 w-40" style={{ background: '#0A0A0A', border: '1px solid rgba(187,243,81,0.1)' }}>
              {players?.filter((p) => p.userId !== currentUserId && !p.isBankrupt).map((p) => (
                <button key={p.userId} onClick={() => { setPmTarget(p.userId); setShowPmMenu(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-2 text-left">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-[10px] text-text">{p.username}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5 min-h-0">
        {filtered.length === 0 && <div className="flex items-center justify-center h-full"><p className="text-[9px]" style={{ color: '#2A2A2A' }}>Нет сообщений</p></div>}
        {filtered.map((msg) => {
          const isMine = msg.senderId === currentUserId
          const isSystem = msg.type === 'system'
          return (
            <div key={msg.id} className={isSystem ? 'text-center' : `flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {isSystem ? (
                <span className="text-[9px] italic" style={{ color: '#707070' }}>{msg.message}</span>
              ) : (
                <>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] font-medium" style={{ color: players?.find((p) => p.userId === msg.senderId)?.color || '#707070' }}>{msg.senderName}</span>
                    {msg.type === 'private' && <span className="text-[7px] text-purple-400/50">🔒</span>}
                    <span className="text-[7px]" style={{ color: '#2A2A2A' }}>{new Date(msg.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg max-w-[85%] text-[11px]" style={{
                    background: isMine ? 'rgba(187,243,81,0.08)' : msg.type === 'private' ? 'rgba(191,90,242,0.08)' : 'rgba(10,10,10,0.6)',
                    border: `1px solid ${isMine ? 'rgba(187,243,81,0.12)' : msg.type === 'private' ? 'rgba(191,90,242,0.12)' : 'rgba(187,243,81,0.1)'}`,
                    color: '#F0F0F0',
                  }}>{msg.message}</div>
                </>
              )}
            </div>
          )
        })}
        {typingUsers?.length > 0 && <div className="text-[9px] px-2" style={{ color: '#707070' }}>{typingUsers.map((u) => u.username).join(', ')} печатает...</div>}
        <div ref={endRef} />
      </div>

      <div className="px-2 py-1.5 border-t" style={{ borderColor: 'rgba(187,243,81,0.1)' }}>
        <div className="flex gap-1.5">
          <input value={input} onChange={handleInput} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="..." className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none" style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(187,243,81,0.1)', color: '#F0F0F0' }} />
          <button onClick={handleSend} disabled={!input.trim()} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-30" style={{ background: 'rgba(187,243,81,0.15)', color: '#BBF351', border: '1px solid rgba(187,243,81,0.2)' }}>→</button>
        </div>
      </div>
    </div>
  )
}
