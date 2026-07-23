import { useState, useEffect, useContext, useRef, useCallback } from 'react'
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

function hexToHSV(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
  }
  if (h < 0) h += 360
  return { h: Math.round(h), s: max === 0 ? 0 : Math.round((d / max) * 100), v: Math.round(max * 100) }
}

function hsvToHex(h, s, v) {
  s /= 100; v /= 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r, g, b
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function ColorPicker({ color, onChange }) {
  const svRef = useRef(null)
  const hueRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const hsv = hexToHSV(color)

  const pickHue = (e) => {
    const rect = hueRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const h = Math.round(ratio * 359.99)
    onChange(hsvToHex(h, hsv.s, hsv.v))
  }

  const pickSV = (e) => {
    const rect = svRef.current.getBoundingClientRect()
    const s = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)))
    const vv = Math.max(0, Math.min(100, Math.round(100 - ((e.clientY - rect.top) / rect.height) * 100)))
    onChange(hsvToHex(hsv.h, s, vv))
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      if (dragging === 'hue') pickHue(e)
      else pickSV(e)
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  })

  const hueBarBg = Array.from({ length: 7 }, (_, i) => hsvToHex(i * 60, 100, 100)).join(', ')

  return (
    <div className="flex flex-col items-center gap-3" style={{ touchAction: 'none' }}>
      <div
        ref={svRef}
        className="relative cursor-crosshair rounded-lg"
        style={{ width: 140, height: 110, background: hsvToHex(hsv.h, 100, 100) }}
        onMouseDown={(e) => { e.preventDefault(); setDragging('sv'); pickSV(e) }}
      >
        <div className="absolute inset-0 rounded-lg" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
        <div className="absolute inset-0 rounded-lg" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      <div
        ref={hueRef}
        className="relative cursor-pointer rounded-full"
        style={{
          width: 140, height: 14,
          background: `linear-gradient(to right, ${hueBarBg})`,
        }}
        onMouseDown={(e) => { e.preventDefault(); setDragging('hue'); pickHue(e) }}
      >
        <div
          className="absolute w-2 h-5 rounded-sm border-2 border-white pointer-events-none"
          style={{
            top: -3,
            left: `${(hsv.h / 360) * 100}%`,
            transform: 'translateX(-50%)',
            backgroundColor: hsvToHex(hsv.h, 100, 100),
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md border border-white/10" style={{ backgroundColor: color }} />
        <input
          type="text"
          value={color}
          onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value) }}
          className="w-20 text-center text-[10px] rounded-lg px-1.5 py-1 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono' }}
        />
      </div>
    </div>
  )
}

export default function TierMaker() {
  const { user } = useContext(AuthContext)
  const [allAnime, setAllAnime] = useState([])
  const [loading, setLoading] = useState(true)
  const [tiers, setTiers] = useState(DEFAULT_TIERS.map((t) => ({ ...t, items: [] })))
  const [pool, setPool] = useState([])
  const [search, setSearch] = useState('')
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragSource, setDragSource] = useState(null)
  const [dragOverTierId, setDragOverTierId] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [editingTier, setEditingTier] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('')
  const [tierListName, setTierListName] = useState('Мой Tier List')
  const [savedLists, setSavedLists] = useState([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const editingRef = useRef(null)
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

  useEffect(() => {
    if (!editingTier) return
    const handler = (e) => {
      if (editingRef.current && !editingRef.current.contains(e.target)) {
        saveEditTier()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editingTier, editingName, editingColor])

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

  const handleDropOnTier = (tierId, insertIndex = null) => {
    if (!draggedItem) return
    if (dragSource === 'pool') {
      setPool((p) => p.filter((a) => a.id !== draggedItem.id))
      setTiers((prev) => prev.map((t) => {
        if (t.id !== tierId) return t
        const items = [...t.items]
        const idx = insertIndex !== null ? insertIndex : items.length
        items.splice(idx, 0, draggedItem)
        return { ...t, items }
      }))
    } else if (dragSource.startsWith('tier-')) {
      const sourceTierId = dragSource.replace('tier-', '')
      if (sourceTierId === tierId) {
        setTiers((prev) => prev.map((t) => {
          if (t.id !== tierId) return t
          const items = [...t.items]
          const fromIdx = items.findIndex((a) => a.id === draggedItem.id)
          if (fromIdx === -1) return t
          items.splice(fromIdx, 1)
          const toIdx = insertIndex !== null ? insertIndex : items.length
          items.splice(toIdx, 0, draggedItem)
          return { ...t, items }
        }))
      } else {
        setTiers((prev) => prev.map((t) => {
          if (t.id === sourceTierId) return { ...t, items: t.items.filter((a) => a.id !== draggedItem.id) }
          if (t.id === tierId) {
            const items = [...t.items]
            const idx = insertIndex !== null ? insertIndex : items.length
            items.splice(idx, 0, draggedItem)
            return { ...t, items }
          }
          return t
        }))
      }
    }
    setDraggedItem(null)
    setDragSource(null)
    setDragOverTierId(null)
    setDragOverIndex(null)
  }

  const handleDropOnPool = () => {
    if (!draggedItem || dragSource === 'pool') { setDraggedItem(null); setDragSource(null); setDragOverTierId(null); setDragOverIndex(null); return }
    const sourceTierId = dragSource.replace('tier-', '')
    setTiers((prev) => prev.map((t) =>
      t.id === sourceTierId ? { ...t, items: t.items.filter((a) => a.id !== draggedItem.id) } : t
    ))
    setPool((p) => [...p, draggedItem])
    setDraggedItem(null)
    setDragSource(null)
    setDragOverTierId(null)
    setDragOverIndex(null)
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
                {editingTier === tier.id ? (
                  <div
                    ref={editingRef}
                    className="flex flex-col items-center gap-2 p-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="tier-badge"
                      style={{ backgroundColor: editingColor + '18', border: `1px solid ${editingColor}30`, color: editingColor }}
                    >
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditTier()}
                        className="w-8 h-6 bg-black/30 text-center text-xs font-bold rounded outline-none"
                        autoFocus
                        maxLength={4}
                        style={{ color: editingColor }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-[90px] justify-center">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditingColor(c)}
                          className="w-4 h-4 rounded-full transition-all duration-150"
                          style={{
                            backgroundColor: c,
                            boxShadow: editingColor === c ? `0 0 0 2px rgba(255,255,255,0.3)` : 'none',
                            transform: editingColor === c ? 'scale(1.25)' : 'scale(1)',
                          }}
                        />
                      ))}
                    </div>
                    <ColorPicker color={editingColor} onChange={setEditingColor} />
                  </div>
                ) : (
                  <>
                    <div
                      className="tier-badge cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: tier.color + '18', border: `1px solid ${tier.color}30`, color: tier.color }}
                      onClick={() => startEditTier(tier)}
                    >
                      {tier.name}
                    </div>
                    <div className="flex gap-0.5">
                      <button onClick={() => moveTier(tier.id, 'up')} className="text-[10px] hover:text-white/40 transition-colors" style={{ color: 'rgba(255,255,255,0.1)' }}>▲</button>
                      <button onClick={() => moveTier(tier.id, 'down')} className="text-[10px] hover:text-white/40 transition-colors" style={{ color: 'rgba(255,255,255,0.1)' }}>▼</button>
                    </div>
                  </>
                )}
              </div>

              <div
                className="flex-1 min-h-[60px] rounded-xl p-1.5 flex items-center gap-1.5 overflow-x-auto"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                onDragOver={handleDragOver}
                onDragLeave={() => { setDragOverTierId(null); setDragOverIndex(null) }}
                onDrop={(e) => { e.preventDefault(); handleDropOnTier(tier.id) }}
              >
                {tier.items.length === 0 && (
                  <span className="text-[10px] mx-auto" style={{ color: 'rgba(255,255,255,0.08)' }}>Перетащи сюда</span>
                )}
                {tier.items.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    className="flex items-center flex-shrink-0"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverTierId(tier.id); setDragOverIndex(itemIdx) }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropOnTier(tier.id, itemIdx) }}
                  >
                    {dragOverTierId === tier.id && dragOverIndex === itemIdx && draggedItem && item.id !== draggedItem?.id && (
                      <div className="w-0.5 h-10 bg-amber-400 rounded-full mr-0.5 animate-pulse flex-shrink-0" />
                    )}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(item, `tier-${tier.id}`)}
                      className="cursor-grab active:cursor-grabbing group/item relative"
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
                  </div>
                ))}
                {dragOverTierId === tier.id && dragOverIndex === tier.items.length && draggedItem && (
                  <div className="w-0.5 h-10 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                )}
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
