import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { loadAnimeData } from '../utils/animeData'
import { loadFoodData, parseTierMakerUrl, loadTierMakerTemplate } from '../utils/foodData'
import { shikimoriImg } from '../utils/imgUrl'
import Loader from '../components/Loader'

// Витрина собирается из популярных категорий TierMaker (по ~56 шаблонов
// на категорию, порядок внутри — по популярности)
const SHOWCASE_CATEGORIES = [
  { id: 'anime', label: 'аниме' },
  { id: 'video-games', label: 'игры' },
  { id: 'memes', label: 'мемы' },
]
const SHOWCASE_LIMIT = 100

function parseCategory(html, catLabel) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const items = []
  doc.querySelectorAll('.list-item').forEach((el) => {
    const a = el.querySelector("a[href^='/create/']")
    const img = el.querySelector('img')
    const header = el.querySelector('.cat-header')
    const count = el.querySelector('.image-count-container')
    if (!a || !img || !header) return

    const slug = a.getAttribute('href').replace('/create/', '')
    if (!slug) return

    let src = img.getAttribute('data-src') || img.getAttribute('src') || ''
    if (!src || src.includes('tiermaker-icon') || src.includes('tiermaker-logo')) return
    if (src.startsWith('https://tiermaker.com')) src = src.replace('https://tiermaker.com', '')
    if (!src.startsWith('/images')) return

    items.push({
      slug,
      title: header.textContent.trim(),
      count: count ? count.textContent.trim() : '',
      cat: catLabel,
      preview: `/tiermaker-api${src}`,
    })
  })
  return items
}

async function loadShowcase() {
  const pages = await Promise.all(
    SHOWCASE_CATEGORIES.map((c) =>
      fetch(`/tiermaker-api/categories/${c.id}`)
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => '')
    )
  )
  const seen = new Set()
  const items = []
  for (let i = 0; i < pages.length; i++) {
    for (const item of parseCategory(pages[i], SHOWCASE_CATEGORIES[i].label)) {
      if (seen.has(item.slug)) continue
      seen.add(item.slug)
      items.push(item)
    }
  }
  return items.slice(0, SHOWCASE_LIMIT)
}

const BUILTIN_TEMPLATES = [
  {
    id: 'anime',
    title: 'Аниме',
    desc: 'Топ-500 тайтлов Шикимори',
    type: 'anime',
    accent: 'neon',
  },
  {
    id: 'food',
    title: 'Еда',
    desc: 'Классический фуд-тирлист',
    type: 'food',
    accent: 'mint',
  },
]

const ACCENTS = {
  neon: {
    border: 'border-neon-400/25 hover:border-neon-400/70',
    glow: 'hover:shadow-glow-neon',
    text: 'text-neon-400',
    icon: (
      <svg className="w-6 h-6 text-neon-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 4v13a3 3 0 003 3h7a3 3 0 003-3V4M4 4h16M10 8h6M10 12h6M10 16h3" />
      </svg>
    ),
  },
  mint: {
    border: 'border-mint-400/25 hover:border-mint-400/70',
    glow: 'hover:shadow-glow-mint',
    text: 'text-mint-400',
    icon: (
      <svg className="w-6 h-6 text-mint-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 3v7a2 2 0 002 2h4a2 2 0 002-2V3M9 3v5m8-2v11a4 4 0 01-4 4h-1a4 4 0 01-4-4v-3" />
      </svg>
    ),
  },
}

export default function TierTemplatesSelect() {
  const navigate = useNavigate()
  const [previews, setPreviews] = useState({ anime: [], food: [] })
  const [showcase, setShowcase] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openingSlug, setOpeningSlug] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    Promise.all([
      loadAnimeData().then((d) =>
        d.filter((a) => a.image?.original && !a.image.original.includes('missing_'))
          .sort((a, b) => Number(b.score) - Number(a.score))
          .slice(0, 4)
          .map((a) => shikimoriImg(a.image.original)),
      ),
      loadFoodData().then((d) => d.slice(0, 4).map((f) => f.image)).catch(() => []),
      loadShowcase().catch(() => []),
    ]).then(([anime, food, tmShowcase]) => {
      setPreviews({ anime, food })
      setShowcase(tmShowcase)
      setLoading(false)
    })
  }, [])

  const openBuiltin = (tpl) => {
    navigate('/tiermaker', { state: { templateType: tpl.type } })
  }

  const openShowcase = async (tpl) => {
    if (openingSlug) return
    setOpeningSlug(tpl.slug)
    try {
      const { title, items } = await loadTierMakerTemplate(tpl.slug)
      if (!items.length) {
        setOpeningSlug(null)
        return
      }
      navigate('/tiermaker', { state: { importedTemplate: { title, items } } })
    } catch {
      setOpeningSlug(null)
    }
  }

  const handleImport = async () => {
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
      navigate('/tiermaker', { state: { importedTemplate: { title, items } } })
    } catch (err) {
      setImportError('Ошибка загрузки шаблона')
      setImportLoading(false)
    }
  }

  const filteredShowcase = useMemo(() => {
    if (!search.trim()) return showcase
    const q = search.trim().toLowerCase()
    return showcase.filter((t) => t.title.toLowerCase().includes(q))
  }, [showcase, search])

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[640px] h-[420px] bg-neon-400/[0.04] rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 page-enter"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <span className="label block mb-2">ВЫБЕРИ ОСНОВУ</span>
            <h1 className="text-3xl font-bold neon-text mb-1" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Тир-листы</h1>
            <p className="text-sm text-text-muted">готовые шаблоны, свои подборки или импорт с tiermaker.com</p>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск шаблона..."
              className="input !pl-9 !py-2.5 text-xs"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </motion.div>

        {/* Встроенные шаблоны + импорт */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10">
          {BUILTIN_TEMPLATES.map((tpl, i) => {
            const a = ACCENTS[tpl.accent]
            const shots = previews[tpl.id] || []
            return (
              <motion.button
                key={tpl.id}
                onClick={() => openBuiltin(tpl)}
                className={`relative rounded-2xl overflow-hidden bg-surface-1 border transition-all duration-300 group text-left hover:-translate-y-1 ${a.border} ${a.glow}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative h-32 bg-surface-2 overflow-hidden">
                  {shots.length > 0 ? (
                    <div className="absolute inset-0 flex">
                      {shots.slice(0, 4).map((src, j) => (
                        <img
                          key={j}
                          src={src}
                          alt=""
                          loading="lazy"
                          className="w-1/4 h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                          style={{ transitionDelay: `${j * 40}ms` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">{a.icon}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent" />
                </div>
                <div className="relative p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm mb-0.5 truncate" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{tpl.title}</h3>
                    <p className={`text-[10px] ${a.text} font-mono`}>{tpl.desc}</p>
                  </div>
                  <span className={`${a.text} text-sm opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300`}>→</span>
                </div>
              </motion.button>
            )
          })}

          <motion.button
            onClick={() => { setShowImportModal(true); setImportError('') }}
            className="relative rounded-2xl bg-surface-1/60 border border-dashed border-[#BF5AF2]/35 hover:border-[#BF5AF2]/80 hover:bg-[#BF5AF2]/[0.05] transition-all duration-300 group text-left hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="h-32 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#BF5AF2]/[0.07] to-transparent" />
              <motion.div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-[#BF5AF2]/15 border border-[#BF5AF2]/30"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg className="w-7 h-7 text-[#BF5AF2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </motion.div>
            </div>
            <div className="relative p-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm mb-0.5" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Из TierMaker</h3>
                <p className="text-[10px] text-[#BF5AF2] font-mono">импорт по ссылке</p>
              </div>
              <span className="text-[#BF5AF2] text-sm opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300">→</span>
            </div>
          </motion.button>
        </div>

        {/* Витрина шаблонов TierMaker */}
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="section-title !mb-0">Популярные шаблоны</h2>
          <span className="font-mono text-[10px] text-text-muted">
            {loading ? 'загрузка...' : `${filteredShowcase.length} шаблонов`}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-surface-1 border border-neon-400/10">
                <div className="h-24 bg-surface-2 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded bg-surface-3 animate-pulse w-3/4" />
                  <div className="h-2 rounded bg-surface-2 animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredShowcase.length === 0 ? (
          <div className="text-center py-14 rounded-2xl bg-surface-1 border border-neon-400/10">
            <p className="text-sm text-text-muted mb-1">Ничего не нашлось</p>
            <p className="text-xs text-text-subtle">импортируй шаблон по ссылке из tiermaker.com</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredShowcase.map((tpl, i) => (
              <motion.button
                key={tpl.slug}
                onClick={() => openShowcase(tpl)}
                className="relative rounded-2xl overflow-hidden bg-surface-1 border border-neon-400/10 hover:border-neon-400/50 transition-all duration-300 group text-left hover:-translate-y-1 hover:shadow-glow-neon"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative h-24 sm:h-28 bg-surface-2 overflow-hidden">
                  <img
                    src={tpl.preview}
                    alt={tpl.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.target.onerror = null; e.target.style.opacity = 0 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {tpl.cat && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-px rounded-md bg-black/70 backdrop-blur-sm font-mono text-[9px] text-text-muted border border-white/10">
                      {tpl.cat}
                    </span>
                  )}
                  {tpl.count && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-px rounded-md bg-black/70 backdrop-blur-sm font-mono text-[9px] text-neon-300 border border-neon-400/20">
                      {tpl.count} img
                    </span>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between gap-1.5">
                  <h3 className="font-medium text-xs truncate text-text-secondary group-hover:text-text transition-colors" title={tpl.title}>
                    {tpl.title}
                  </h3>
                  <span className="text-neon-400 text-xs opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300 shrink-0">→</span>
                </div>

                {openingSlug === tpl.slug && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <motion.span
                      className="inline-block w-6 h-6 rounded-full border-2 border-neon-400/30 border-t-neon-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}
              </motion.button>
            ))}
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
                  и вставь сюда ссылку — тир-лист откроется автоматически
                </p>

                <div className="relative mb-3">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <input
                    value={importUrl}
                    onChange={(e) => { setImportUrl(e.target.value); setImportError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && importUrl.trim() && !importLoading) handleImport() }}
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
                    onClick={handleImport}
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
                    ) : 'Открыть в конструкторе'}
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
