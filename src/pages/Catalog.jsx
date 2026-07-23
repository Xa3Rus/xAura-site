import { useState, useEffect, useMemo, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import Loader from '../components/Loader'
import { loadAnimeData, filterAnime } from '../utils/animeData'

const GENRES = [
  'Action', 'Adventure', 'Cars', 'Comedy', 'Dementia', 'Demons', 'Drama',
  'Ecchi', 'Fantasy', 'Game', 'Harem', 'Historical', 'Horror', 'Isekai',
  'Josei', 'Kids', 'Magic', 'Martial Arts', 'Mecha', 'Military', 'Music',
  'Mystery', 'Parody', 'Police', 'Psychological', 'Romance', 'Samurai',
  'School', 'Sci-Fi', 'Seinen', 'Shoujo', 'Shounen', 'Slice of Life',
  'Space', 'Sports', 'Super Power', 'Supernatural', 'Thriller', 'Vampire'
]

const ITEMS_PER_PAGE = 30

function scoreColor(score) {
  if (score >= 8) return 'bg-mint-500/25 text-mint-400 border-mint-500/30'
  if (score >= 7) return 'bg-amber-500/25 text-amber-400 border-amber-500/30'
  if (score >= 5.5) return 'bg-white/10 text-white/60 border-white/10'
  if (score >= 4) return 'bg-amber-500/15 text-amber-500/70 border-amber-500/15'
  return 'bg-coral-500/25 text-coral-400 border-coral-500/30'
}

export default function Catalog() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [allAnime, setAllAnime] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState('score')
  const [ratingsMap, setRatingsMap] = useState({})
  const [quickRatingId, setQuickRatingId] = useState(null)

  useEffect(() => {
    loadAnimeData().then((data) => {
      setAllAnime(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) loadRatings()
  }, [user])

  const loadRatings = async () => {
    const { data } = await supabase.from('ratings').select('anime_id, average_score, tier').eq('user_id', user.id)
    if (data) {
      const map = {}
      for (const r of data) map[r.anime_id] = r
      setRatingsMap(map)
    }
  }

  const filtered = useMemo(() => {
    return filterAnime(allAnime, { search, year, genre, sort })
  }, [allAnime, search, year, genre, sort])

  const displayAnime = useMemo(() => {
    return filtered.slice(0, page * ITEMS_PER_PAGE)
  }, [filtered, page])

  const hasMore = displayAnime.length < filtered.length

  useEffect(() => { setPage(1) }, [search, year, genre, sort])

  const getGenres = (item) => (item.genres || []).slice(0, 2).map((g) => g.name)

  const handleRate = (anime) => {
    navigate('/rate', { state: { selectedAnime: anime } })
  }

  const handleQuickRate = async (anime, score) => {
    if (!user) { navigate('/login'); return }
    const existing = ratingsMap[anime.id]

    if (existing) {
      await supabase.from('ratings').update({ average_score: score, drawing: 0, idea: 0, realization: 0, characters: 0, story: 0, emotional: 0 }).eq('user_id', user.id).eq('anime_id', anime.id)
    } else {
      await supabase.from('ratings').insert({
        user_id: user.id,
        anime_id: anime.id,
        anime_name: anime.russian || anime.name,
        anime_image: anime.image?.original ? `https://shikimori.io${anime.image.original}` : null,
        drawing: 0, idea: 0, realization: 0,
        characters: 0, story: 0, emotional: 0,
        average_score: score,
      })
    }
    setRatingsMap((prev) => ({ ...prev, [anime.id]: { anime_id: anime.id, average_score: score } }))
    setQuickRatingId(null)
  }

  const years = Array.from({ length: 32 }, (_, i) => 2026 - i)

  return (
    <div className="min-h-screen pt-20 pb-12 px-5 sm:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8 page-enter">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk' }}>Каталог</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{filtered.length.toLocaleString()} тайтлов</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mb-8 page-enter" style={{ animationDelay: '0.05s' }}>
          <div className="relative flex-1">
            <input type="text" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="input !pl-9" />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'rgba(255,255,255,0.15)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-full sm:w-40">
            <option value="score">По рейтингу</option>
            <option value="name">По названию</option>
            <option value="aired_on">По дате</option>
            <option value="episodes">По эпизодам</option>
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="input w-full sm:w-32">
            <option value="">Год</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input w-full sm:w-40">
            <option value="">Все жанры</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader text="Загрузка..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5">
              {displayAnime.map((item, index) => {
                const myRating = ratingsMap[item.id]
                return (
                  <motion.div
                    key={item.id}
                    className="card-hover overflow-hidden group"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.012, 0.35), ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-2xl bg-surface-3">
                      {item.image?.original && !item.image.original.includes('missing_') ? (
                        <img
                          src={`https://shikimori.io${item.image.original}`}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-surface-3 items-center justify-center ${item.image?.original && !item.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                        <span style={{ color: 'rgba(255,255,255,0.08)' }} className="text-3xl font-bold">{(item.russian || item.name || '?')[0]}</span>
                      </div>

                      {item.score > 0 && (
                        <div className={`absolute top-2 left-2 score-badge border backdrop-blur-md ${scoreColor(item.score)}`} style={{ fontFamily: 'JetBrains Mono' }}>
                          {Number(item.score).toFixed(2)}
                        </div>
                      )}

                      {myRating && (
                        <div className="absolute top-2 right-2 score-badge bg-amber-500/20 text-amber-400 border border-amber-500/20 backdrop-blur-md" style={{ fontFamily: 'JetBrains Mono' }}>
                          {myRating.average_score?.toFixed(2)}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex flex-col items-center justify-end pb-3 gap-1.5">
                        {quickRatingId === item.id ? (
                          <div className="flex flex-wrap justify-center gap-0.5 px-2">
                            {[1,2,3,4,5,6,7,8,9,10].map((s) => {
                              const colors = {
                                1: { bg: 'rgba(185,28,28,0.95)', text: '#fff' },
                                2: { bg: 'rgba(220,38,38,0.9)', text: '#fff' },
                                3: { bg: 'rgba(239,68,68,0.85)', text: '#fff' },
                                4: { bg: 'rgba(248,113,113,0.7)', text: '#fff' },
                                5: { bg: 'rgba(234,179,8,0.5)', text: '#fff' },
                                6: { bg: 'rgba(234,179,8,0.65)', text: '#fff' },
                                7: { bg: 'rgba(34,197,94,0.6)', text: '#fff' },
                                8: { bg: 'rgba(34,197,94,0.75)', text: '#fff' },
                                9: { bg: 'rgba(34,197,94,0.88)', text: '#fff' },
                                10: { bg: 'rgba(22,163,74,0.95)', text: '#fff' },
                              }
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleQuickRate(item, s)}
                                  className="w-7 h-7 rounded-lg text-[10px] font-bold transition-all duration-150 active:scale-90"
                                  style={{ fontFamily: 'JetBrains Mono', background: colors[s].bg, color: colors[s].text }}
                                >{s}</button>
                              )
                            })}
                            <button onClick={() => setQuickRatingId(null)} className="w-7 h-7 rounded-lg text-[10px] bg-white/[0.06] hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.4)' }}>✕</button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5 px-2">
                            <button
                              onClick={() => setQuickRatingId(item.id)}
                              className="text-[11px] !px-3 !py-1.5 !rounded-lg btn-primary"
                            >
                              {myRating ? 'Изменить' : 'Оценить'}
                            </button>
                            <button
                              onClick={() => handleRate(item)}
                              className="text-[11px] !px-3 !py-1.5 !rounded-lg btn-ghost"
                            >
                              Подробно
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5">
                      <h3 className="font-medium text-xs truncate mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{item.russian || item.name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>
                        <span>{item.aired_on?.split('-')[0] || '—'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getGenres(item).map((g) => (
                          <span key={g} className="tag">{g}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button onClick={() => setPage((p) => p + 1)} className="btn-primary">
                  Загрузить ещё
                </button>
              </div>
            )}
            {!hasMore && displayAnime.length > 0 && (
              <p className="text-center text-xs mt-12" style={{ color: 'rgba(255,255,255,0.1)' }}>Все {filtered.length.toLocaleString()} тайтлов загружены</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
