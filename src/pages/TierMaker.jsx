import { useState, useEffect, useContext, useRef } from 'react'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import Loader from '../components/Loader'
import { loadAnimeData } from '../utils/animeData'

const PRESET_COLORS = [
  '#ff4444', '#ff8c00', '#ffd700', '#00cc44', '#00aaff', '#9b5cff',
  '#ff69b4', '#00ffcc', '#ff6347', '#7b68ee', '#32cd32', '#ff1493',
]

const DEFAULT_TIERS = [
  { id: 's', name: 'S', color: '#ff4444', items: [] },
  { id: 'a', name: 'A', color: '#ff8c00', items: [] },
  { id: 'b', name: 'B', color: '#ffd700', items: [] },
  { id: 'c', name: 'C', color: '#00cc44', items: [] },
  { id: 'd', name: 'D', color: '#00aaff', items: [] },
  { id: 'f', name: 'F', color: '#999999', items: [] },
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
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <input
            value={tierListName}
            onChange={(e) => setTierListName(e.target.value)}
            className="text-2xl font-black bg-transparent border-b border-white/10 focus:border-purple-500 outline-none pb-1"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowSaveDialog(true)} className="gradient-btn text-sm !py-2">Сохранить</button>
          </div>
        </div>

        {showSaveDialog && (
          <div className="glass-card p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <input
                value={tierListName}
                onChange={(e) => setTierListName(e.target.value)}
                className="input-field flex-1"
                placeholder="Название tier list"
              />
              <button onClick={saveTierList} className="gradient-btn text-sm">Сохранить</button>
              <button onClick={() => setShowSaveDialog(false)} className="text-gray-400 hover:text-white text-sm">Отмена</button>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-8">
          {tiers.map((tier, tierIdx) => (
            <div key={tier.id} className="flex items-stretch gap-2 animate-slide-up" style={{ animationDelay: `${tierIdx * 0.03}s` }}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg cursor-pointer hover:opacity-80 transition-opacity relative"
                  style={{ backgroundColor: tier.color }}
                  onClick={() => startEditTier(tier)}
                >
                  {editingTier === tier.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={saveEditTier}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditTier()}
                      className="w-10 h-8 bg-black/30 text-center text-sm font-black rounded outline-none"
                      autoFocus
                      maxLength={4}
                    />
                  ) : (
                    tier.name
                  )}
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => moveTier(tier.id, 'up')} className="text-gray-600 hover:text-white text-xs">▲</button>
                  <button onClick={() => moveTier(tier.id, 'down')} className="text-gray-600 hover:text-white text-xs">▼</button>
                </div>
              </div>

              <div
                className="flex-1 min-h-[70px] bg-dark-700/40 rounded-xl border border-white/5 p-2 flex items-center gap-2 overflow-x-auto"
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnTier(tier.id)}
              >
                {tier.items.length === 0 && (
                  <span className="text-gray-600 text-sm mx-auto">Перетащи сюда</span>
                )}
                {tier.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item, `tier-${tier.id}`)}
                    className="flex-shrink-0 w-[70px] cursor-grab active:cursor-grabbing group/item relative"
                  >
                    <img
                      src={item.image?.original && !item.image.original.includes('missing_') ? `https://shikimori.io${item.image.original}` : ''}
                      alt=""
                      className="w-[70px] h-[100px] rounded-lg object-cover group-hover/item:ring-2 ring-purple-500 transition-all"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                    <div className={`w-[70px] h-[100px] rounded-lg bg-dark-600 items-center justify-center ${item.image?.original && !item.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                      <span className="text-gray-500 text-xl font-bold">{(item.russian || item.name || '?')[0]}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTiers((prev) => prev.map((t) =>
                          t.id === tier.id ? { ...t, items: t.items.filter((a) => a.id !== item.id) } : t
                        ))
                        setPool((p) => [...p, item])
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => removeTier(tier.id)}
                className="text-gray-600 hover:text-red-400 text-sm px-1 self-center transition-colors"
              >✕</button>
            </div>
          ))}
        </div>

        <button onClick={addTier} className="text-purple-400 hover:text-purple-300 text-sm mb-6 transition-colors">
          + Добавить тир
        </button>

        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-semibold">Пул аниме</h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="input-field !py-1.5 text-sm flex-1 max-w-xs"
            />
            <span className="text-gray-500 text-sm">{filteredPool.length}</span>
          </div>
          <div
            ref={poolRef}
            className="flex flex-wrap gap-2 min-h-[80px] p-2 bg-dark-800/40 rounded-xl border border-dashed border-white/10"
            onDragOver={handleDragOver}
            onDrop={handleDropOnPoolRef}
          >
            {filteredPool.length === 0 && (
              <span className="text-gray-600 text-sm mx-auto self-center">Нет аниме в пуле</span>
            )}
            {filteredPool.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item, 'pool')}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing group/pool relative"
              >
                <img
                  src={item.image?.original && !item.image.original.includes('missing_') ? `https://shikimori.io${item.image.original}` : ''}
                  alt=""
                  className="w-[70px] h-[100px] rounded-lg object-cover hover:ring-2 ring-purple-500 transition-all"
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                />
                <div className={`w-[70px] h-[100px] rounded-lg bg-dark-600 items-center justify-center ${item.image?.original && !item.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                  <span className="text-gray-500 text-xl font-bold">{(item.russian || item.name || '?')[0]}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center text-[9px] py-0.5 rounded-b-lg truncate px-1">
                  {item.russian || item.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {savedLists.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-lg mb-4">Сохранённые Tier List</h3>
            <div className="space-y-3">
              {savedLists.map((list) => {
                const tiersData = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
                return (
                  <div key={list.id} className="glass-card p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{list.name}</h4>
                      <p className="text-xs text-gray-500">{new Date(list.created_at).toLocaleDateString('ru')}</p>
                    </div>
                    <div className="flex gap-1">
                      {tiersData.filter((t) => t.items.length > 0).map((t) => (
                        <span key={t.id} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: t.color + '30', color: t.color }}>
                          {t.name}: {t.items.length}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => loadTierList(list)} className="text-purple-400 hover:text-purple-300 text-sm">Загрузить</button>
                    <button onClick={() => deleteTierList(list.id)} className="text-red-400 hover:text-red-300 text-sm">Удалить</button>
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
