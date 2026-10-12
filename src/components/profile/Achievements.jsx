import { motion } from 'framer-motion'

// Единый каталог достижений. Все условия вычисляются из уже доступной статистики.
const n = (value) => Number(value || 0)

export const ACHIEVEMENT_DEFS = [
  { id: 'first-rating', icon: '★', category: 'critic', name: 'Первая оценка', desc: 'Оцени первый тайтл', rarity: 'common', check: (s) => n(s.ratings) >= 1, value: (s) => s.ratings, goal: 1 },
  { id: 'ten-ratings', icon: '✦', category: 'critic', name: 'Разогрев', desc: 'Собери 10 оценок', rarity: 'common', check: (s) => n(s.ratings) >= 10, value: (s) => s.ratings, goal: 10 },
  { id: 'marathon', icon: '⚔', category: 'critic', name: 'Марафонец', desc: 'Собери 50 оценок', rarity: 'rare', check: (s) => n(s.ratings) >= 50, value: (s) => s.ratings, goal: 50 },
  { id: 'hundred', icon: '∞', category: 'critic', name: 'Оценщик-бог', desc: 'Собери 100 оценок', rarity: 'epic', check: (s) => n(s.ratings) >= 100, value: (s) => s.ratings, goal: 100 },
  { id: 'two-fifty', icon: '◉', category: 'critic', name: 'Живая база', desc: 'Собери 250 оценок', rarity: 'legendary', check: (s) => n(s.ratings) >= 250, value: (s) => s.ratings, goal: 250 },
  { id: 'balanced-critic', icon: '≋', category: 'critic', name: 'Взвешенный взгляд', desc: 'Поставь 10 оценок', rarity: 'rare', check: (s) => n(s.ratings) >= 10, value: (s) => s.ratings, goal: 10 },
  { id: 'sniper', icon: '◎', category: 'critic', name: 'Снайпер', desc: 'Средний балл не ниже 8', rarity: 'epic', check: (s) => n(s.ratings) >= 5 && n(s.avgScore) >= 8, value: (s) => n(s.ratings) >= 5 ? n(s.avgScore) : 0, goal: 8 },
  { id: 'hater', icon: '☟', category: 'critic', name: 'Строгий критик', desc: 'Средний балл ниже 5.5', rarity: 'rare', check: (s) => n(s.ratings) >= 5 && n(s.avgScore) > 0 && n(s.avgScore) < 5.5, value: (s) => n(s.ratings) >= 5 && n(s.avgScore) > 0 && n(s.avgScore) < 5.5 ? 1 : 0, goal: 1 },
  { id: 'perfect-ten', icon: '◆', category: 'critic', name: 'Десять из десяти', desc: 'Поставь среднюю оценку 10', rarity: 'legendary', check: (s) => n(s.ratings) >= 1 && n(s.avgScore) >= 10, value: (s) => n(s.avgScore), goal: 10 },
  { id: 'first-tier', icon: '▦', category: 'architect', name: 'Тир-мастер', desc: 'Создай первый тир-лист', rarity: 'common', check: (s) => n(s.tierLists) >= 1, value: (s) => s.tierLists, goal: 1 },
  { id: 'tier-five', icon: '▩', category: 'architect', name: 'Архитектор вкуса', desc: 'Создай 5 тир-листов', rarity: 'rare', check: (s) => n(s.tierLists) >= 5, value: (s) => s.tierLists, goal: 5 },
  { id: 'tier-ten', icon: '⌘', category: 'architect', name: 'Куратор полки', desc: 'Создай 10 тир-листов', rarity: 'epic', check: (s) => n(s.tierLists) >= 10, value: (s) => s.tierLists, goal: 10 },
  { id: 'first-battle', icon: '◈', category: 'arena', name: 'Битва начинается', desc: 'Сыграй первую битву', rarity: 'common', check: (s) => n(s.battles) >= 1, value: (s) => s.battles, goal: 1 },
  { id: 'battle-ten', icon: '◉', category: 'arena', name: 'Ветеран арены', desc: 'Сыграй 10 битв', rarity: 'rare', check: (s) => n(s.battles) >= 10, value: (s) => s.battles, goal: 10 },
  { id: 'battle-fifty', icon: '⚡', category: 'arena', name: 'Постоянный боец', desc: 'Сыграй 50 битв', rarity: 'epic', check: (s) => n(s.battles) >= 50, value: (s) => s.battles, goal: 50 },
  { id: 'high-score', icon: '↑', category: 'arena', name: 'Охотник за рекордом', desc: 'Набери 20 очков в битве', rarity: 'rare', check: (s) => n(s.bestScore) >= 20, value: (s) => s.bestScore, goal: 20 },
  { id: 'score-hunter', icon: '↗', category: 'arena', name: 'На шаг впереди', desc: 'Набери 35 очков в битве', rarity: 'epic', check: (s) => n(s.bestScore) >= 35, value: (s) => s.bestScore, goal: 35 },
  { id: 'explorer-three', icon: '⌖', category: 'explorer', name: 'Разведчик', desc: 'Сделай 3 игровых захода', rarity: 'rare', check: (s) => n(s.modesPlayed) >= 3, value: (s) => s.modesPlayed, goal: 3 },
  { id: 'explorer-five', icon: '✧', category: 'explorer', name: 'Многогранный', desc: 'Попробуй 5 игровых режимов', rarity: 'epic', check: (s) => n(s.modesPlayed) >= 5, value: (s) => s.modesPlayed, goal: 5 },
  { id: 'genre-signal', icon: '⌁', category: 'explorer', name: 'Свой сигнал', desc: 'Оцени первый тайтл', rarity: 'common', check: (s) => n(s.animeCount) >= 1, value: (s) => s.animeCount, goal: 1 },
  { id: 'tier-and-battle', icon: '⟁', category: 'explorer', name: 'Тактик', desc: 'Создай тир-лист и сыграй битву', rarity: 'epic', check: (s) => n(s.tierLists) >= 1 && n(s.battles) >= 1, value: (s) => n(s.tierLists) >= 1 && n(s.battles) >= 1 ? 1 : 0, goal: 1 },
  { id: 'first-friend', icon: '⌁', category: 'social', name: 'Первый контакт', desc: 'Добавь первого друга', rarity: 'common', check: (s) => n(s.friends) >= 1, value: (s) => s.friends, goal: 1 },
  { id: 'crew-five', icon: '♧', category: 'social', name: 'Собери экипаж', desc: 'Собери 5 друзей', rarity: 'rare', check: (s) => n(s.friends) >= 5, value: (s) => s.friends, goal: 5 },
  { id: 'streak-three', icon: '◒', category: 'streak', name: 'На связи', desc: 'Пройди 3 челленджа', rarity: 'common', check: (s) => n(s.dailyCount) >= 3, value: (s) => s.dailyCount, goal: 3 },
  { id: 'streak-seven', icon: '◓', category: 'streak', name: 'Недельный ритм', desc: 'Пройди 7 челленджей', rarity: 'rare', check: (s) => n(s.dailyCount) >= 7, value: (s) => s.dailyCount, goal: 7 },
  { id: 'streak-thirty', icon: '◑', category: 'streak', name: 'Не сбавляя темп', desc: 'Пройди 30 челленджей', rarity: 'epic', check: (s) => n(s.dailyCount) >= 30, value: (s) => s.dailyCount, goal: 30 },
  { id: 'aura-l5', icon: '⚡', category: 'aura', name: 'Аура пробуждается', desc: 'Достигни 5 уровня Aura', rarity: 'common', check: (s) => n(s.level) >= 5, value: (s) => s.level, goal: 5 },
  { id: 'aura-l10', icon: '✹', category: 'aura', name: 'Эксперт ауры', desc: 'Достигни 10 уровня Aura', rarity: 'epic', check: (s) => n(s.level) >= 10, value: (s) => s.level, goal: 10 },
  { id: 'aura-l15', icon: '♛', category: 'aura', name: 'Бог аниме', desc: 'Достигни 15 уровня Aura', rarity: 'legendary', check: (s) => n(s.level) >= 15, value: (s) => s.level, goal: 15 },
]

export const RARITY = {
  common: { label: 'частое', color: '#A0A0A0' },
  rare: { label: 'редкое', color: '#00E5FF' },
  epic: { label: 'эпик', color: '#BF5AF2' },
  legendary: { label: 'легендарное', color: '#FFB340' },
}

export const CATEGORY_LABELS = {
  critic: 'Критик', architect: 'Архитектор', arena: 'Арена', explorer: 'Исследователь',
  social: 'Социальное', streak: 'Серии', aura: 'Aura',
}

export function getAchievementState(def, stats = {}) {
  const current = Math.max(0, n(def.value(stats)))
  const goal = n(def.goal)
  return { unlocked: Boolean(def.check(stats)), current, goal, percent: goal ? Math.min(100, Math.round((current / goal) * 100)) : 0 }
}

export default function Achievements({ stats = {}, className = '', compact = true, defs = ACHIEVEMENT_DEFS }) {
  return (
    <div className={`${compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-1.5' : 'grid grid-cols-1 md:grid-cols-2 gap-3'} ${className}`}>
      {defs.map((def, i) => {
        const state = getAchievementState(def, stats)
        const rarity = RARITY[def.rarity]
        return (
          <motion.div key={def.id} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.025, 0.35), duration: 0.35 }} className={`relative flex items-center gap-2.5 border transition-colors duration-300 ${compact ? 'px-2 py-1.5' : 'px-4 py-4'} ${state.unlocked ? 'border-brand-medium bg-[#0C1007]' : 'border-surface-3 bg-[#070905] hatch opacity-80 hover:opacity-100'}`}>
            <span className={`flex-shrink-0 flex items-center justify-center font-bold border ${compact ? 'w-7 h-7 text-[13px]' : 'w-12 h-12 text-xl'} ${state.unlocked ? 'text-neon-400 border-neon-400/40 bg-neon-400/10' : 'text-text-subtle border-surface-4'}`}>{state.unlocked ? def.icon : '⌁'}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`${compact ? 'text-[10px]' : 'text-sm'} font-bold leading-tight truncate ${state.unlocked ? 'text-text-secondary' : 'text-text-muted'}`}>{def.name}</span>
                <span className="flex-shrink-0 font-mono text-[8px] uppercase tracking-[0.12em]" style={{ color: state.unlocked ? rarity.color : '#525252' }}>{state.unlocked ? rarity.label : `${state.percent}%`}</span>
              </div>
              {!compact && <p className="mt-1 text-xs text-text-muted truncate">{def.desc}</p>}
              <div className="flex items-center gap-2 mt-1.5"><div className="flex-1 h-[3px] bg-surface-3 overflow-hidden"><motion.div className="h-full" style={{ background: state.unlocked ? rarity.color : 'rgba(187,243,81,0.4)' }} initial={{ width: 0 }} whileInView={{ width: `${state.unlocked ? 100 : state.percent}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 + i * 0.02 }} /></div><span className="font-mono text-[7px] text-text-subtle flex-shrink-0">{state.unlocked ? '✓' : `${Math.min(state.current, state.goal)}/${state.goal}`}</span></div>
            </div>
            {state.unlocked && <span className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px]" style={{ borderTopColor: `${rarity.color}99` }} />}
          </motion.div>
        )
      })}
    </div>
  )
}

export function achievementsProgress(stats = {}) {
  const unlocked = ACHIEVEMENT_DEFS.filter((d) => d.check(stats)).length
  return { unlocked, total: ACHIEVEMENT_DEFS.length }
}
