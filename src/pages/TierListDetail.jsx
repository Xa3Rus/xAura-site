import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'
import { shikimoriImg } from '../utils/imgUrl'
import Loader from '../components/Loader'

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

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader text="Загрузка..." /></div>

  const tiers = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
  const filledTiers = tiers.filter((t) => (t.items || []).length > 0)
  const totalItems = filledTiers.reduce((sum, t) => sum + t.items.length, 0)

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-neon-400/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          className="rounded-2xl p-6 sm:p-7 mb-6 page-enter relative overflow-hidden bg-surface-1 border border-neon-400/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* полоса цветов тиров */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            {filledTiers.map((t) => (
              <div key={t.id} className="flex-1" style={{ backgroundColor: t.color, opacity: 0.7, height: totalItems ? `${Math.max(12, (t.items.length / totalItems) * 100)}%` : '100%' }} />
            ))}
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-neon-400/[0.06] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <span className="label block mb-1.5">TIER LIST</span>
              <h1 className="text-2xl font-bold neon-text truncate" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{list.name}</h1>
              {owner && (
                <Link to={`/user/${owner.id}`} className="inline-flex items-center gap-2 mt-2.5 group">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-neon-400/10 border border-neon-400/20 text-[10px] font-bold text-neon-400 group-hover:shadow-glow-neon transition-shadow">
                    {owner.username[0].toUpperCase()}
                  </span>
                  <span className="text-xs text-neon-400 group-hover:text-neon-300 transition-colors">{owner.username}</span>
                </Link>
              )}
            </div>
            <div className="flex gap-2.5">
              <div className="rounded-xl px-4 py-3 bg-surface-1 border border-neon-400/10 text-center min-w-[76px]">
                <div className="text-xl font-bold text-neon-400 font-mono">{totalItems}</div>
                <div className="label !mb-0">позиций</div>
              </div>
              <div className="rounded-xl px-4 py-3 bg-surface-1 border border-neon-400/10 text-center min-w-[76px]">
                <div className="text-xl font-bold text-cyan-400 font-mono">{filledTiers.length}</div>
                <div className="label !mb-0">тиров</div>
              </div>
            </div>
          </div>
          <p className="relative mt-3 text-[10px] text-text-muted font-mono">{new Date(list.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </motion.div>

        <div className="space-y-2">
          {tiers.map((tier, tierIdx) => {
            const items = (tier.items || []).map((id) => animeMap[id]).filter(Boolean)
            if (items.length === 0) return null
            return (
              <motion.div
                key={tier.id}
                className="flex items-stretch gap-2"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: tierIdx * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className="tier-badge"
                    style={{
                      background: `linear-gradient(180deg, ${tier.color}35, ${tier.color}12)`,
                      border: `1px solid ${tier.color}50`,
                      color: tier.color,
                      textShadow: `0 0 14px ${tier.color}70`,
                      boxShadow: `0 0 18px -6px ${tier.color}50`,
                    }}
                  >
                    {tier.name}
                  </div>
                  <span className="font-mono text-[9px] text-text-subtle">{items.length}</span>
                </div>
                <div className="flex-1 min-h-[92px] rounded-xl p-2 flex flex-wrap items-center gap-2 bg-surface-2 border border-neon-400/10">
                  {items.map((item) => (
                    <div key={item.id} className="flex-shrink-0 group relative">
                      {item.image?.original && !item.image.original.includes('missing_') ? (
                        <img
                          src={shikimoriImg(item.image.original) || ''}
                          alt={item.russian || item.name}
                          className="w-16 h-20 rounded-md object-cover group-hover:ring-1 group-hover:ring-neon-400/60 group-hover:scale-105 transition-all duration-200"
                        />
                      ) : (
                        <div className="w-16 h-20 rounded-md bg-surface-2 flex items-center justify-center">
                          <span className="text-sm font-bold text-text-muted">{(item.russian || item.name || '?')[0]}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] py-0.5 rounded-b-md truncate px-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.8)' }}>
                        {item.russian || item.name}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link to="/tier-templates" className="btn-primary btn-shine text-xs !py-2.5">Создать свой</Link>
        </div>
      </div>
    </div>
  )
}
