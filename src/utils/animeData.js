let cachedData = null

export async function loadAnimeData() {
  if (cachedData) return cachedData
  try {
    const res = await fetch('/data/anime.json')
    if (!res.ok) throw new Error('Failed to load anime data')
    const raw = await res.json()
    cachedData = raw.filter((a) => {
      const img = a.image?.original
      return img && !img.includes('missing_')
    })
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

export function getRandomAnime(data, year = '') {
  let pool = data
  if (year) {
    pool = data.filter((a) => a.aired_on && a.aired_on.startsWith(String(year)))
  }
  if (pool.length === 0) pool = data
  return pool[Math.floor(Math.random() * pool.length)]
}
