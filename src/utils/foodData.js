let cachedFoodData = null

const FOOD_TEMPLATE_ID = '-16841250'

export async function loadFoodData() {
  if (cachedFoodData) return cachedFoodData
  
  try {
    const res = await fetch(`/tiermaker-api/api/?type=templates-v2&id=${FOOD_TEMPLATE_ID}&lastEdited=2024-07-31%2016:39:52&variation=`)
    if (!res.ok) throw new Error('Failed to load food data')
    
    const rawData = await res.json()
    const basePath = rawData[0]
    
    cachedFoodData = rawData.slice(1).map((filename, index) => {
      const id = parseInt(filename.replace('.png', ''))
      const imageUrl = `/tiermaker-api/images/media/template_images/2024/16841250/-16841250/${filename}`
      
      return {
        id: `food_${id}`,
        name: `Еда ${id}`,
        image: imageUrl,
        tier: null
      }
    })
    
    return cachedFoodData
  } catch (err) {
    console.error('Failed to load food data:', err)
    return []
  }
}

export function getCachedFoodData() {
  return cachedFoodData
}

export function filterFood(data, { search = '' }) {
  if (!search) return data
  
  const q = search.toLowerCase()
  return data.filter((item) =>
    (item.name || '').toLowerCase().includes(q)
  )
}

export function parseTierMakerUrl(url) {
  let slug = null

  // обрезаем слэши и query, чтобы /create/slug/ и ссылки с ?utm тоже работали
  const clean = url.trim().replace(/\/+$/, '').split('?')[0].split('#')[0]

  const createMatch = clean.match(/tiermaker\.com\/create\/([a-z0-9\-]+)/i)
  if (createMatch) {
    slug = createMatch[1]
  }

  if (!slug) {
    const catMatch = clean.match(/tiermaker\.com\/categories\/[^/]+\/([a-z0-9\-]+)/i)
    if (catMatch) slug = catMatch[1]
  }

  if (!slug) {
    const tierMatch = clean.match(/tiermaker\.com\/tier-lists\/[^/]+\/([a-z0-9\-]+)/i)
    if (tierMatch) slug = tierMatch[1]
  }

  if (!slug && /^[\-a-z0-9]+$/i.test(clean)) {
    slug = clean
  }

  return slug
}

export async function loadTierMakerTemplate(slug) {
  try {
    const pageRes = await fetch(`/tiermaker-api/create/${slug}`)
    if (!pageRes.ok) throw new Error('Failed to load page')

    const html = await pageRes.text()

    const pathMatch = html.match(/baseTierImagePath\s*=\s*"([^"]+)"/)
    const dateMatch = html.match(/dateLastEdited\s*=\s*"([^"]+)"/)
    const variationMatch = html.match(/tierSystem\.initList\("",\s*"[^"]+",\s*"(\d*)"\)/)
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)

    const pageBasePath = pathMatch ? pathMatch[1] : null
    const lastEdited = dateMatch ? dateMatch[1] : ''
    const variation = variationMatch ? variationMatch[1] : ''
    const title = titleMatch ? titleMatch[1].trim().replace(' Tier List Maker', '') : slug

    if (!pageBasePath) throw new Error('Could not parse template data')

    const apiRes = await fetch(`/tiermaker-api/api/?type=templates-v2&id=${encodeURIComponent(slug)}&lastEdited=${encodeURIComponent(lastEdited)}&variation=${variation}`)
    if (!apiRes.ok) throw new Error('Failed to load template images')

    const rawData = await apiRes.json()

    // Путь к картинкам берём со страницы (baseTierImagePath, например
    // /images/chart/chart/<slug>) — basePath из API отдаёт укороченный
    // путь, по которому изображения отдают 404
    const imagePath = pageBasePath.startsWith('/images') ? pageBasePath : `/images${pageBasePath}`

    return {
      title,
      items: rawData.slice(1).map((filename) => {
        const num = filename.replace('.png', '')
        const imageUrl = `/tiermaker-api${imagePath}/${filename}`

        return {
          id: `tm_${slug}_${num}`,
          name: num,
          image: imageUrl,
          tier: null
        }
      })
    }
  } catch (err) {
    console.error('Failed to load TierMaker template:', err)
    return { title: slug, items: [] }
  }
}
