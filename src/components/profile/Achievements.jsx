import { motion } from 'framer-motion'

// Достижения профиля: вычисляются из активности пользователя.
// stats: { ratings, tierLists, battles, avgScore, bestScore, animeCount }
const DEFS = [
  { id: 'first-rating', icon: '★', name: 'Первая оценка', desc: 'Оценил первый тайтл', check: (s) => s.ratings >= 1 },
  { id: 'ten-ratings', icon: '✦', name: 'Разогрев', desc: '10 оценок', check: (s) => s.ratings >= 10 },
  { id: 'marathon', icon: '⚔', name: 'Марафонец', desc: '50+ оценок', check: (s) => s.ratings >= 50 },
  { id: 'hundred', icon: '∞', name: 'Оценщик-бог', desc: '100+ оценок', check: (s) => s.ratings >= 100 },
  { id: 'first-tier', icon: '▦', name: 'Тир-мастер', desc: 'Первый тир-лист', check: (s) => s.tierLists >= 1 },
  { id: 'tier-five', icon: '▩', name: 'Архитектор вкуса', desc: '5 тир-листов', check: (s) => s.tierLists >= 5 },
  { id: 'first-battle', icon: '◈', name: 'Битва начинается', desc: 'Первая битва', check: (s) => s.battles >= 1 },
  { id: 'battle-ten', icon: '◉', name: 'Ветеран арены', desc: '10 битв', check: (s) => s.battles >= 10 },
  { id: 'sniper', icon: '◎', name: 'Снайпер', desc: 'Средний балл ≥ 8', check: (s) => s.ratings >= 5 && s.avgScore >= 8 },
  { id: 'hater', icon: '☟', name: 'Строгий критик', desc: 'Средний балл < 5.5', check: (s) => s.ratings >= 5 && s.avgScore > 0 && s.avgScore < 5.5 },
  { id: 'high-score', icon: '↑', name: 'Охотник за рекордом', desc: '20+ очков в битве', check: (s) => s.bestScore >= 20 },
  { id: 'aura-l5', icon: '⚡', name: 'Аура пробуждается', desc: '5 уровень ауры', check: (s) => s.level >= 5 },
  { id: 'aura-l10', icon: '⚡', name: 'Эксперт ауры', desc: '10 уровень ауры', check: (s) => s.level >= 10 },
  { id: 'aura-l15', icon: '♛', name: 'Бог аниме', desc: '15 уровень ауры', check: (s) => s.level >= 15 },
]

export default function Achievements({ stats, className = '' }) {
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2 ${className}`}>
      {DEFS.map((def, i) => {
        const unlocked = def.check(stats)
        return (
          <motion.div
            key={def.id}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
            title={`${def.name} — ${def.desc}`}
            className={`relative rounded-lg border p-2.5 text-center transition-all duration-300 ${
              unlocked
                ? 'border-neon-400/40 bg-neon-400/[0.07] shadow-[0_0_14px_-6px_rgba(187,243,81,0.4)]'
                : 'border-surface-4 bg-surface-1/60 opacity-40'
            }`}
          >
            <span className={`block text-lg mb-1 ${unlocked ? 'text-neon-400' : 'text-text-subtle'}`}>
              {unlocked ? def.icon : '?'}
            </span>
            <span className={`block text-[9px] font-bold leading-tight ${unlocked ? 'text-text-secondary' : 'text-text-subtle'}`}>
              {def.name}
            </span>
            {unlocked && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-neon-400 shadow-[0_0_6px_rgba(187,243,81,0.8)]" />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export function achievementsProgress(stats) {
  const unlocked = DEFS.filter((d) => d.check(stats)).length
  return { unlocked, total: DEFS.length }
}
