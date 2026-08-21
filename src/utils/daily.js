// Ежедневный челлендж: один набор раундов для всех игроков в день.
// Вся «случайность» детерминирована датой — seeded PRNG (mulberry32),
// поэтому у двух игроков в один день выпадут одинаковые вопросы.

export const DAILY_ROUNDS = 10

export const DAILY_MODES = {
  battle: {
    title: 'Битва дня',
    hint: 'Какой тайтл оценён выше на шикимори',
    icon: '⚔',
  },
  screenshot: {
    title: 'Кадр дня',
    hint: 'Угадай аниме по размытому кадру',
    icon: '▣',
  },
}

export function getTodayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function hashStr(s) {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Чередование режимов по дням: чётный день — битва, нечётный — кадр
export function dailyModeForDate(dateKey) {
  const dayNum = Math.floor(Date.parse(dateKey + 'T00:00:00Z') / 86400000)
  return dayNum % 2 === 0 ? 'battle' : 'screenshot'
}

function toPoolEntry(a) {
  return { ...a, scoreNum: Number(a.score) }
}

function basePool(data) {
  return data
    .filter(
      (a) =>
        Number(a.score) > 0 &&
        a.image?.original &&
        !a.image.original.includes('missing_') &&
        a.aired_on &&
        Number(a.aired_on.slice(0, 4)) > 1990
    )
    .map(toPoolEntry)
}

// Индексы элементов со scoreNum в [lo, hi) — бинарный поиск как в BattlePage
function findBand(sorted, lo, hi) {
  let l = 0
  let r = sorted.length
  while (l < r) {
    const m = (l + r) >> 1
    if (sorted[m].scoreNum < lo) l = m + 1
    else r = m
  }
  const start = l
  r = sorted.length
  while (l < r) {
    const m = (l + r) >> 1
    if (sorted[m].scoreNum < hi) l = m + 1
    else r = m
  }
  return [start, l]
}

// 10 пар «у кого рейтинг выше». Разница держится в коридоре 1.5–2.1,
// основа пары берётся из популярного ядра (6.8–8.6), стороны чередуются seeded-случайно.
export function generateDailyBattle(data, dateKey) {
  const rnd = mulberry32(hashStr('battle:' + dateKey))
  const sorted = basePool(data).sort((x, y) => x.scoreNum - y.scoreNum)
  if (sorted.length < 100) return []

  const [coreStart, coreEnd] = findBand(sorted, 6.8, 8.6)
  if (coreEnd - coreStart < 40) return []

  const pairs = []
  const used = new Set()
  let attempts = 0
  while (pairs.length < DAILY_ROUNDS && attempts < 800) {
    attempts++
    const a = sorted[coreStart + Math.floor(rnd() * (coreEnd - coreStart))]
    if (!a || used.has(a.id)) continue

    const bands = [
      findBand(sorted, a.scoreNum + 1.5, a.scoreNum + 2.1),
      findBand(sorted, a.scoreNum - 2.1, a.scoreNum - 1.5),
    ]
    let partner = null
    for (const [s, e] of bands) {
      if (e <= s) continue
      for (let k = 0; k < 8 && !partner; k++) {
        const cand = sorted[s + Math.floor(rnd() * (e - s))]
        if (cand && !used.has(cand.id)) partner = cand
      }
      if (partner) break
    }
    if (!partner) continue

    const flip = rnd() < 0.5
    pairs.push(flip ? [partner, a] : [a, partner])
    used.add(a.id)
    used.add(partner.id)
  }
  return pairs
}

// 10 раундов «угадай по кадру»: seeded-ответы из популярных тайтлов,
// по 3 дистрактора и индекс скриншота на раунд.
export function generateDailyScreenshotPlan(data, dateKey) {
  const rnd = mulberry32(hashStr('shot:' + dateKey))
  const pool = data.filter(
    (a) =>
      Number(a.score) >= 6.8 &&
      a.image?.original &&
      !a.image.original.includes('missing_') &&
      a.aired_on &&
      Number(a.aired_on.slice(0, 4)) >= 2000
  )
  if (pool.length < 80) return []

  const rounds = []
  const usedAnswers = new Set()
  let attempts = 0
  while (rounds.length < DAILY_ROUNDS && attempts < 800) {
    attempts++
    const answer = pool[Math.floor(rnd() * pool.length)]
    if (usedAnswers.has(answer.id)) continue
    usedAnswers.add(answer.id)

    const distractors = []
    const seen = new Set([answer.id])
    while (distractors.length < 3) {
      const c = pool[Math.floor(rnd() * pool.length)]
      if (seen.has(c.id)) continue
      seen.add(c.id)
      distractors.push(c)
    }
    rounds.push({ answer, distractors, shotIdx: Math.floor(rnd() * 5) })
  }
  return rounds
}

// Стрик: сколько дней подряд игрок закрывал челлендж (сегодня или вчера — живой)
export function calcStreak(dateKeys) {
  const set = new Set(dateKeys)
  const d = new Date()
  if (!set.has(getTodayKey(d))) d.setDate(d.getDate() - 1)
  let streak = 0
  while (set.has(getTodayKey(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
