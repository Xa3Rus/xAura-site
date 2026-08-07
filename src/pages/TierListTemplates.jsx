import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import Loader from '../components/Loader'

const BUILT_IN_TEMPLATES = [
  {
    id: 'anime',
    slug: 'anime',
    title: 'Аниме',
    description: 'Топ-500 аниме по оценке Shikimori',
    imageCount: 500,
    category: 'Аниме',
    builtIn: true,
    preview: 'https://shikimori.one/system/anime/original/000/001/763/1716206665/64739.jpg',
  },
  {
    id: 'food',
    slug: '-16841250',
    title: 'Еда (Русская кухня)',
    description: '160 блюд русской и кавказской кухни с TierMaker',
    imageCount: 160,
    category: 'Еда',
    builtIn: true,
    preview: 'https://tiermaker.com/images/media/template_images/2024/16841250/-16841250/1.png',
  },
]

export default function TierListTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    const { data: imported } = await supabase
      .from('tier_templates')
      .select('*')
      .order('created_at', { ascending: false })

    const all = [...BUILT_IN_TEMPLATES]
    if (imported) {
      for (const t of imported) {
        if (!all.some((x) => x.slug === t.slug)) {
          all.push(t)
        }
      }
    }

    setTemplates(all)
    setLoading(false)
  }

  const categories = ['all', ...new Set(templates.map((t) => t.category))]

  const filtered = templates.filter((t) => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false
    if (search) {
      const q = search.toLowerCase()
      return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    }
    return true
  })

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center"><Loader text="Загрузка..." /></div>

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 page-enter">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Шаблоны Tier List</h1>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Выбери шаблон и начни составлять</p>
          </div>
          <Link
            to="/tiermaker"
            className="btn-primary text-xs !py-2"
          >
            Создать свой
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6 page-enter">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск шаблонов..."
            className="input flex-1 max-w-xs"
          />
          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10 hover:text-white/50'
                }`}
              >
                {cat === 'all' ? 'Все' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <div
              key={template.id || template.slug}
              className="group rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="relative h-40 overflow-hidden">
                {template.preview ? (
                  <img
                    src={template.preview}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(249,115,22,0.04) 100%)' }}>
                    <span className="text-3xl font-bold" style={{ color: 'rgba(255,255,255,0.05)', fontFamily: 'Space Grotesk' }}>
                      {(template.title || '?')[0]}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-bold text-white truncate">{template.title}</h3>
                </div>
                {template.builtIn && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/20">
                      Встроенный
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-[11px] mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {template.description || `${template.imageCount || '?'} изображений`}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono' }}>
                    {template.imageCount || '?'} изображений
                  </span>
                  {template.builtIn ? (
                    <Link
                      to="/tiermaker"
                      className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all"
                      style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.15)' }}
                      state={{ templateType: template.id }}
                    >
                      Открыть
                    </Link>
                  ) : (
                    <Link
                      to="/tiermaker"
                      className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.15)' }}
                      state={{ importSlug: template.slug }}
                    >
                      Использовать
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.15)' }}>Нет шаблонов</p>
          </div>
        )}
      </div>
    </div>
  )
}
