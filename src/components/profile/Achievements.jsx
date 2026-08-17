import { motion } from 'framer-motion'

// Достижения профиля: вычисляются из активности пользователя.
// rarity: common / rare / epic — влияет на цвет метки. goal+value дают прогресс.
// stats: { ratings, tierLists, battles, avgScore, bestScore, animeCount, level }
const DEFS = [
  { id: 'first-rating', icon: '★', name: 'Первая оценка', desc: 'Оценил первый тайтл', rarity: 'common', check: (s) => s.ratings >= 1, value: (s) => s.ratings, goal: 1 },
  { id: 'ten-ratings', icon: '✦', name: 'Разогрев', desc: '10 оценок', rarity: 'common', check: (s) => s.ratings >= 10, value: (s) => s.ratings, goal: 10 },
  { id: 'marathon', icon: '⚔', name: 'Марафонец', desc: '50+ оценок', rarity: 'rare', check: (s) => s.ratings >= 50, value: (s) => s.ratings, goal: 50 },
  { id: 'hundred', icon: '∞', name: 'Оценщик-бог', desc: '100+ оценок', rarity: 'epic', check: (s) => s.ratings >= 100, value: (s) => s.ratings, goal: 100 },
  { id: 'first-tier', icon: '▦', name: 'Тир-мастер', desc: 'Первый тир-лист', rarity: 'common', check: (s) => s.tierLists >= 1, value: (s) => s.tierLists, goal: 1 },
  { id: 'tier-five', icon: '▩', name: 'Архитектор вкуса', desc: '5 тир-листов', rarity: 'rare', check: (s) => s.tierLists >= 5, value: (s) => s.tierLists, goal: 5 },
  { id: 'first-battle', icon: '◈', name: 'Битва начинается', desc: 'Первая битва', rarity: 'common', check: (s) => s.battles >= 1, value: (s) => s.battles, goal: 1 },
  { id: 'battle-ten', icon: '◉', name: 'Ветеран арены', desc: '10 битв', rarity: 'rare', check: (s) => s.battles >= 10, value: (s) => s.battles, goal: 10 },
  { id: 'sniper', icon: '◎', name: 'Снайпер', desc: 'Средний балл ≥ 8', rarity: 'epic', check: (s) => s.ratings >= 5 && s.avgScore >= 8, value: (s) => (s.ratings >= 5 ? s.avgScore : 0), goal: 8 },
  { id: 'hater', icon: '☟', name: 'Строгий критик', desc: 'Средний балл < 5.5', rarity: 'rare', check: (s) => s.ratings >= 5 && s.avgScore > 0 && s.avgScore < 5.5, value: () => 1, goal: 1 },
  { id: 'high-score', icon: '↑', name: 'Охотник за рекордом', desc: '20+ очков в битве', rarity: 'rare', check: (s) => s.bestScore >= 20, value: (s) => s.bestScore, goal: 20 },
  { id: 'aura-l5', icon: '⚡', name: 'Аура пробуждается', desc: '5 уровень ауры', rarity: 'common', check: (s) => s.level >= 5, value: (s) => s.level, goal: 5 },
  { id: 'aura-l10', icon: '⚡', name: 'Эксперт ауры', desc: '10 уровень ауры', rarity: 'epic', check: (s) => s.level >= 10, value: (s) => s.level, goal: 10 },
  { id: 'aura-l15', icon: '♛', name: 'Бог аниме', desc: '15 уровень ауры', rarity: 'epic', check: (s) => s.level >= 15, value: (s) => s.level, goal: 15 },
]

const RARITY = {
  common: { label: 'частое', color: '#A0A0A0' },
  rare: { label: 'редкое', color: '#00E5FF' },
  epic: { label: 'эпик', color: '#BF5AF2' },
}

export default function Achievements({ stats, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 ${className}`}>
      {DEFS.map((def, i) => {
        const unlocked = def.check(stats)
        const rarity = RARITY[def.rarity]
        const cur = Math.min(def.value(stats), def.goal)
        const pct = def.goal > 0 ? Math.round((cur / def.goal) * 100) : 0
        return (
          <motion.div
            key={def.id}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03, duration: 0.35 }}
            title={`${def.name} — ${def.desc}`}
            className={`relative flex items-center gap-2.5 px-2 py-1.5 border transition-colors duration-300 ${
              unlocked
                ? 'border-brand-medium bg-[#0C1007]'
                : 'border-surface-3 bg-[#070905] hatch opacity-70 hover:opacity-90'
            }`}
          >
            {/* Плитка иконки */}
            <span
              className={`flex-shrink-0 w-7 h-7 flex items-center justify-center text-[13px] font-bold border ${
                unlocked ? 'text-neon-400 border-neon-400/40 bg-neon-400/10' : 'text-text-subtle border-surface-4'
              }`}
            >
              {unlocked ? def.icon : '·'}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-bold leading-tight truncate ${unlocked ? 'text-text-secondary' : 'text-text-muted'}`}>
                  {def.name}
                </span>
                <span className="flex-shrink-0 font-mono text-[7px] uppercase tracking-[0.14em]" style={{ color: unlocked ? rarity.color : '#525252' }}>
                  {unlocked ? rarity.label : `${pct}%`}
                </span>
              </div>
              {/* Прогресс к закрытым / редкость у открытых */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-[3px] bg-surface-3 overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ background: unlocked ? '#BBF351' : 'rgba(187,243,81,0.4)' }}
                    initial={{ width: 0 }}
                    whileInView={{ width: unlocked ? '100%' : `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 + i * 0.03 }}
                  />
                </div>
                <span className="font-mono text-[7px] text-text-subtle flex-shrink-0">
                  {unlocked ? '✓' : `${cur}/${def.goal}`}
                </span>
              </div>
            </div>

            {unlocked && <span className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-neon-400/50" />}
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
