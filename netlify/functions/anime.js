const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

const SHIKIMORI_BASE = 'https://shikimori.io/api'

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const params = new URLSearchParams(event.queryStringParameters || {})
    const path = event.path.split('/').pop()
    let endpoint = ''

    if (path === 'anime') {
      endpoint = '/animes'
    } else if (path === 'genres') {
      endpoint = '/genres'
    } else {
      return { statusCode: 404, headers, body: JSON.stringify({ message: 'Not found' }) }
    }

    const cacheKey = `${endpoint}?${params.toString()}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return { statusCode: 200, headers, body: JSON.stringify(cached.data) }
    }

    const url = `${SHIKIMORI_BASE}${endpoint}?${params.toString()}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'xAura/1.0',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return { statusCode: response.status, headers, body: JSON.stringify({ message: 'Shikimori API error' }) }
    }

    const data = await response.json()
    cache.set(cacheKey, { data, time: Date.now() })

    return { statusCode: 200, headers, body: JSON.stringify(data) }
  } catch (err) {
    console.error('Anime proxy error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Ошибка сервера' }) }
  }
}
