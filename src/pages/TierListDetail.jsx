import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'

function getScoreColor(score) {
  if (score >= 9) return '#a855f7'
  if (score >= 7.5) return '#7c3aed'
  if (score >= 6) return '#6366f1'
  if (score >= 4.5) return '#3b82f6'
  if (score >= 3) return '#06b6d4'
  return '#64748b'
}

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
        <p className="text-gray-400 mb-4">Tier List не найден</p>
        <Link to="/" className="text-purple-400 hover:text-purple-300">На главную</Link>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <p className="text-gray-400">Загрузка...</p>
    </div>
  )

  const tiers = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card p-6 mb-8 animate-slide-up">
          <h1 className="text-2xl font-black mb-2">{list.name}</h1>
          {owner && (
            <Link to={`/user/${owner.id}`} className="text-purple-400 hover:text-purple-300 text-sm">
              {owner.username}
            </Link>
          )}
          <p className="text-gray-500 text-xs mt-1">{new Date(list.created_at).toLocaleDateString('ru')}</p>
        </div>

        <div className="space-y-2">
          {tiers.map((tier, idx) => {
            const items = (tier.items || []).map((id) => animeMap[id]).filter(Boolean)
            if (items.length === 0) return null
            return (
              <div key={tier.id} className="flex items-stretch gap-2 animate-slide-up" style={{ animationDelay: `${idx * 0.03}s` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0" style={{ backgroundColor: tier.color }}>
                  {tier.name}
                </div>
                <div className="flex-1 min-h-[70px] bg-dark-700/40 rounded-xl border border-white/5 p-2 flex items-center gap-2 overflow-x-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-[70px] relative group">
                      {item.image?.original && !item.image.original.includes('missing_') ? (
                        <img src={`https://shikimori.io${item.image.original}`} alt="" className="w-[70px] h-[100px] rounded-lg object-cover" />
                      ) : (
                        <div className="w-[70px] h-[100px] rounded-lg bg-dark-600 flex items-center justify-center">
                          <span className="text-gray-500 text-xl font-bold">{(item.russian || item.name || '?')[0]}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center text-[9px] py-0.5 rounded-b-lg truncate px-1">
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
