let cachedData = null

const DB_NAME = 'xaura_cache_db'
const DB_VERSION = 1
const STORE_NAME = 'datasets'
const CACHE_KEY = 'anime_data_v1'

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null)
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

async function getFromIndexedDB() {
  try {
    const db = await openDB()
    if (!db) return null
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(CACHE_KEY)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function saveToIndexedDB(data) {
  try {
    const db = await openDB()
    if (!db) return
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(data, CACHE_KEY)
  } catch {
    // Игнорируем ошибки квоты хранилища
  }
}

export async function loadAnimeData() {
  if (cachedData) return cachedData

  // 1. Попытка прочесть из локального IndexedDB
  const localCached = await getFromIndexedDB()
  if (localCached && Array.isArray(localCached) && localCached.length > 0) {
    cachedData = localCached
    return cachedData
  }

  // 2. Сетевая загрузка, если локально ещё нет
  try {
    const res = await fetch('/data/anime.json')
    if (!res.ok) throw new Error('Failed to load anime data')
    const raw = await res.json()
    cachedData = raw.filter((a) => {
      const img = a.image?.original
      return img && !img.includes('missing_')
    })
    // Сохраняем в фоне в IndexedDB
    saveToIndexedDB(cachedData)
    return cachedData
  } catch (err) {
    console.error('Failed to load local anime data:', err)
    return []
  }
}

export function getCachedData() {
  return cachedData
}

export function filterAnime(data, { search = '', year = '', genre = '', sort = 'score', showNsfw = false }) {
  let filtered = [...data]

  if (!showNsfw) {
    filtered = filtered.filter((a) => a.rating !== 'r_plus' && a.rating !== 'rx' &&
      !(a.genres || []).some((g) => g.name === 'Hentai'))
  }

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter((a) =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.russian || '').toLowerCase().includes(q)
    )
  }

  if (year) {
    filtered = filtered.filter((a) => a.aired_on && a.aired_on.startsWith(String(year)))
  }

  if (genre) {
    filtered = filtered.filter((a) =>
      (a.genres || []).some((g) => g.name === genre)
    )
  }

  if (sort === 'score') {
    filtered.sort((a, b) => (b.score || 0) - (a.score || 0))
  } else if (sort === 'name') {
    filtered.sort((a, b) => (a.russian || a.name || '').localeCompare(b.russian || b.name || ''))
  } else if (sort === 'aired_on') {
    filtered.sort((a, b) => (b.aired_on || '').localeCompare(a.aired_on || ''))
  } else if (sort === 'episodes') {
    filtered.sort((a, b) => (b.episodes || 0) - (a.episodes || 0))
  }

  return filtered
}

export function getRandomAnime(data, yearFrom = '', yearTo = '') {
  let pool = data
  if (yearFrom || yearTo) {
    pool = data.filter((a) => {
      if (!a.aired_on) return false
      const y = Number(a.aired_on.split('-')[0])
      if (yearFrom && y < Number(yearFrom)) return false
      if (yearTo && y > Number(yearTo)) return false
      return true
    })
  }
  if (pool.length === 0) pool = data
  return pool[Math.floor(Math.random() * pool.length)]
}
