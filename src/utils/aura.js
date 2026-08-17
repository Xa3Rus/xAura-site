// Система уровней «ауры»: XP начисляется за активность и определяет уровень
// пользователя. Используется в профиле, публичном профиле и таблице лидеров.
export const AURA_XP = { rating: 12, tierList: 40, battle: 8 }

export const AURA_TITLES = ['Новичок', 'Зритель', 'Критик', 'Аналитик', 'Эксперт', 'Мастер', 'Легенда', 'Бог аниме']

// Насколько дорого растёт уровень: XP для уровня L = LEVEL_FACTOR * (L - 1)^2.
// При 16 Годжо (уровень 15) требует 3136 XP — это сотни оценок, а не пара вечеров
const LEVEL_FACTOR = 16

export const AURA_GRADIENTS = [
  'from-surface-4 via-surface-3 to-surface-4',
  'from-emerald-900 via-emerald-700 to-emerald-900',
  'from-cyan-900 via-cyan-600 to-cyan-900',
  'from-indigo-900 via-violet-600 to-indigo-900',
  'from-violet-900 via-fuchsia-600 to-violet-900',
  'from-fuchsia-900 via-amber-500 to-fuchsia-900',
  'from-amber-600 via-amber-400 to-amber-600',
  'from-amber-300 via-yellow-200 to-white',
]

export function getAuraLevel(ratingsCount = 0, tierListsCount = 0, battlesCount = 0) {
  const xp = ratingsCount * AURA_XP.rating + tierListsCount * AURA_XP.tierList + battlesCount * AURA_XP.battle
  const level = Math.max(1, Math.floor(Math.sqrt(xp / LEVEL_FACTOR)) + 1)
  const curFloor = Math.pow(level - 1, 2) * LEVEL_FACTOR
  const nextFloor = Math.pow(level, 2) * LEVEL_FACTOR
  const progress = Math.min(100, Math.round(((xp - curFloor) / (nextFloor - curFloor)) * 100))
  return {
    xp,
    level,
    progress,
    next: nextFloor - xp,
    title: AURA_TITLES[Math.min(AURA_TITLES.length - 1, Math.floor((level - 1) / 2))],
    gradient: AURA_GRADIENTS[Math.min(AURA_GRADIENTS.length - 1, Math.floor((level - 1) / 2))],
  }
}
