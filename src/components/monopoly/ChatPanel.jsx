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
    <div className="h-full flex flex-col rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="px-3 py-2 flex items-center gap-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <button onClick={() => { setChatMode('public'); setPmTarget(null) }} className={`text-[10px] px-2 py-1 rounded transition-all ${chatMode === 'public' ? 'text-amber-400 bg-amber-500/10' : 'text-white/25 hover:text-white/40'}`}>Общий</button>
        <button onClick={() => { setChatMode('private'); setShowPmMenu(!showPmMenu) }} className={`text-[10px] px-2 py-1 rounded transition-all ${chatMode === 'private' ? 'text-purple-400 bg-purple-500/10' : 'text-white/25 hover:text-white/40'}`}>ЛС</button>
        {pmTarget && <span className="text-[9px] text-purple-400/60 ml-auto">→ {getPmName(pmTarget)} <button onClick={() => setPmTarget(null)} className="ml-1">×</button></span>}

        <AnimatePresence>
          {showPmMenu && chatMode === 'private' && !pmTarget && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-full left-0 mt-1 rounded-xl z-50 w-40" style={{ background: 'rgba(17,17,20,0.97)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {players?.filter((p) => p.userId !== currentUserId && !p.isBankrupt).map((p) => (
                <button key={p.userId} onClick={() => { setPmTarget(p.userId); setShowPmMenu(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] text-left">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-[10px] text-white/60">{p.username}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5 min-h-0">
        {filtered.length === 0 && <div className="flex items-center justify-center h-full"><p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.1)' }}>Нет сообщений</p></div>}
        {filtered.map((msg) => {
          const isMine = msg.senderId === currentUserId
          const isSystem = msg.type === 'system'
          return (
            <div key={msg.id} className={isSystem ? 'text-center' : `flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {isSystem ? (
                <span className="text-[9px] italic" style={{ color: 'rgba(255,255,255,0.15)' }}>{msg.message}</span>
              ) : (
                <>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] font-medium" style={{ color: players?.find((p) => p.userId === msg.senderId)?.color || 'rgba(255,255,255,0.3)' }}>{msg.senderName}</span>
                    {msg.type === 'private' && <span className="text-[7px] text-purple-400/50">🔒</span>}
                    <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.08)' }}>{new Date(msg.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg max-w-[85%] text-[11px]" style={{
                    background: isMine ? 'rgba(251,191,36,0.08)' : msg.type === 'private' ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isMine ? 'rgba(251,191,36,0.12)' : msg.type === 'private' ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)'}`,
                    color: 'rgba(255,255,255,0.6)',
                  }}>{msg.message}</div>
                </>
              )}
            </div>
          )
        })}
        {typingUsers?.length > 0 && <div className="text-[9px] px-2" style={{ color: 'rgba(255,255,255,0.15)' }}>{typingUsers.map((u) => u.username).join(', ')} печатает...</div>}
        <div ref={endRef} />
      </div>

      <div className="px-2 py-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex gap-1.5">
          <input value={input} onChange={handleInput} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="..." className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }} />
          <button onClick={handleSend} disabled={!input.trim()} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-30" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>→</button>
        </div>
      </div>
    </div>
  )
}
