import { motion } from 'framer-motion'

// Универсальная мем-карточка персонажа ауры (в духе AuraFarmerCard с лендинга).
// size: 'lg' — большая карточка (профиль, hero), 'md' — средняя, 'sm' — мини (лента «Путь ауры»)
export default function AuraCharacterCard({ char, size = 'lg', active = false, index = 0, className = '' }) {
  const dims =
    size === 'lg' ? 'w-[260px] sm:w-[300px]'
    : size === 'md' ? 'w-[190px]'
    : 'w-[140px] sm:w-[160px]'
  const ratio = size === 'sm' ? 'aspect-[3/4]' : 'aspect-[4/5]'
  const floating = size !== 'sm'

  return (
    <motion.div
      className={`relative flex-shrink-0 ${dims} ${className}`}
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      {floating && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
          className="relative h-full"
        >
          <CardInner char={char} size={size} ratio={ratio} active={active} floating={floating} />
        </motion.div>
      )}
      {!floating && <CardInner char={char} size={size} ratio={ratio} active={active} floating={floating} />}
    </motion.div>
  )
}

function CardInner({ char, size, ratio, active, floating }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-surface-1 transition-all duration-300 group ${
        active ? 'scale-[1.03]' : 'hover:scale-[1.02]'
      }`}
      style={{
        border: `1px solid ${char.accent}${active ? '99' : '44'}`,
        boxShadow: active
          ? `0 0 0 1px ${char.accent}55, 0 0 28px -6px ${char.accent}66`
          : `0 0 16px -8px ${char.accent}44`,
      }}
    >
      <div className={`relative w-full ${ratio} overflow-hidden bg-surface-2`}>
        <picture>
          <source srcSet={char.webp} type="image/webp" />
          <img
            src={char.gif}
            alt={`${char.name} — ${char.anime}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

        {active && (
          <span
            className="absolute top-2 left-2 px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-widest"
            style={{ background: `${char.accent}22`, color: char.accent, border: `1px solid ${char.accent}66` }}
          >
            ты здесь
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <span className="block font-mono text-[8px] uppercase tracking-widest" style={{ color: `${char.accent}cc` }}>
            {char.anime}
          </span>
          <span className={`block font-display font-bold text-white truncate ${size === 'sm' ? 'text-[11px]' : 'text-sm'}`}>
            {char.name}
          </span>
        </div>
      </div>

      {size !== 'sm' && (
        <div className="px-2.5 py-2">
          <p className={`text-text-muted italic leading-snug ${size === 'md' ? 'text-[9px]' : 'text-[10px]'}`}>
            «{char.quote}»
          </p>
        </div>
      )}

      {floating && (
        <motion.span
          className="absolute -top-2.5 -right-2.5 px-2 py-1 rounded-lg font-mono text-[9px] font-bold whitespace-nowrap z-10 bg-surface-1/95 backdrop-blur-md"
          style={{ color: char.accent, border: `1px solid ${char.accent}55` }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {char.chips[0]}
        </motion.span>
      )}
    </div>
  )
}
