import fs from 'fs'
import path from 'path'

const SHIKIMORI_BASE = 'https://shikimori.io/api'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'anime.json')
const CACHE_FILE = path.join(OUTPUT_DIR, '.parse-cache.json')
const MAX_ANIME = 15000
const PAGE_LIMIT = 50
const CONCURRENT = 10
const DELAY_MS = 150

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchJSON(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'xAura/1.0', 'Accept': 'application/json' },
      })
      if (res.status === 429) { await sleep(1500); continue }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      await sleep(1500)
    }
  }
  return null
}

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) } catch { return {} }
}
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8')
}

async function phase1() {
  console.log('=== Phase 1: Fetching anime list ===')
  const allAnime = []
  let page = 1
  let emptyCount = 0

  while (allAnime.length < MAX_ANIME && emptyCount < 3) {
    try {
      const data = await fetchJSON(`${SHIKIMORI_BASE}/animes?page=${page}&limit=${PAGE_LIMIT}&order=popularity`)
      if (!data || data.length === 0) { emptyCount++; page++; await sleep(DELAY_MS); continue }
      emptyCount = 0
      for (const item of data) {
        const img = item.image?.original
        if (!img || img.includes('missing_')) continue
        allAnime.push({
          id: item.id, name: item.name, russian: item.russian, image: item.image,
          kind: item.kind, score: item.score, status: item.status,
          episodes: item.episodes, episodes_aired: item.episodes_aired,
          aired_on: item.aired_on, released_on: item.released_on,
          rating: item.rating, genres: [], description: '',
        })
      }
      console.log(`Page ${page}: ${allAnime.length} anime with posters`)
      if (page % 20 === 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allAnime, null, 2), 'utf-8')
      }
      await sleep(DELAY_MS)
      page++
    } catch (err) {
      console.error(`  Error page ${page}: ${err.message}`)
      await sleep(3000)
      page++
    }
  }

  allAnime.sort((a, b) => (b.score || 0) - (a.score || 0))
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allAnime, null, 2), 'utf-8')
  console.log(`Phase 1 done: ${allAnime.length} anime`)
  return allAnime
}

async function phase2(animeList) {
  console.log('\n=== Phase 2: Fetching genres & descriptions ===')
  const cache = loadCache()
  let fetched = 0
  let cached = 0
  let skipped = 0

  for (let i = 0; i < animeList.length; i += CONCURRENT) {
    const batch = animeList.slice(i, i + CONCURRENT)
    const results = await Promise.all(
      batch.map(async (anime) => {
        if (cache[anime.id]) {
          cached++
          anime.genres = cache[anime.id].genres || []
          anime.description = cache[anime.id].description || ''
          return
        }
        const detail = await fetchJSON(`${SHIKIMORI_BASE}/animes/${anime.id}`)
        if (detail) {
          anime.genres = detail.genres || []
          anime.description = detail.description || ''
          cache[anime.id] = { genres: anime.genres, description: anime.description }
          fetched++
        } else {
          skipped++
        }
      })
    )

    if (fetched % 50 === 0 && fetched > 0) {
      console.log(`  Progress: ${i + CONCURRENT}/${animeList.length} (new: ${fetched}, cached: ${cached})`)
      saveCache(cache)
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(animeList, null, 2), 'utf-8')
    }

    await sleep(DELAY_MS)
  }

  saveCache(cache)
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(animeList, null, 2), 'utf-8')
  console.log(`Phase 2 done: fetched=${fetched}, cached=${cached}, skipped=${skipped}`)
}

async function main() {
  const startTime = Date.now()
  console.log(`Starting parser at ${new Date().toLocaleTimeString()}`)

  let animeList
  if (fs.existsSync(OUTPUT_FILE)) {
    const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'))
    if (existing.length >= MAX_ANIME) {
      console.log(`Found existing data: ${existing.length} anime (>= ${MAX_ANIME}), skipping Phase 1`)
      animeList = existing
    } else {
      console.log(`Found existing data: ${existing.length} anime (< ${MAX_ANIME}), re-running Phase 1`)
      animeList = await phase1()
    }
  } else {
    animeList = await phase1()
  }

  await phase2(animeList)

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\nDone in ${elapsed}s: ${animeList.length} anime saved to ${OUTPUT_FILE}`)
}

main().catch(console.error)
