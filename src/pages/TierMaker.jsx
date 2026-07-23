import { useState, useEffect, useContext, useRef } from 'react'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import Loader from '../components/Loader'
import { loadAnimeData } from '../utils/animeData'

const PRESET_COLORS = [
  '#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa',
  '#f472b6', '#34d399', '#f97316', '#818cf8', '#22c55e', '#ec4899',
]

const DEFAULT_TIERS = [
  { id: 's', name: 'S', color: '#f87171', items: [] },
  { id: 'a', name: 'A', color: '#fb923c', items: [] },
  { id: 'b', name: 'B', color: '#facc15', items: [] },
  { id: 'c', name: 'C', color: '#4ade80', items: [] },
  { id: 'd', name: 'D', color: '#60a5fa', items: [] },
  { id: 'f', name: 'F', color: '#6b7280', items: [] },
]

export default function TierMaker() {
  const { user } = useContext(AuthContext)
  const [allAnime, setAllAnime] = useState([])
  const [loading, setLoading] = useState(true)
  const [tiers, setTiers] = useState(DEFAULT_TIERS.map((t) => ({ ...t, items: [] })))
  const [pool, setPool] = useState([])
  const [search, setSearch] = useState('')
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragSource, setDragSource] = useState(null)
  const [editingTier, setEditingTier] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('')
  const [tierListName, setTierListName] = useState('Мой Tier List')
  const [savedLists, setSavedLists] = useState([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const poolRef = useRef(null)

  useEffect(() => {
    loadAnimeData().then(async (data) => {
      setAllAnime(data)
      if (user) {
        const { data: ratings } = await supabase.from('ratings').select('anime_id, anime_name, anime_image').eq('user_id', user.id)
        if (ratings?.length > 0) {
          const ratedAnime = ratings.map((r) => {
            const found = data.find((a) => a.id === r.anime_id)
            return found || {
              id: r.anime_id, name: r.anime_name, russian: r.anime_name,
              image: r.anime_image ? { original: r.anime_image.replace('https://shikimori.io', '') } : null,
            }
          })
          setPool(ratedAnime)
        }
        const { data: lists } = await supabase.from('tier_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        setSavedLists(lists || [])
      }
      setLoading(false)
    })
  }, [user])

  const filteredPool = pool.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (a.name || '').toLowerCase().includes(q) || (a.russian || '').toLowerCase().includes(q)
  })

  const handleDragStart = (item, source) => {
    setDraggedItem(item)
    setDragSource(source)
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleDropOnTier = (tierId) => {
    if (!draggedItem) return
    if (dragSource === 'pool') {
      setPool((p) => p.filter((a) => a.id !== draggedItem.id))
      setTiers((prev) => prev.map((t) =>
        t.id === tierId ? { ...t, items: [...t.items, draggedItem] } : t
      ))
    } else if (dragSource.startsWith('tier-')) {
      const sourceTierId = dragSource.replace('tier-', '')
      if (sourceTierId === tierId) { setDraggedItem(null); setDragSource(null); return }
      setTiers((prev) => prev.map((t) => {
        if (t.id === sourceTierId) return { ...t, items: t.items.filter((a) => a.id !== draggedItem.id) }
        if (t.id === tierId) return { ...t, items: [...t.items, draggedItem] }
        return t
      }))
    }
    setDraggedItem(null)
    setDragSource(null)
  }

  const handleDropOnPool = () => {
    if (!draggedItem || dragSource === 'pool') { setDraggedItem(null); setDragSource(null); return }
    const sourceTierId = dragSource.replace('tier-', '')
    setTiers((prev) => prev.map((t) =>
      t.id === sourceTierId ? { ...t, items: t.items.filter((a) => a.id !== draggedItem.id) } : t
    ))
    setPool((p) => [...p, draggedItem])
    setDraggedItem(null)
    setDragSource(null)
  }

  const handleDropOnPoolRef = (e) => {
    e.preventDefault()
    handleDropOnPool()
  }

  const addTier = () => {
    const id = 'custom_' + Date.now()
    setTiers((prev) => [...prev, { id, name: 'NEW', color: PRESET_COLORS[prev.length % PRESET_COLORS.length], items: [] }])
  }

  const removeTier = (tierId) => {
    const tier = tiers.find((t) => t.id === tierId)
    if (tier?.items.length > 0 && !confirm('Удалить тир с аниме?')) return
    setTiers((prev) => {
      const t = prev.find((x) => x.id === tierId)
      if (t?.items.length > 0) setPool((p) => [...p, ...t.items])
      return prev.filter((x) => x.id !== tierId)
    })
  }

  const startEditTier = (tier) => {
    setEditingTier(tier.id)
    setEditingName(tier.name)
    setEditingColor(tier.color)
  }

  const saveEditTier = () => {
    setTiers((prev) => prev.map((t) =>
      t.id === editingTier ? { ...t, name: editingName, color: editingColor } : t
    ))
    setEditingTier(null)
  }

  const moveTier = (tierId, direction) => {
    setTiers((prev) => {
      const idx = prev.findIndex((t) => t.id === tierId)
      if (idx === -1) return prev
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
  }

  const saveTierList = async () => {
    if (!user) return
    const listData = {
      user_id: user.id,
      name: tierListName,
      tiers: tiers.map((t) => ({ id: t.id, name: t.name, color: t.color, items: t.items.map((a) => a.id) })),
    }
    const { data } = await supabase.from('tier_lists').insert(listData).select().single()
    if (data) setSavedLists((prev) => [data, ...prev])

    for (const tier of tiers) {
      if (tier.items.length === 0) continue
      for (const item of tier.items) {
        await supabase.from('ratings').update({ tier: tier.name }).eq('user_id', user.id).eq('anime_id', item.id)
      }
    }

    setShowSaveDialog(false)
  }

  const loadTierList = (list) => {
    const tiersData = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
    const loadedTiers = tiersData.map((t) => ({
      ...t,
      items: t.items.map((id) => allAnime.find((a) => a.id === id)).filter(Boolean),
    }))
    setTiers(loadedTiers)
    setTierListName(list.name)
  }

  const deleteTierList = async (listId) => {
    if (!confirm('Удалить tier list?')) return
    await supabase.from('tier_lists').delete().eq('id', listId)
    setSavedLists((prev) => prev.filter((l) => l.id !== listId))
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader text="Загрузка..." /></div>

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 page-enter">
          <input
            value={tierListName}
            onChange={(e) => setTierListName(e.target.value)}
            className="text-xl font-bold bg-transparent outline-none pb-1 transition-colors"
            style={{ fontFamily: 'Space Grotesk', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          />
          <button onClick={() => setShowSaveDialog(true)} className="btn-primary text-xs !py-2">Сохранить</button>
        </div>

        {showSaveDialog && (
          <div className="rounded-xl p-4 mb-6 page-enter" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <input value={tierListName} onChange={(e) => setTierListName(e.target.value)} className="input flex-1" placeholder="Название" />
              <button onClick={saveTierList} className="btn-primary text-xs">Сохранить</button>
              <button onClick={() => setShowSaveDialog(false)} className="text-xs hover:text-white/40" style={{ color: 'rgba(255,255,255,0.2)' }}>Отмена</button>
            </div>
          </div>
        )}

        <div className="space-y-1.5 mb-6">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-stretch gap-2">
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <div
                  className="tier-badge cursor-pointer hover:opacity-80 transition-opacity relative"
                  style={{ backgroundColor: tier.color + '18', border: `1px solid ${tier.color}30`, color: tier.color }}
                  onClick={() => startEditTier(tier)}
                >
                  {editingTier === tier.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={saveEditTier}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditTier()}
                      className="w-8 h-6 bg-black/30 text-center text-xs font-bold rounded outline-none"
                      autoFocus
                      maxLength={4}
                      style={{ color: tier.color }}
                    />
                  ) : (
                    tier.name
                  )}
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => moveTier(tier.id, 'up')} className="text-[10px] hover:text-white/40 transition-colors" style={{ color: 'rgba(255,255,255,0.1)' }}>▲</button>
                  <button onClick={() => moveTier(tier.id, 'down')} className="text-[10px] hover:text-white/40 transition-colors" style={{ color: 'rgba(255,255,255,0.1)' }}>▼</button>
                </div>
              </div>

              <div
                className="flex-1 min-h-[60px] rounded-xl p-1.5 flex items-center gap-1.5 overflow-x-auto"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnTier(tier.id)}
              >
                {tier.items.length === 0 && (
                  <span className="text-[10px] mx-auto" style={{ color: 'rgba(255,255,255,0.08)' }}>Перетащи сюда</span>
                )}
                {tier.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item, `tier-${tier.id}`)}
                    className="flex-shrink-0 w-14 cursor-grab active:cursor-grabbing group/item relative"
                  >
                    <img
                      src={item.image?.original && !item.image.original.includes('missing_') ? `https://shikimori.one${item.image.original}` : ''}
                      alt=""
                      className="w-14 h-[72px] rounded-lg object-cover group-hover/item:ring-1 ring-amber-500/50 transition-all"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                    <div className={`w-14 h-[72px] rounded-lg bg-surface-3 items-center justify-center ${item.image?.original && !item.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                      <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.1)' }}>{(item.russian || item.name || '?')[0]}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTiers((prev) => prev.map((t) =>
                          t.id === tier.id ? { ...t, items: t.items.filter((a) => a.id !== item.id) } : t
                        ))
                        setPool((p) => [...p, item])
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity"
                      style={{ background: 'rgba(244,63,94,0.9)' }}
                    >×</button>
                  </div>
                ))}
              </div>

              <button onClick={() => removeTier(tier.id)} className="text-xs px-1 self-center hover:text-coral-400 transition-colors" style={{ color: 'rgba(255,255,255,0.1)' }}>✕</button>
            </div>
          ))}
        </div>

        <button onClick={addTier} className="text-amber-400 hover:text-amber-300 text-xs mb-6 transition-colors">+ Добавить тир</button>

        <div className="rounded-xl p-4 page-enter" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Пул аниме</h3>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." className="input !py-1.5 text-xs flex-1 max-w-xs" />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.12)', fontFamily: 'JetBrains Mono' }}>{filteredPool.length}</span>
          </div>
          <div
            ref={poolRef}
            className="flex flex-wrap gap-1.5 min-h-[72px] p-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.06)' }}
            onDragOver={handleDragOver}
            onDrop={handleDropOnPoolRef}
          >
            {filteredPool.length === 0 && (
              <span className="text-xs mx-auto self-center" style={{ color: 'rgba(255,255,255,0.08)' }}>Нет аниме в пуле</span>
            )}
            {filteredPool.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item, 'pool')}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing group/pool relative"
              >
                <img
                  src={item.image?.original && !item.image.original.includes('missing_') ? `https://shikimori.one${item.image.original}` : ''}
                  alt=""
                  className="w-14 h-[72px] rounded-lg object-cover hover:ring-1 ring-amber-500/50 transition-all"
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                />
                <div className={`w-14 h-[72px] rounded-lg bg-surface-3 items-center justify-center ${item.image?.original && !item.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                  <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.1)' }}>{(item.russian || item.name || '?')[0]}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] py-0.5 rounded-b-lg truncate px-0.5" style={{ background: 'rgba(0,0,0,0.7)' }}>
                  {item.russian || item.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {savedLists.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Сохранённые Tier List</h3>
            <div className="space-y-1.5">
              {savedLists.map((list) => {
                const tiersData = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
                return (
                  <div key={list.id} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{list.name}</h4>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono' }}>{new Date(list.created_at).toLocaleDateString('ru')}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {tiersData.filter((t) => t.items.length > 0).map((t) => (
                        <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: t.color + '15', color: t.color, border: `1px solid ${t.color}20` }}>
                          {t.name}:{t.items.length}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => loadTierList(list)} className="text-amber-400 hover:text-amber-300 text-xs transition-colors">Загрузить</button>
                    <button onClick={() => deleteTierList(list.id)} className="hover:text-coral-400 text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.15)' }}>Удалить</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
