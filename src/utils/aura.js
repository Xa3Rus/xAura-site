// Система уровней «ауры»: XP начисляется за активность и определяет уровень
// пользователя. Используется в профиле, публичном профиле и таблице лидеров.
export const AURA_XP = { rating: 12, tierList: 40, battle: 8 }

export const AURA_TITLES = ['Новичок', 'Зритель', 'Критик', 'Аналитик', 'Эксперт', 'Мастер', 'Легенда', 'Бог аниме']

export const AURA_GRADIENTS = [
  'from-surface-4 via-surface-3 to-surface-4',
  'from-emerald-900 via-emerald-700 to-emerald-900',
  'from-cyan-900 via-cyan-600 to-cyan-900',
  'from-indigo-900 via-violet-600 to-indigo-900',
  'from-violet-900 via-fuchsia-600 to-violet-900',
  'from-fuchsia-900 via-amber-500 to-fuchsia-900',
  'from-amber-500 via-yellow-300 to-amber-500',
]

export function getAuraLevel(ratingsCount = 0, tierListsCount = 0, battlesCount = 0) {
  const xp = ratingsCount * AURA_XP.rating + tierListsCount * AURA_XP.tierList + battlesCount * AURA_XP.battle
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 4)) + 1)
  const curFloor = Math.pow(level - 1, 2) * 4
  const nextFloor = Math.pow(level, 2) * 4
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
