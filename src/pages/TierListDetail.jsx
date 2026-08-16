import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'

export default function TierListDetail() {
  const { listId } = useParams()
  const [list, setList] = useState(null)
  const [owner, setOwner] = useState(null)
  const [animeMap, setAnimeMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { load() }, [listId])

  const load = async () => {
    const { data: lists } = await supabase.from('tier_lists').select('*').eq('id', listId).single()
    if (!lists) { setNotFound(true); setLoading(false); return }
    setList(lists)

    const { data: profile } = await supabase.from('profiles').select('id, username').eq('id', lists.user_id).single()
    setOwner(profile)

    const allAnime = await loadAnimeData()
    const map = {}
    for (const a of allAnime) map[a.id] = a
    setAnimeMap(map)
    setLoading(false)
  }

  if (notFound) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm mb-3 text-text-muted">Tier List не найден</p>
        <Link to="/" className="text-neon-400 hover:text-neon-700 text-xs">На главную</Link>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <p className="text-sm text-text-muted">Загрузка...</p>
    </div>
  )

  const tiers = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-5 mb-6 page-enter bg-surface-1 border border-neon-400/10">
          <h1 className="text-xl font-bold mb-1 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{list.name}</h1>
          {owner && (
            <Link to={`/user/${owner.id}`} className="text-neon-400 hover:text-neon-700 text-xs">
              {owner.username}
            </Link>
          )}
          <p className="text-[10px] mt-1 text-text-muted" style={{ fontFamily: 'Source Code Pro' }}>{new Date(list.created_at).toLocaleDateString('ru')}</p>
        </div>

        <div className="space-y-1.5">
          {tiers.map((tier) => {
            const items = (tier.items || []).map((id) => animeMap[id]).filter(Boolean)
            if (items.length === 0) return null
            return (
              <div key={tier.id} className="flex items-stretch gap-2">
                <div className="tier-badge flex-shrink-0" style={{ backgroundColor: tier.color + '18', border: `1px solid ${tier.color}30`, color: tier.color }}>
                  {tier.name}
                </div>
                <div className="flex-1 min-h-[60px] rounded-xl p-1.5 flex items-center gap-1.5 overflow-x-auto bg-surface-2 border border-neon-400/10">
                  {items.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-14 relative group">
                      {item.image?.original && !item.image.original.includes('missing_') ? (
                        <img src={`https://shikimori.one${item.image.original}`} alt="" className="w-14 h-[72px] rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-[72px] rounded-lg bg-surface-2 flex items-center justify-center">
                          <span className="text-sm font-bold text-text-muted">{(item.russian || item.name || '?')[0]}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] py-0.5 rounded-b-lg truncate px-0.5" style={{ background: 'rgba(0,0,0,0.7)' }}>
                        {item.russian || item.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
