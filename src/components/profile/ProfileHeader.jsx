import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuraTitleBadge } from '../AuraBadge'
import AuraCharacterCard from '../AuraCharacterCard'
import { getAuraCharacter } from '../../data/auraCharacters'

// Hero-шапка профиля: градиент уровня ауры, аватар, XP-бар, персонаж уровня, шеринг
export default function ProfileHeader({ username, email, aura, isOwner = false, shareUrl }) {
  const [copied, setCopied] = useState(false)
  const char = getAuraCharacter(aura.level)

  const onShare = async () => {
    const url = shareUrl || window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${username} — xAura`, url })
        return
      }
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-surface-4 mb-8">
      {/* Градиентный фон уровня ауры */}
      <div className={`absolute inset-0 bg-gradient-to-br ${aura.gradient} opacity-[0.14]`} />
      <div className="absolute inset-0 neon-grid opacity-60" />
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[110px]" style={{ background: `${char.accent}1f` }} />
      <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-neon-400/[0.06] rounded-full blur-[100px]" />

      <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12 px-6 sm:px-10 py-8 sm:py-10">
        {/* Левая часть: аватар + инфо */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1 min-w-0">
          {/* Аватар с пульсирующим кольцом уровня */}
          <div className="relative flex-shrink-0">
            <motion.div
              className={`absolute -inset-2 rounded-2xl bg-gradient-to-br ${aura.gradient} opacity-60 blur-md`}
              animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand-softer border-2 border-neon-400/40 flex items-center justify-center overflow-hidden">
              <span className="font-display font-bold text-3xl sm:text-4xl text-neon-300">
                {username?.[0]?.toUpperCase()}
              </span>
            </div>
            <span
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-neon-400 text-black font-display font-bold text-sm flex items-center justify-center shadow-[0_0_16px_rgba(187,243,81,0.6)]"
              title={aura.title}
            >
              {aura.level}
            </span>
          </div>

          <div className="text-center sm:text-left min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white truncate">{username}</h1>
              <AuraTitleBadge aura={aura} />
            </div>
            {isOwner && email && (
              <p className="text-xs text-text-muted mb-3 truncate">{email}</p>
            )}

            {/* XP-бар */}
            <div className="mt-3 max-w-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
                  AURA · {aura.xp} XP
                </span>
                <span className="font-mono text-[9px] font-bold" style={{ color: char.accent }}>
                  LVL {aura.level} · {aura.title}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-3 overflow-hidden border border-surface-4">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${aura.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${aura.progress}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] text-text-subtle font-mono">
                  {aura.next ? `до уровня ${aura.level + 1}: ${aura.next} XP` : 'максимальный уровень'}
                </span>
                <button
                  onClick={onShare}
                  className="font-mono text-[9px] font-bold text-neon-400 hover:text-neon-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  {copied ? '✓ скопировано' : '⇄ поделиться'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Персонаж текущего уровня ауры */}
        <div className="hidden sm:block flex-shrink-0">
          <AuraCharacterCard char={char} size="md" index={0} />
        </div>
      </div>
    </div>
  )
}
