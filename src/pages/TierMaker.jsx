import { useState, useEffect, useContext, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import Loader from '../components/Loader'
import { loadAnimeData } from '../utils/animeData'
import { loadFoodData, parseTierMakerUrl, loadTierMakerTemplate } from '../utils/foodData'
import { shikimoriImg } from '../utils/imgUrl'

const PRESET_COLORS = [
  '#FF2D78', '#FF8A33', '#D4F785', '#BBF351', '#00CC88', '#00E5FF',
  '#BF5AF2', '#FF6688', '#9EDB3E', '#66F0FF', '#FF5C93', '#707070',
]

const DEFAULT_TIERS = [
  { id: 's', name: 'S', color: '#FF2D78', items: [] },
  { id: 'a', name: 'A', color: '#FF8A33', items: [] },
  { id: 'b', name: 'B', color: '#D4F785', items: [] },
  { id: 'c', name: 'C', color: '#BBF351', items: [] },
  { id: 'd', name: 'D', color: '#00E5FF', items: [] },
  { id: 'f', name: 'F', color: '#707070', items: [] },
]

// Карточка тир-листа: без картинки рендерит заглушку сразу,
// битая картинка подменяется состоянием, а не трюками с DOM
function TierCard({ src, name, hoverClass = '' }) {
  const [broken, setBroken] = useState(false)
  return (
    <div
      className={`w-16 h-20 rounded-md overflow-hidden flex items-center justify-center bg-surface-2 transition-all duration-200 ${hoverClass}`}
      title={name}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={name || ''}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="text-sm font-bold text-text-muted">{name?.[0]?.toUpperCase() || '?'}</span>
      )}
    </div>
  )
}

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
          className="w-20 text-center text-[10px] rounded-lg px-1.5 py-1 outline-none bg-surface-2 border border-neon-400/10 text-text-secondary"
          style={{ fontFamily: 'Source Code Pro' }}
        />
      </div>
    </div>
  )
}

export default function TierMaker() {
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const [allAnime, setAllAnime] = useState([])
  const [allFood, setAllFood] = useState([])
  // Импортированный шаблон применяется в initial state, а не в эффекте:
  // эффект загрузки данных в первом коммите ещё видит старый тип 'anime'
  // и успевает перезаписать пул аниме-топом поверх импорта
  const importedAtMount = location.state?.importedTemplate
  const [loading, setLoading] = useState(!importedAtMount)
  const [tiers, setTiers] = useState(DEFAULT_TIERS.map((t) => ({ ...t, items: [] })))
  const [pool, setPool] = useState(() => importedAtMount?.items || [])
  const [search, setSearch] = useState('')
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragSource, setDragSource] = useState(null)
  const [dragOverTierId, setDragOverTierId] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [editingTier, setEditingTier] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('')
  const [tierListName, setTierListName] = useState(() => importedAtMount?.title || 'Мой Tier List')
  const [savedLists, setSavedLists] = useState([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [showAddSearch, setShowAddSearch] = useState(false)
  const [addResults, setAddResults] = useState([])
  const [poolItemMenu, setPoolItemMenu] = useState(null)
  const [poolItemMenuPos, setPoolItemMenuPos] = useState({ x: 0, y: 0 })
  const [tierListType, setTierListType] = useState(() => importedAtMount ? 'custom' : 'anime')
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const editingRef = useRef(null)
  const poolRef = useRef(null)
  const addSearchRef = useRef(null)
  const poolItemMenuRef = useRef(null)

  const autoSavedImportRef = useRef(false)
  useEffect(() => {
    if (importedAtMount && user && !autoSavedImportRef.current) {
      autoSavedImportRef.current = true
      saveImportedList(importedAtMount.title, importedAtMount.items)
    }
  }, [user])

  useEffect(() => {
    const state = location.state
    if (state?.templateType) {
      setTierListType(state.templateType)
      if (state.templateType === 'food') setTierListName('Мой Food Tier List')
      else setTierListName('Мой Tier List')
    }
    // импортированный шаблон уже применён в initial state —
    // повторно перезаписывать пул здесь нельзя, это стирало импорт
    if (state) window.history.replaceState({}, '')
  }, [location.state])

  useEffect(() => {
    if (tierListType === 'anime') {
      loadAnimeData().then(async (data) => {
        setAllAnime(data)
        const top500 = data
          .filter((a) => a.score > 0 && a.image?.original && !a.image.original.includes('missing_'))
          .sort((a, b) => Number(b.score) - Number(a.score))
          .slice(0, 500)
        setPool(top500)
        if (user) {
          const { data: lists } = await supabase.from('tier_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
          setSavedLists(lists || [])
        }
        setLoading(false)
      })
    } else if (tierListType === 'food') {
      loadFoodData().then(async (data) => {
        setAllFood(data)
        setPool(data)
        if (user) {
          const { data: lists } = await supabase.from('tier_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
          setSavedLists(lists || [])
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [user, tierListType])

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

  useEffect(() => {
    if (!showAddSearch) return
    const handler = (e) => {
      if (addSearchRef.current && !addSearchRef.current.contains(e.target)) {
        setShowAddSearch(false)
        setAddSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAddSearch])

  useEffect(() => {
    if (!poolItemMenu) return
    const handler = (e) => {
      if (poolItemMenuRef.current && !poolItemMenuRef.current.contains(e.target)) {
        setPoolItemMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [poolItemMenu])

  const sendToTier = (anime, tierId) => {
    setPool((p) => p.filter((a) => a.id !== anime.id))
    setTiers((prev) => prev.map((t) =>
      t.id === tierId ? { ...t, items: [...t.items, anime] } : t
    ))
    setPoolItemMenu(null)
  }

  useEffect(() => {
    if (addSearch.length < 2) { setAddResults([]); return }
    
    const poolIds = new Set(pool.map((a) => a.id))
    const tierIds = new Set(tiers.flatMap((t) => t.items.map((a) => a.id)))
    const q = addSearch.toLowerCase()
    
    if (tierListType === 'anime') {
      const results = allAnime.filter((a) => {
        if (poolIds.has(a.id) || tierIds.has(a.id)) return false
        if (!a.image?.original || a.image.original.includes('missing_')) return false
        return (a.name || '').toLowerCase().includes(q) || (a.russian || '').toLowerCase().includes(q)
      }).slice(0, 12)
      setAddResults(results)
    } else {
      const results = allFood.filter((a) => {
        if (poolIds.has(a.id) || tierIds.has(a.id)) return false
        return (a.name || '').toLowerCase().includes(q)
      }).slice(0, 12)
      setAddResults(results)
    }
  }, [addSearch, allAnime, allFood, pool, tiers, tierListType])

  const addAnimeToPool = (anime) => {
    setPool((p) => [...p, anime])
    setAddSearch('')
    setAddResults([])
  }

  const removeAnimeFromPool = (animeId) => {
    setPool((p) => p.filter((a) => a.id !== animeId))
  }

  const filteredPool = pool.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    if (tierListType === 'anime') {
      return (a.name || '').toLowerCase().includes(q) || (a.russian || '').toLowerCase().includes(q)
    }
    return (a.name || '').toLowerCase().includes(q)
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
    if (tier?.items.length > 0 && !confirm('Удалить тир?')) return
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
    // кастомные (импортированные) карточки хранятся объектами с картинкой —
    // их нет в каталогах аниме/еды, одним id их не восстановить
    const isCustom = tierListType === 'custom'
    const toStored = (a) => (isCustom ? { id: a.id, image: a.image, name: a.name } : a.id)
    const tiersData = tiers.map((t) => ({ id: t.id, name: t.name, color: t.color, items: t.items.map(toStored) }))
    const listData = {
      user_id: user.id,
      name: tierListName,
      tiers: isCustom && pool.length > 0
        ? { pool: pool.map(toStored), tiers: tiersData }
        : tiersData,
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

  const loadTierList = async (list) => {
    const raw = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
    const tiersData = Array.isArray(raw) ? raw : (raw?.tiers || [])
    const savedPool = Array.isArray(raw) ? [] : (raw?.pool || [])

    // элементы бывают из аниме- или еды-каталога (id не пересекаются:
    // у аниме числовые, у еды food_*, у импортов tm_), либо сохранены
    // объектами с собственной картинкой
    let sources = [...allAnime, ...allFood]
    const knownIds = new Set(sources.map((a) => a.id))
    const allStored = [...savedPool, ...tiersData.flatMap((t) => t.items || [])]
    const hasUnknown = allStored.some((it) => typeof it !== 'object' && !knownIds.has(it))
    if (hasUnknown && tierListType !== 'food' && allFood.length === 0) {
      const food = await loadFoodData()
      setAllFood(food)
      sources = [...sources, ...food]
    }
    const itemMap = new Map(sources.map((a) => [a.id, a]))
    const resolve = (it) => (typeof it === 'object' ? it : itemMap.get(it))

    const loadedTiers = tiersData.map((t) => ({
      ...t,
      items: (t.items || []).map(resolve).filter(Boolean),
    }))
    setTiers(loadedTiers)
    if (savedPool.length > 0) {
      setPool(savedPool.map(resolve).filter(Boolean))
      setTierListType('custom')
    }
    setTierListName(list.name)
  }

  // импорт сразу сохраняется в «Сохранённые Tier List» — с пулом карточек,
  // чтобы список отображался и загружался как обычный
  const saveImportedList = async (title, items) => {
    if (!user) return
    const stored = items.map((i) => ({ id: i.id, image: i.image, name: i.name }))
    const { data } = await supabase.from('tier_lists').insert({
      user_id: user.id,
      name: title || 'Импортированный Tier List',
      tiers: { pool: stored, tiers: DEFAULT_TIERS.map((t) => ({ id: t.id, name: t.name, color: t.color, items: [] })) },
    }).select().single()
    if (data) setSavedLists((prev) => [data, ...prev])
  }

  const deleteTierList = async (listId) => {
    if (!confirm('Удалить tier list?')) return
    await supabase.from('tier_lists').delete().eq('id', listId)
    setSavedLists((prev) => prev.filter((l) => l.id !== listId))
  }

  const handleImportTierMaker = async () => {
    const slug = parseTierMakerUrl(importUrl)
    if (!slug) {
      setImportError('Неверная ссылка. Вставьте ссылку tiermaker.com/create/...')
      return
    }
    
    setImportLoading(true)
    setImportError('')
    
    try {
      const { title, items } = await loadTierMakerTemplate(slug)
      if (items.length === 0) {
        setImportError('Шаблон не найден или пуст')
        setImportLoading(false)
        return
      }
      
      setPool(items)
      setTiers(DEFAULT_TIERS.map((t) => ({ ...t, items: [] })))
      setTierListType('custom')
      setTierListName(title)
      setImportUrl('')
      setShowImportModal(false)
      setImportSuccess(`Импортировано: ${title} · ${items.length} изображений`)
      setTimeout(() => setImportSuccess(''), 4000)
      await saveImportedList(title, items)
    } catch (err) {
      setImportError('Ошибка загрузки шаблона')
    }
    
    setImportLoading(false)
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader text="Загрузка..." /></div>

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="sticky top-14 z-30 -mx-5 sm:-mx-8 px-5 sm:px-8 py-2.5 mb-6 bg-surface-0/90 backdrop-blur-xl border-b border-neon-400/10 flex items-center justify-between gap-3 flex-wrap page-enter">
          <div className="flex items-center gap-4 min-w-0">
            <input
              value={tierListName}
              onChange={(e) => setTierListName(e.target.value)}
              className="text-xl font-bold bg-transparent outline-none pb-1 transition-colors"
              style={{ fontFamily: 'Quantico, Inter, sans-serif', borderBottom: '1px solid #1A1A1A' }}
            />
            {tierListType !== 'custom' && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setTierListType('anime'); setPool([]); setTiers(DEFAULT_TIERS.map((t) => ({ ...t, items: [] }))); setTierListName('Мой Tier List') }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    tierListType === 'anime' 
                      ? 'bg-neon-600/20 text-neon-400 border border-neon-600/30' 
                      : 'bg-surface-2 text-text-muted border border-neon-400/10 hover:bg-surface-3'
                  }`}
                >
                  Аниме
                </button>
                <button
                  onClick={() => { setTierListType('food'); setPool([]); setTiers(DEFAULT_TIERS.map((t) => ({ ...t, items: [] }))); setTierListName('Мой Food Tier List') }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    tierListType === 'food' 
                      ? 'bg-mint-500/20 text-mint-500 border border-mint-500/30' 
                      : 'bg-surface-2 text-text-muted border border-neon-400/10 hover:bg-surface-3'
                  }`}
                >
                  Еда
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setShowImportModal(true); setImportError('') }}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-85"
              style={{ background: 'rgba(191,90,242,0.15)', color: '#BF5AF2', border: '1px solid rgba(191,90,242,0.25)' }}
            >
              ↓ Импорт из TierMaker
            </button>
            <button onClick={() => setShowSaveDialog(true)} className="btn-primary btn-shine text-xs !py-2">Сохранить</button>
          </div>
        </div>

        {importSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="fixed bottom-5 right-5 z-40 rounded-xl px-4 py-3 bg-surface-1/95 backdrop-blur-md border border-success/30 text-xs text-success font-mono shadow-glow-neon max-w-xs"
          >
            ✓ {importSuccess}
          </motion.div>
        )}

        {showSaveDialog && (
          <div className="rounded-xl p-4 mb-6 page-enter bg-surface-1 border border-neon-400/10">
            <div className="flex items-center gap-3">
              <input value={tierListName} onChange={(e) => setTierListName(e.target.value)} className="input flex-1" placeholder="Название" />
              <button onClick={saveTierList} className="btn-primary btn-shine text-xs">Сохранить</button>
              <button onClick={() => setShowSaveDialog(false)} className="text-xs hover:text-text-muted text-text-secondary">Отмена</button>
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
                    className="flex flex-col items-center gap-2 p-2 rounded-xl bg-surface-1 border border-neon-400/10"
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
                      className="tier-badge cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{
                        background: `linear-gradient(180deg, ${tier.color}35, ${tier.color}12)`,
                        border: `1px solid ${tier.color}50`,
                        color: tier.color,
                        textShadow: `0 0 14px ${tier.color}70`,
                        boxShadow: `0 0 18px -6px ${tier.color}50`,
                      }}
                      onClick={() => startEditTier(tier)}
                    >
                      {tier.name}
                    </div>
                    <span className="font-mono text-[9px] text-text-subtle" title="Количество элементов">
                      {tier.items.length}
                    </span>
                    <div className="flex gap-0.5 mt-0.5">
                      <button onClick={() => moveTier(tier.id, 'up')} className="w-4 h-4 rounded flex items-center justify-center text-[8px] text-text-muted/60 hover:text-neon-400 hover:bg-neon-400/10 transition-all" title="Выше">▲</button>
                      <button onClick={() => moveTier(tier.id, 'down')} className="w-4 h-4 rounded flex items-center justify-center text-[8px] text-text-muted/60 hover:text-neon-400 hover:bg-neon-400/10 transition-all" title="Ниже">▼</button>
                    </div>
                  </>
                )}
              </div>

              <div
                className={`flex-1 min-h-[76px] rounded-xl p-1.5 flex flex-wrap items-center gap-1.5 border transition-all duration-200 ${
                  dragOverTierId === tier.id && draggedItem
                    ? 'bg-neon-400/[0.06] border-neon-400/40 shadow-glow-neon'
                    : 'bg-surface-2 border-neon-400/10'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={() => { setDragOverTierId(null); setDragOverIndex(null) }}
                onDrop={(e) => { e.preventDefault(); handleDropOnTier(tier.id) }}
              >
                {tier.items.length === 0 && (
                  <span className="text-[10px] mx-auto text-text-muted/50">
                    {tierListType === 'anime' ? 'Перетащи аниме сюда' : tierListType === 'food' ? 'Перетащи еду сюда' : 'Перетащи сюда'}
                  </span>
                )}
                {tier.items.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    className="flex items-center flex-shrink-0"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverTierId(tier.id); setDragOverIndex(itemIdx) }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropOnTier(tier.id, itemIdx) }}
                  >
                    {dragOverTierId === tier.id && dragOverIndex === itemIdx && draggedItem && item.id !== draggedItem?.id && (
                      <div className="w-0.5 h-16 bg-neon-400 rounded-full mr-0.5 animate-pulse flex-shrink-0" />
                    )}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(item, `tier-${tier.id}`)}
                      className="cursor-grab active:cursor-grabbing group/item relative"
                    >
                      <TierCard
                        src={
                          tierListType === 'anime'
                            ? shikimoriImg(item.image?.original)
                            : item.image
                        }
                        name={item.russian || item.name}
                        hoverClass={tierListType === 'anime'
                          ? 'group-hover/item:ring-1 group-hover/item:ring-neon-400/60 group-hover/item:scale-105'
                          : 'group-hover/item:ring-1 group-hover/item:ring-mint-400/60 group-hover/item:scale-105'}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setTiers((prev) => prev.map((t) =>
                            t.id === tier.id ? { ...t, items: t.items.filter((a) => a.id !== item.id) } : t
                          ))
                          setPool((p) => [...p, item])
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity"
                        style={{ background: 'rgba(255,45,120,0.9)' }}
                      >×</button>
                    </div>
                  </div>
                ))}
                {dragOverTierId === tier.id && dragOverIndex === tier.items.length && draggedItem && (
                  <div className="w-0.5 h-16 bg-neon-400 rounded-full animate-pulse flex-shrink-0" />
                )}
              </div>

              <button onClick={() => removeTier(tier.id)} className="w-5 h-5 rounded-md self-center flex items-center justify-center text-[10px] hover:text-danger hover:bg-danger/10 transition-all text-text-muted/40" title="Удалить тир">✕</button>
            </div>
          ))}
        </div>

        <button
          onClick={addTier}
          className="w-full rounded-xl border border-dashed border-neon-400/25 hover:border-neon-400/60 hover:bg-neon-400/[0.04] hover:text-neon-400 py-2.5 text-xs text-text-muted transition-all mb-6 flex items-center justify-center gap-1.5"
        >
          <span className="text-sm leading-none">+</span> Добавить тир
        </button>

        <div className="rounded-xl p-4 page-enter bg-surface-1 border border-neon-400/10">
          <div className="flex items-center gap-3 mb-3">
              <h3 className="font-bold text-sm neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
              {tierListType === 'anime' ? 'Пул аниме' : tierListType === 'food' ? 'Пул еды' : 'Пул изображений'}
            </h3>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Фильтр..." className="input !py-1.5 text-xs flex-1 max-w-xs" />
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] text-neon-400 bg-neon-400/10 border border-neon-400/15">{filteredPool.length}</span>
          </div>

          <div className="relative mb-3" ref={addSearchRef}>
            <div className="flex items-center gap-2">
              <input
                value={addSearch}
                onChange={(e) => { setAddSearch(e.target.value); setShowAddSearch(true) }}
                onFocus={() => setShowAddSearch(true)}
                placeholder={tierListType === 'anime' ? 'Добавить аниме из каталога...' : tierListType === 'food' ? 'Добавить еду из каталога...' : 'Поиск...'}
                className="input !py-1.5 text-xs flex-1"
              />
              <button onClick={() => setShowAddSearch(!showAddSearch)} className="text-neon-400 hover:text-neon-700 text-xs transition-colors whitespace-nowrap">
                + Из каталога
              </button>
            </div>
            {showAddSearch && addResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 max-h-64 overflow-y-auto rounded-xl z-50 bg-surface-1 border border-neon-400/10 shadow-xl">
                {addResults.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { addAnimeToPool(a); setShowAddSearch(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors text-left border-b border-neon-400/10 last:border-b-0"
                  >
                    {tierListType === 'anime' ? (
                      <>
                        {a.image?.original && !a.image.original.includes('missing_') ? (
                          <img src={shikimoriImg(a.image?.original) || ''} alt="" className="w-8 h-11 rounded-md object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-11 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-text-muted">{(a.russian || a.name || '?')[0]}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate text-text-secondary">{a.russian || a.name}</div>
                          <div className="text-[10px] text-text-muted" style={{ fontFamily: 'Source Code Pro' }}>{a.aired_on?.split('-')[0] || '—'} · ★ {Number(a.score).toFixed(2)}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <img src={a.image} alt="" className="w-8 h-11 rounded-md object-cover flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate text-text-secondary">{a.name}</div>
                          <div className="text-[10px] text-text-muted" style={{ fontFamily: 'Source Code Pro' }}>Еда</div>
                        </div>
                      </>
                    )}
                    <span className="text-neon-400 text-xs">+</span>
                  </button>
                ))}
              </div>
            )}
            {showAddSearch && addSearch.length >= 2 && addResults.length === 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 rounded-xl z-50 p-3 text-center bg-surface-1 border border-neon-400/10">
                <span className="text-xs text-text-muted">Ничего не найдено</span>
              </div>
            )}
          </div>

          <div
            ref={poolRef}
            className="flex flex-wrap gap-1.5 min-h-[88px] p-2 rounded-xl bg-surface-2/70 border border-dashed border-neon-400/20"
            onDragOver={handleDragOver}
            onDrop={handleDropOnPoolRef}
          >
            {filteredPool.length === 0 && (
              <span className="text-xs mx-auto self-center text-text-muted/50">
                {tierListType === 'anime' ? 'Нет аниме в пуле' : tierListType === 'food' ? 'Нет еды в пуле' : 'Нет изображений в пуле'}
              </span>
            )}
            {filteredPool.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item, 'pool')}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing group/pool relative"
              >
                <div className="relative">
                  <TierCard
                    src={
                      tierListType === 'anime'
                        ? shikimoriImg(item.image?.original)
                        : item.image
                    }
                    name={item.russian || item.name}
                    hoverClass={tierListType === 'anime'
                      ? 'group-hover/pool:ring-1 group-hover/pool:ring-neon-400/60 group-hover/pool:scale-105'
                      : 'group-hover/pool:ring-1 group-hover/pool:ring-mint-400/60 group-hover/pool:scale-105'}
                  />
                  {tierListType === 'anime' && (
                    <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] py-0.5 rounded-b-md truncate px-0.5" style={{ background: 'rgba(0,0,0,0.7)' }}>
                      {item.russian || item.name}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeAnimeFromPool(item.id) }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover/pool:opacity-100 transition-opacity"
                  style={{ background: 'rgba(255,45,120,0.9)' }}
                >×</button>
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setPoolItemMenuPos({ x: r.left, y: r.bottom + 4 }); setPoolItemMenu(poolItemMenu === item.id ? null : item.id) }}
                  className="absolute -top-1 -left-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover/pool:opacity-100 transition-opacity"
                  style={{ background: 'rgba(187,243,81,0.9)' }}
                >↓</button>
              </div>
            ))}
          </div>

          {poolItemMenu && (() => {
            const item = filteredPool.find((a) => a.id === poolItemMenu)
            if (!item) return null
            return createPortal(
              <div
                ref={poolItemMenuRef}
                className="fixed rounded-xl p-3 z-[9999] bg-surface-1 border border-neon-400/10 shadow-xl"
                style={{
                  left: poolItemMenuPos.x,
                  top: poolItemMenuPos.y,
                  maxWidth: '320px',
                }}
              >
                <p className="text-[10px] mb-2 text-text-muted">
                  Отправить <span className="text-text-secondary">{tierListType === 'anime' ? (item.russian || item.name) : item.name}</span> в тир:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => sendToTier(item, tier.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                      style={{ backgroundColor: tier.color + '20', color: tier.color, border: `1px solid ${tier.color}30` }}
                    >
                      {tier.name}
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )
          })()}
        </div>

        {savedLists.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-sm mb-3 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Сохранённые Tier List</h3>
            <div className="space-y-1.5">
              {savedLists.map((list) => {
                const raw = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
                const tiersData = Array.isArray(raw) ? raw : (raw?.tiers || [])
                const poolCount = Array.isArray(raw) ? 0 : (raw?.pool?.length || 0)
                return (
                  <div key={list.id} className="rounded-xl px-4 py-3 flex items-center gap-3 bg-surface-1 border border-neon-400/10">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{list.name}</h4>
                      <p className="text-[10px] text-text-muted" style={{ fontFamily: 'Source Code Pro' }}>{new Date(list.created_at).toLocaleDateString('ru')}</p>
                    </div>
                    <div className="flex gap-0.5 flex-wrap justify-end">
                      {poolCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-neon-400/10 text-neon-400 border border-neon-400/20 font-mono">
                          пул:{poolCount}
                        </span>
                      )}
                      {tiersData.filter((t) => t.items.length > 0).map((t) => (
                        <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: t.color + '15', color: t.color, border: `1px solid ${t.color}20` }}>
                          {t.name}:{t.items.length}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => loadTierList(list)} className="text-neon-400 hover:text-neon-700 text-xs transition-colors">Загрузить</button>
                    <button onClick={() => deleteTierList(list.id)} className="hover:text-danger text-xs transition-colors text-text-muted">Удалить</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showImportModal && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !importLoading && setShowImportModal(false)} />
            <motion.div
              className="relative rounded-2xl p-6 sm:p-8 w-full max-w-md bg-surface-1 border border-[#BF5AF2]/25 shadow-2xl overflow-hidden"
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#BF5AF2]/[0.12] rounded-full blur-[80px] pointer-events-none" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-4 bg-[#BF5AF2]/15 border border-[#BF5AF2]/30">
                  <svg className="w-6 h-6 text-[#BF5AF2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>

                <h2 className="text-lg font-bold text-center mb-1" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
                  Импорт из TierMaker
                </h2>
                <p className="text-xs text-text-muted text-center mb-5 leading-relaxed">
                  Найди шаблон на{' '}
                  <a href="https://tiermaker.com/" target="_blank" rel="noopener noreferrer" className="text-[#BF5AF2] hover:underline font-medium">
                    tiermaker.com
                  </a>{' '}
                  и вставь сюда ссылку — картинки подтянутся автоматически
                </p>

                <div className="relative mb-3">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <input
                    value={importUrl}
                    onChange={(e) => { setImportUrl(e.target.value); setImportError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && importUrl.trim() && !importLoading) handleImportTierMaker() }}
                    placeholder="https://tiermaker.com/create/..."
                    autoFocus
                    disabled={importLoading}
                    className="input !pl-10 !py-3 text-sm"
                  />
                </div>

                <div className="rounded-lg px-3 py-2 mb-4 bg-surface-2/60 border border-neon-400/10">
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    <span className="text-text-secondary font-medium">Поддерживаются ссылки:</span>
                    <br />tiermaker.com/create/… · /categories/… · /tier-lists/…
                    <br />или просто slug шаблона
                  </p>
                </div>

                {importError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-danger mb-3 text-center"
                  >
                    {importError}
                  </motion.p>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setShowImportModal(false)}
                    disabled={importLoading}
                    className="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium text-text-muted border border-surface-3 hover:bg-surface-2 transition-all disabled:opacity-40"
                  >
                    Отмена
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleImportTierMaker}
                    disabled={importLoading || !importUrl.trim()}
                    className="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, rgba(191,90,242,0.25), rgba(191,90,242,0.15))', color: '#D98BF7', border: '1px solid rgba(191,90,242,0.4)' }}
                  >
                    {importLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <motion.span
                          className="inline-block w-3 h-3 rounded-full border-2 border-[#BF5AF2]/30 border-t-[#BF5AF2]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                        />
                        Загрузка...
                      </span>
                    ) : 'Импортировать'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
