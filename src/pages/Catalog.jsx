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

function getScoreBadge(score) {
  if (score >= 8) return { bg: 'from-cyan-500/90 to-cyan-600/90', text: 'text-white' }
  if (score >= 7) return { bg: 'from-purple-500/90 to-purple-600/90', text: 'text-white' }
  if (score >= 5.5) return { bg: 'from-green-500/90 to-green-600/90', text: 'text-white' }
  if (score >= 4) return { bg: 'from-yellow-500/90 to-yellow-600/90', text: 'text-dark-900' }
  return { bg: 'from-red-500/90 to-red-600/90', text: 'text-white' }
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

  const getGenres = (item) => (item.genres || []).slice(0, 3).map((g) => g.name)

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
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 page-enter">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">Каталог аниме</h1>
          <p className="text-gray-500 text-sm">{filtered.length.toLocaleString()} тайтлов</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 page-enter" style={{ animationDelay: '0.1s' }}>
          <div className="relative flex-1">
            <input type="text" placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field !pl-10" />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-full sm:w-44">
            <option value="score">По рейтингу</option>
            <option value="name">По названию</option>
            <option value="aired_on">По дате</option>
            <option value="episodes">По эпизодам</option>
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="input-field w-full sm:w-36">
            <option value="">Все годы</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field w-full sm:w-44">
            <option value="">Все жанры</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader text="Загрузка каталога..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {displayAnime.map((item, index) => {
                const myRating = ratingsMap[item.id]
                const badge = getScoreBadge(item.score)
                return (
                  <motion.div
                    key={item.id}
                    className="catalog-card group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.5) }}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-2xl">
                      {item.image?.original && !item.image.original.includes('missing_') ? (
                        <img
                          src={`https://shikimori.io${item.image.original}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-dark-700 items-center justify-center ${item.image?.original && !item.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                        <span className="text-gray-500 text-4xl font-bold">{(item.russian || item.name || '?')[0]}</span>
                      </div>

                      {item.score > 0 && (
                        <div className={`absolute top-2 left-2 bg-gradient-to-r ${badge.bg} ${badge.text} text-[11px] px-2 py-0.5 rounded-md font-bold backdrop-blur-sm`}>
                          {Number(item.score).toFixed(2)}
                        </div>
                      )}

                      {myRating && (
                        <div className="absolute top-2 right-2 bg-purple-500/90 text-white text-[11px] px-2 py-0.5 rounded-md font-bold backdrop-blur-sm">
                          {myRating.average_score?.toFixed(2)}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end pb-3 gap-1.5">
                        {quickRatingId === item.id ? (
                          <div className="flex flex-wrap justify-center gap-1 px-2">
                            {[1,2,3,4,5,6,7,8,9,10].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleQuickRate(item, s)}
                                className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                                  s <= 4 ? 'bg-red-500/80 hover:bg-red-500 text-white' :
                                  s <= 6 ? 'bg-yellow-500/80 hover:bg-yellow-500 text-dark-900' :
                                  'bg-green-500/80 hover:bg-green-500 text-dark-900'
                                }`}
                              >{s}</button>
                            ))}
                            <button onClick={() => setQuickRatingId(null)} className="w-7 h-7 rounded-md text-xs bg-white/10 hover:bg-white/20 text-white">✕</button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5 px-2">
                            <button
                              onClick={() => setQuickRatingId(item.id)}
                              className="text-xs !px-3 !py-1.5 !rounded-lg bg-purple-500/90 hover:bg-purple-500 text-white transition-all font-medium"
                            >
                              {myRating ? 'Изменить' : 'Оценить'}
                            </button>
                            <button
                              onClick={() => handleRate(item)}
                              className="text-xs !px-3 !py-1.5 !rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all font-medium backdrop-blur-sm"
                            >
                              Подробно
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-3">
                      <h3 className="font-semibold text-xs sm:text-sm truncate mb-1.5 leading-tight">{item.russian || item.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-2">
                        <span>{item.aired_on?.split('-')[0] || '—'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getGenres(item).map((g) => (
                          <span key={g} className="text-[10px] bg-white/[0.04] text-gray-400 px-1.5 py-0.5 rounded-md">{g}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button onClick={() => setPage((p) => p + 1)} className="gradient-btn">
                  Загрузить ещё
                </button>
              </div>
            )}
            {!hasMore && displayAnime.length > 0 && (
              <p className="text-center text-gray-600 text-sm mt-10">Показаны все {filtered.length.toLocaleString()} тайтлов</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
