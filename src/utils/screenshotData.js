// Фетч и кеш скриншотов аниме с Shikimori.
// Запросы идут через тот же прокси /shikimori-img (edge-функция в проде,
// vite-прокси в dev) — он проксирует любые пути, включая /api/...,
// и обходит DDoS-Guard. Ответы кешируются на стороне прокси.

const CACHE = new Map() // animeId -> string[] (проксированные URL скриншотов)
const FETCHING = new Map() // animeId -> Promise (дедупликация параллельных запросов)

function toProxyUrl(path) {
  if (!path || path.includes('missing_')) return null
  const clean = String(path).replace(/^https?:\/\/shikimori\.(one|io)/, '')
  if (!clean) return null
  return `/shikimori-img${clean.startsWith('/') ? '' : '/'}${clean}`
}

export async function getScreenshots(animeId) {
  if (CACHE.has(animeId)) return CACHE.get(animeId)
  if (FETCHING.has(animeId)) return FETCHING.get(animeId)

  const p = (async () => {
    try {
      const res = await fetch(`/shikimori-img/api/animes/${animeId}/screenshots`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const urls = (Array.isArray(json) ? json : [])
        .map((s) => toProxyUrl(s?.original))
        .filter(Boolean)
      CACHE.set(animeId, urls)
      return urls
    } catch (err) {
      console.warn(`[Screenshots] ${animeId}: ${err.message}`)
      CACHE.set(animeId, [])
      return []
    } finally {
      FETCHING.delete(animeId)
    }
  })()

  FETCHING.set(animeId, p)
  return p
}

export function getCachedScreenshots(animeId) {
  return CACHE.get(animeId) || null
}
