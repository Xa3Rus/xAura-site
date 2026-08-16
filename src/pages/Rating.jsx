import { useState, useEffect, useCallback, useContext } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import Loader from '../components/Loader'
import Select from '../components/Select'
import { loadAnimeData, getRandomAnime } from '../utils/animeData'
import { shikimoriImg } from '../utils/imgUrl'

const SLIDERS = [
  { key: 'drawing', label: 'Рисовка', short: 'Рис.' },
  { key: 'idea', label: 'Идея', short: 'Ид.' },
  { key: 'realization', label: 'Реализация', short: 'Реал.' },
  { key: 'characters', label: 'Персонажи', short: 'Пер.' },
  { key: 'story', label: 'Сюжет', short: 'Сюж.' },
  { key: 'emotional', label: 'Эмоциональность', short: 'Эмоц.' },
]

function scoreColorValue(score) {
  if (score >= 8) return '#00CC88'
  if (score >= 7) return '#BBF351'
  if (score >= 5.5) return '#A0A0A0'
  return '#FF3366'
}

function scoreColorClass(score) {
  if (score >= 8) return 'text-success'
  if (score >= 7) return 'text-neon-400'
  if (score >= 5.5) return 'text-text-muted'
  return 'text-danger'
}

function ScoreGauge({ value }) {
  const r = 30
  const c = 2 * Math.PI * r
  const color = scoreColorValue(value)
  return (
    <div className="relative w-[84px] h-[84px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#1E1E1E" strokeWidth="7" />
        <motion.circle
          cx="42" cy="42" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 10) }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-xl leading-none" style={{ color }}>{value.toFixed(2)}</span>
        <span className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">из 10</span>
      </div>
    </div>
  )
}

async function fetchRatings(userId) {
  if (!userId) return []
  const { data } = await supabase.from('ratings').select('*').eq('user_id', userId)
  return data || []
}

export default function Rate() {
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const selectedFromCatalog = location.state?.selectedAnime || null

  const [allAnime, setAllAnime] = useState([])
  const [anime, setAnime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [scores, setScores] = useState({
    drawing: 5, idea: 5, realization: 5, characters: 5, story: 5, emotional: 5,
  })
  const [ratedIds, setRatedIds] = useState(new Set())

  useEffect(() => {
    loadAnimeData().then((data) => {
      setAllAnime(data)
      if (selectedFromCatalog) {
        const full = data.find((a) => a.id === selectedFromCatalog.id) || selectedFromCatalog
        setAnime(full)
        if (user) {
          fetchRatings(user.id).then((ratings) => {
            const existing = ratings.find((r) => r.anime_id === full.id)
            if (existing) {
              const hasDetails = existing.drawing > 0 || existing.idea > 0
              setScores({
                drawing: hasDetails ? existing.drawing : 5,
                idea: hasDetails ? existing.idea : 5,
                realization: hasDetails ? existing.realization : 5,
                characters: hasDetails ? existing.characters : 5,
                story: hasDetails ? existing.story : 5,
                emotional: hasDetails ? existing.emotional : 5,
              })
            }
          })
        }
      } else {
        setAnime(getRandomAnime(data))
      }
      setLoading(false)
    })
  }, [selectedFromCatalog?.id])

  useEffect(() => {
    if (user) {
      fetchRatings(user.id).then((ratings) => setRatedIds(new Set(ratings.map((r) => r.anime_id))))
    }
  }, [user])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    setSearchResults(allAnime.filter((a) =>
      (a.name || '').toLowerCase().includes(q) || (a.russian || '').toLowerCase().includes(q)
    ).slice(0, 20))
  }, [searchQuery, allAnime])

  const fetchRandomAnime = useCallback(() => {
    if (allAnime.length === 0) return
    setLoading(true)
    let attempts = 0
    let random
    do { random = getRandomAnime(allAnime, yearFrom, yearTo); attempts++ } while (ratedIds.has(random?.id) && attempts < 20)
    setAnime(random)
    setScores({ drawing: 5, idea: 5, realization: 5, characters: 5, story: 5, emotional: 5 })
    setLoading(false)
  }, [allAnime, yearFrom, yearTo, ratedIds])

  const selectAnime = (a) => {
    setAnime(a)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    if (user) {
      fetchRatings(user.id).then((ratings) => {
        const existing = ratings.find((r) => r.anime_id === a.id)
        if (existing) {
          const hasDetails = existing.drawing > 0 || existing.idea > 0
          setScores({
            drawing: hasDetails ? existing.drawing : 5,
            idea: hasDetails ? existing.idea : 5,
            realization: hasDetails ? existing.realization : 5,
            characters: hasDetails ? existing.characters : 5,
            story: hasDetails ? existing.story : 5,
            emotional: hasDetails ? existing.emotional : 5,
          })
        } else {
          setScores({ drawing: 5, idea: 5, realization: 5, characters: 5, story: 5, emotional: 5 })
        }
      })
    }
  }

  const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / 6
  const handleScoreChange = (key, value) => setScores((p) => ({ ...p, [key]: parseInt(value) }))

  const handleRate = async () => {
    if (!anime || !user) return
    setRatingLoading(true)

    const ratingData = {
      user_id: user.id,
      anime_id: anime.id,
      anime_name: anime.russian || anime.name,
      anime_image: shikimoriImg(anime.image?.original),
      drawing: scores.drawing,
      idea: scores.idea,
      realization: scores.realization,
      characters: scores.characters,
      story: scores.story,
      emotional: scores.emotional,
      average_score: averageScore,
    }

    const existing = (await supabase.from('ratings').select('id, tier').eq('user_id', user.id).eq('anime_id', anime.id)).data?.[0]

    if (existing) {
      await supabase.from('ratings').update(ratingData).eq('id', existing.id)
      ratingData.tier = existing.tier
    } else {
      const { data } = await supabase.from('ratings').insert(ratingData).select().single()
      if (data) ratingData.tier = data.tier
    }

    setRatedIds((p) => new Set([...p, anime.id]))
    setRatingLoading(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1800)
  }

  const years = Array.from({ length: 32 }, (_, i) => 2026 - i)

  const handleYearChange = (type, value) => {
    if (type === 'from') setYearFrom(value)
    else setYearTo(value)
    setLoading(true)
    setTimeout(() => {
      const from = type === 'from' ? value : yearFrom
      const to = type === 'to' ? value : yearTo
      let attempts = 0
      let random
      do { random = getRandomAnime(allAnime, from, to); attempts++ } while (ratedIds.has(random?.id) && attempts < 20)
      setAnime(random)
      setScores({ drawing: 5, idea: 5, realization: 5, characters: 5, story: 5, emotional: 5 })
      setLoading(false)
    }, 100)
  }

  const yearOptions = [{ value: '', label: 'любой' }, ...years.map((y) => ({ value: y, label: String(y) }))]

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-[15%] w-[420px] h-[420px] bg-neon-400/[0.05] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-[10%] w-[380px] h-[380px] bg-cyan-400/[0.04] rounded-full blur-[130px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-5 page-enter">
          <Link to="/catalog" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-neon-400 transition-colors group">
            <span className="inline-block group-hover:-translate-x-0.5 transition-transform">←</span> Каталог
          </Link>
          <span className="label !mb-0">Подробная оценка</span>
        </div>

        <motion.div
          className="rounded-2xl relative overflow-hidden bg-surface-0 border border-neon-400/10 shadow-soft glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-neon-400/[0.05] rounded-full blur-[90px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          {/* Тулбар */}
          <div className="relative flex flex-wrap items-center gap-2.5 p-4 sm:px-6 border-b border-neon-400/10 bg-surface-1/40">
            <div className="flex items-center gap-1.5">
              <span className="label">Годы</span>
              <Select value={yearFrom} onChange={(v) => handleYearChange('from', v)} options={yearOptions} className="!w-24" />
              <span className="text-text-subtle text-xs">—</span>
              <Select value={yearTo} onChange={(v) => handleYearChange('to', v)} options={yearOptions} className="!w-24" />
            </div>
            <div className="flex-1" />
            <button onClick={() => setShowSearch(!showSearch)} className="btn-ghost text-xs !py-1.5">
              {showSearch ? 'Закрыть поиск' : '⌕ Найти аниме'}
            </button>
            <button onClick={fetchRandomAnime} disabled={loading} className="btn-primary btn-shine text-xs !py-1.5">
              ⤫ Случайное
            </button>
          </div>

          {showSearch && (
            <div className="relative px-4 sm:px-6 py-3 border-b border-neon-400/10 bg-surface-1/40">
              <input type="text" placeholder="Введите название..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input" autoFocus />
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-72 overflow-y-auto rounded-xl bg-surface-1 border border-neon-400/10 shadow-neon-lg">
                  {searchResults.map((a) => (
                    <button key={a.id} onClick={() => selectAnime(a)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors text-left border-b border-neon-400/10 last:border-b-0">
                      {a.image?.original && !a.image.original.includes('missing_') ? <img src={shikimoriImg(a.image?.original) || ''} alt="" className="w-9 h-12 rounded-lg object-cover flex-shrink-0" /> : <div className="w-9 h-12 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0"><span className="text-sm font-bold text-text-subtle">{(a.russian || a.name || '?')[0]}</span></div>}
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate text-text-secondary">{a.russian || a.name}</div>
                        <div className="text-[10px] text-text-muted font-mono">{a.aired_on?.split('-')[0] || '—'} · ★ {a.score || '—'}</div>
                      </div>
                      {ratedIds.has(a.id) && <span className="text-[10px] text-success ml-auto flex-shrink-0">Оценено</span>}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-xs mt-2 text-text-subtle">Ничего не найдено</p>}
            </div>
          )}

          {loading ? <div className="py-24"><Loader text="Загрузка..." /></div> : anime ? (
            <div className="relative flex flex-col md:flex-row gap-6 p-4 sm:p-6">
              {/* Постер */}
              <div className="w-full md:w-56 flex-shrink-0">
                <div className="relative rounded-2xl overflow-hidden border border-neon-400/15 group">
                  {anime.image?.original && !anime.image.original.includes('missing_') ? (
                    <img src={shikimoriImg(anime.image?.original) || ''} alt={anime.name} className="w-full object-cover aspect-[3/4] bg-surface-2" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                  ) : null}
                  <div className={`w-full aspect-[3/4] bg-surface-2 items-center justify-center ${anime.image?.original && !anime.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                    <span className="text-4xl font-bold text-text-subtle" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{(anime.russian || anime.name || '?')[0]}</span>
                  </div>
                  {anime.score > 0 && (
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-neon-400/25 font-mono text-sm font-bold text-neon-400">
                      ★ {Number(anime.score).toFixed(2)}
                    </div>
                  )}
                  {ratedIds.has(anime.id) && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-success/15 border border-success/30 text-[9px] font-bold text-success uppercase tracking-wider backdrop-blur-md">
                      Оценено
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap gap-1">
                    {(anime.genres || []).slice(0, 3).map((g) => (
                      <span key={g.id || g.name} className="tag !text-[9px] !bg-black/50 !border-white/10 !text-white/80 backdrop-blur-sm">{g.russian || g.name}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Инфо + оценка */}
              <div className="flex-1 min-w-0">
                <span className="label block mb-1.5">{anime.aired_on?.split('-')[0] || '—'}{anime.rating ? ` · ${anime.rating}` : ''}{anime.episodes ? ` · ${anime.episodes} эп.` : ''}</span>
                <h1 className="text-2xl font-bold mb-5 neon-text leading-tight" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{anime.russian || anime.name}</h1>

                <div className="rounded-xl bg-surface-1/60 border border-neon-400/10 p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
                      Критерии <span className="text-text-subtle font-normal font-mono text-[10px]">1–10</span>
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {SLIDERS.map(({ key, label, short }) => (
                      <div key={key} className="flex items-center gap-3 group/slider">
                        <span className="text-xs w-28 hidden sm:block text-text-muted group-hover/slider:text-text-secondary transition-colors">{label}</span>
                        <span className="text-[10px] w-10 sm:hidden text-text-muted">{short}</span>
                        <input type="range" min="1" max="10" value={scores[key]} onChange={(e) => handleScoreChange(key, e.target.value)}
                          className="flex-1 rating-slider" style={{ '--val': `${((scores[key] - 1) / 9) * 100}%` }} />
                        <span className={`text-xs font-bold w-5 text-right font-mono transition-colors ${scoreColorClass(scores[key])}`}>{scores[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Итог */}
                <div className="rounded-xl bg-surface-1/60 border border-neon-400/10 p-4 flex items-center gap-5">
                  <ScoreGauge value={averageScore} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold mb-1">Итоговая оценка</div>
                    <p className="text-[10px] text-text-muted leading-relaxed">Среднее по шести критериям. Сохраняется в профиле и учитывается в тир-листах.</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button onClick={handleRate} disabled={ratingLoading} className="btn-primary btn-shine text-xs !py-2 disabled:opacity-40">
                        {ratingLoading ? 'Сохранение...' : ratedIds.has(anime.id) ? 'Переоценить' : 'Оценить'}
                      </button>
                      {justSaved && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-success"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Сохранено
                        </motion.span>
                      )}
                      <button onClick={fetchRandomAnime} disabled={loading} className="text-xs text-text-muted hover:text-neon-400 transition-colors ml-auto">
                        Следующее →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-center py-8 text-text-muted">Не удалось загрузить аниме</p>}
        </motion.div>
      </div>
    </div>
  )
}
