import { useState, useEffect, useCallback, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import Loader from '../components/Loader'
import { loadAnimeData, getRandomAnime } from '../utils/animeData'

const SLIDERS = [
  { key: 'drawing', label: 'Рисовка', icon: '🎨' },
  { key: 'idea', label: 'Идея', icon: '💡' },
  { key: 'realization', label: 'Реализация', icon: '⚙️' },
  { key: 'characters', label: 'Персонажи', icon: '👥' },
  { key: 'story', label: 'Сюжет', icon: '📖' },
  { key: 'emotional', label: 'Эмоциональность', icon: '🔥' },
]

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
      anime_image: anime.image?.original ? `https://shikimori.io${anime.image.original}` : null,
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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">С</span>
              <select
                value={yearFrom}
                onChange={(e) => handleYearChange('from', e.target.value)}
                className="input-field w-32"
              >
                <option value="">любой</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">По</span>
              <select
                value={yearTo}
                onChange={(e) => handleYearChange('to', e.target.value)}
                className="input-field w-32"
              >
                <option value="">любой</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => setShowSearch(!showSearch)} className="gradient-btn text-sm !py-2">
              {showSearch ? 'Закрыть поиск' : 'Найти аниме'}
            </button>
          </div>

          {showSearch && (
            <div className="mb-6">
              <input type="text" placeholder="Введите название..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field" autoFocus />
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-80 overflow-y-auto space-y-1">
                  {searchResults.map((a) => (
                    <button key={a.id} onClick={() => selectAnime(a)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-dark-600/60 transition-colors text-left">
                      {a.image?.original && !a.image.original.includes('missing_') ? <img src={`https://shikimori.io${a.image.original}`} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" /> : <div className="w-10 h-14 rounded bg-dark-600 flex items-center justify-center flex-shrink-0"><span className="text-gray-500 text-sm font-bold">{(a.russian || a.name || '?')[0]}</span></div>}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{a.russian || a.name}</div>
                        <div className="text-xs text-gray-400">{a.aired_on?.split('-')[0] || '—'} · ★ {a.score || '—'}</div>
                      </div>
                      {ratedIds.has(a.id) && <span className="text-xs text-green-400 ml-auto flex-shrink-0">Оценено</span>}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-gray-500 text-sm mt-2">Ничего не найдено</p>}
            </div>
          )}

          {loading ? <Loader text="Загрузка аниме..." /> : anime ? (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-64 flex-shrink-0">
                {anime.image?.original && !anime.image.original.includes('missing_') ? (
                  <img src={`https://shikimori.io${anime.image.original}`} alt={anime.name} className="w-full rounded-2xl object-cover aspect-[3/4]" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                ) : null}
                <div className={`w-full aspect-[3/4] rounded-2xl bg-dark-600 items-center justify-center ${anime.image?.original && !anime.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                  <span className="text-gray-500 text-5xl font-bold">{(anime.russian || anime.name || '?')[0]}</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black mb-2">{anime.russian || anime.name}</h2>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-sm text-gray-400 bg-dark-600/60 px-3 py-1 rounded-lg">{anime.aired_on?.split('-')[0] || '—'}</span>
                  {anime.rating && <span className="text-sm text-gray-400 bg-dark-600/60 px-3 py-1 rounded-lg">{anime.rating}</span>}
                  {anime.score > 0 && <span className="text-sm text-purple-400 bg-dark-600/60 px-3 py-1 rounded-lg">★ {Number(anime.score).toFixed(2)}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(anime.genres || []).map((g) => <span key={g.id || g.name} className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg">{g.name}</span>)}
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Поставить оценку</h3>
                  {SLIDERS.map(({ key, label, icon }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm w-36 flex items-center gap-2"><span>{icon}</span> {label}</span>
                      <input type="range" min="1" max="10" value={scores[key]} onChange={(e) => handleScoreChange(key, e.target.value)}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #7b2ff7 0%, #7b2ff7 ${(scores[key]-1)/9*100}%, #2a2a45 ${(scores[key]-1)/9*100}%, #2a2a45 100%)` }} />
                      <span className="text-sm font-medium text-purple-400 w-8 text-right">{scores[key]}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="font-semibold">Средняя: <span className="text-purple-400">{averageScore.toFixed(2)}</span></span>
                    <button onClick={handleRate} disabled={ratingLoading} className="gradient-btn disabled:opacity-50">
                      {ratingLoading ? 'Сохранение...' : ratedIds.has(anime.id) ? 'Переоценить' : 'Оценить'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : <p className="text-gray-400 text-center py-8">Не удалось загрузить аниме</p>}

          <div className="flex justify-center mt-6">
            <button onClick={fetchRandomAnime} disabled={loading} className="gradient-btn">Далее →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
