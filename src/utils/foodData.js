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
