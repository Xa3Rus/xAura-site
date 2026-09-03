// Бейдж уровня ауры — общий для профиля, публичного профиля и таблицы лидеров
export function AuraTitleBadge({ aura, className = '' }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-display uppercase tracking-wider bg-neon-400/10 text-neon-400 border border-neon-400/20 ${className}`}
    >
      {aura.title}
    </span>
  )
}

export function AuraLevelChip({ level, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold bg-surface-2/80 border border-neon-400/20 text-neon-400 ${className}`}
      title="Уровень ауры растёт за оценки, тир-листы и битвы"
    >
      <span className="text-neon-400">⚡</span> {level}
    </span>
  )
}
