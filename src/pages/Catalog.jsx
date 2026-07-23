import { useState, useEffect, useMemo, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [showNsfw, setShowNsfw] = useState(false)
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
    return filterAnime(allAnime, { search, year, genre, sort, showNsfw })
  }, [allAnime, search, year, genre, sort, showNsfw])

  const displayAnime = useMemo(() => {
    return filtered.slice(0, page * ITEMS_PER_PAGE)
  }, [filtered, page])

  const hasMore = displayAnime.length < filtered.length

  useEffect(() => { setPage(1) }, [search, year, genre, sort, showNsfw])

  const isNsfw = (item) => item.rating === 'r_plus' || item.rating === 'rx' || item.genres?.some((g) => g.name === 'Hentai')
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

  const years = Array.from({ length: 26 }, (_, i) => 2025 - i)

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black mb-2 animate-slide-up">Каталог аниме</h1>
        <p className="text-gray-400 mb-8 animate-slide-up">Найди и оцени свои любимые тайтлы ({filtered.length} тайтлов)</p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up">
          <input type="text" placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field flex-1" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-full sm:w-48">
            <option value="score">По рейтингу</option>
            <option value="name">По названию</option>
            <option value="aired_on">По дате</option>
            <option value="episodes">По эпизодам</option>
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="input-field w-full sm:w-40">
            <option value="">Все годы</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field w-full sm:w-48">
            <option value="">Все жанры</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${showNsfw ? 'bg-purple-500' : 'bg-dark-600'}`} onClick={() => setShowNsfw(!showNsfw)}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${showNsfw ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-400">NSFW</span>
          </label>
        </div>

        {loading ? <Loader text="Загрузка каталога..." /> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayAnime.map((item) => {
                const myRating = ratingsMap[item.id]
                return (
                  <div key={item.id} className="glass-card overflow-hidden group hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {item.image?.original && !item.image.original.includes('missing_') ? (
                        <img
                          src={`https://shikimori.io${item.image.original}`}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-dark-600 items-center justify-center ${item.image?.original && !item.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                        <span className="text-gray-500 text-4xl font-bold">{(item.russian || item.name || '?')[0]}</span>
                      </div>
                      {isNsfw(item) && (
                        <div className="absolute top-2 right-2 bg-red-500/90 text-white text-xs px-2 py-1 rounded-lg font-medium">NSFW</div>
                      )}
                      {myRating && (
                        <div className="absolute top-2 left-2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded-lg font-bold">
                          {myRating.average_score?.toFixed(1)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-3 gap-1.5">
                        {quickRatingId === item.id ? (
                          <div className="flex flex-wrap justify-center gap-1 px-2">
                            {[1,2,3,4,5,6,7,8,9,10].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleQuickRate(item, s)}
                                className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                                  s <= 4 ? 'bg-red-500/80 hover:bg-red-500' :
                                  s <= 6 ? 'bg-yellow-500/80 hover:bg-yellow-500 text-dark-900' :
                                  'bg-green-500/80 hover:bg-green-500 text-dark-900'
                                }`}
                              >{s}</button>
                            ))}
                            <button onClick={() => setQuickRatingId(null)} className="w-7 h-7 rounded text-xs bg-white/10 hover:bg-white/20">✕</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setQuickRatingId(item.id)}
                              className="text-xs !px-3 !py-1.5 !rounded-lg bg-purple-500/80 hover:bg-purple-500 text-white transition-all"
                            >
                              {myRating ? 'Быстро' : 'Оценить'}
                            </button>
                            <button
                              onClick={() => handleRate(item)}
                              className="text-xs !px-3 !py-1.5 !rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                            >
                              Подробно
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate mb-2">{item.russian || item.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <span>{item.aired_on?.split('-')[0] || '—'}</span>
                        {item.score > 0 && <span className="text-purple-400">★ {item.score}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getGenres(item).map((g) => (
                          <span key={g} className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-lg">{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button onClick={() => setPage((p) => p + 1)} className="gradient-btn">Загрузить ещё</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
