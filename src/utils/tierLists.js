// Разбор данных тир-листа из Supabase. В колонке tiers бывает два формата:
// массив тиров (нативные списки) либо объект { pool, tiers } — списки,
// импортированные из TierMaker, где неразмещённые карточки лежат в pool.
export function parseTierListData(raw) {
  let data = raw
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = []
    }
  }
  if (Array.isArray(data)) return { tiers: data, pool: [] }
  return { tiers: data?.tiers || [], pool: data?.pool || [] }
}
