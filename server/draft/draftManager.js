// Логика драфта «змейкой»: 5 пиков на игрока, порядок 1..N, N..1, ...
// Пул тайтлов приходит от клиента хоста (у него локальная копия anime.json),
// серверу данные аниме не нужны — он только валидирует и синхронизирует ходы.

export const TEAM_SIZE = 5

export function buildDraftState(players, pool) {
  const n = players.length
  const order = []
  for (let r = 0; r < TEAM_SIZE; r++) {
    const seq = Array.from({ length: n }, (_, i) => i)
    if (r % 2 === 1) seq.reverse()
    order.push(...seq)
  }
  return {
    pool,
    teams: players.map(() => []),
    order,
    turn: 0,
    phase: 'drafting', // drafting | done
    lastPick: null,
    standings: null,
  }
}

function isPicked(draft, animeId) {
  return draft.teams.some((t) => t.some((a) => a.id === animeId))
}

export function pickAnime(draft, playerIdx, animeId) {
  if (draft.phase !== 'drafting') return { error: 'Драфт уже завершён' }
  if (draft.order[draft.turn] !== playerIdx) return { error: 'Сейчас не твой ход' }
  const anime = draft.pool.find((a) => a.id === animeId)
  if (!anime) return { error: 'Такого аниме нет в пуле' }
  if (isPicked(draft, animeId)) return { error: 'Это аниме уже забрали' }

  draft.teams[playerIdx].push(anime)
  draft.lastPick = { playerIdx, anime }
  draft.turn += 1
  if (draft.turn >= draft.order.length) draft.phase = 'done'
  return { ok: true }
}

// Случайный пик за офлайн-игрока: хост жмёт «пропустить», драфт не встаёт
export function randomPick(draft, playerIdx) {
  if (draft.phase !== 'drafting') return { error: 'Драфт уже завершён' }
  const available = draft.pool.filter((a) => !isPicked(draft, a.id))
  if (!available.length) return { error: 'Пул пуст' }
  const anime = available[Math.floor(Math.random() * available.length)]

  draft.teams[playerIdx].push(anime)
  draft.lastPick = { playerIdx, anime, auto: true }
  draft.turn += 1
  if (draft.turn >= draft.order.length) draft.phase = 'done'
  return { ok: true }
}

// Итог: сумма рейтингов шикимори по команде, сортировка по убыванию
export function buildStandings(draft, players) {
  const rows = players.map((p, i) => ({
    playerId: p.id,
    name: p.name,
    connected: p.connected,
    team: draft.teams[i],
    score: Math.round(draft.teams[i].reduce((s, a) => s + (Number(a.score) || 0), 0) * 100) / 100,
  }))
  rows.sort((a, b) => b.score - a.score)
  return rows
}
