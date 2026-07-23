import { useState, useEffect, useCallback, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import Loader from '../components/Loader'
import Select from '../components/Select'
import { loadAnimeData, getRandomAnime } from '../utils/animeData'

const SLIDERS = [
  { key: 'drawing', label: 'Рисовка', short: 'Рис.' },
  { key: 'idea', label: 'Идея', short: 'Ид.' },
  { key: 'realization', label: 'Реализация', short: 'Реал.' },
  { key: 'characters', label: 'Персонажи', short: 'Пер.' },
  { key: 'story', label: 'Сюжет', short: 'Сюж.' },
  { key: 'emotional', label: 'Эмоциональность', short: 'Эмоц.' },
]

function scoreColorClass(score) {
  if (score >= 8) return 'text-mint-400'
  if (score >= 7) return 'text-amber-400'
  if (score >= 5.5) return 'text-white/50'
  return 'text-coral-400'
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

  const yearOptions = [{ value: '', label: 'любой' }, ...years.map((y) => ({ value: y, label: String(y) }))]

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/[0.015] rounded-full blur-[150px]" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="rounded-2xl p-5 sm:p-6 page-enter" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
            <div className="flex items-center gap-2">
              <span className="label">С</span>
              <Select value={yearFrom} onChange={(v) => handleYearChange('from', v)} options={yearOptions} className="w-28" />
            </div>
            <div className="flex items-center gap-2">
              <span className="label">По</span>
              <Select value={yearTo} onChange={(v) => handleYearChange('to', v)} options={yearOptions} className="w-28" />
            </div>
            <button onClick={() => setShowSearch(!showSearch)} className="btn-primary text-xs !py-2">
              {showSearch ? 'Закрыть' : 'Найти аниме'}
            </button>
          </div>

          {showSearch && (
            <div className="mb-5">
              <input type="text" placeholder="Введите название..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input" autoFocus />
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-72 overflow-y-auto rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {searchResults.map((a) => (
                    <button key={a.id} onClick={() => selectAnime(a)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors text-left border-b border-white/[0.03] last:border-b-0">
                      {a.image?.original && !a.image.original.includes('missing_') ? <img src={`https://shikimori.io${a.image.original}`} alt="" className="w-9 h-12 rounded-lg object-cover flex-shrink-0" /> : <div className="w-9 h-12 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0"><span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.15)' }}>{(a.russian || a.name || '?')[0]}</span></div>}
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{a.russian || a.name}</div>
                        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono' }}>{a.aired_on?.split('-')[0] || '—'} · ★ {a.score || '—'}</div>
                      </div>
                      {ratedIds.has(a.id) && <span className="text-[10px] text-mint-400 ml-auto flex-shrink-0">Оценено</span>}
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.12)' }}>Ничего не найдено</p>}
            </div>
          )}

          {loading ? <Loader text="Загрузка..." /> : anime ? (
            <div className="flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-52 flex-shrink-0">
                {anime.image?.original && !anime.image.original.includes('missing_') ? (
                  <img src={`https://shikimori.io${anime.image.original}`} alt={anime.name} className="w-full rounded-2xl object-cover aspect-[3/4] bg-surface-3" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                ) : null}
                <div className={`w-full aspect-[3/4] rounded-2xl bg-surface-3 items-center justify-center ${anime.image?.original && !anime.image.original.includes('missing_') ? 'hidden' : 'flex'}`}>
                  <span className="text-4xl font-bold" style={{ color: 'rgba(255,255,255,0.08)', fontFamily: 'Space Grotesk' }}>{(anime.russian || anime.name || '?')[0]}</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>{anime.russian || anime.name}</h2>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="tag" style={{ fontFamily: 'JetBrains Mono' }}>{anime.aired_on?.split('-')[0] || '—'}</span>
                  {anime.rating && <span className="tag">{anime.rating}</span>}
                  {anime.score > 0 && <span className="tag !bg-amber-500/10 !text-amber-400 !border-amber-500/15" style={{ fontFamily: 'JetBrains Mono' }}>★ {Number(anime.score).toFixed(2)}</span>}
                </div>
                <div className="flex flex-wrap gap-1 mb-5">
                  {(anime.genres || []).map((g) => <span key={g.id || g.name} className="tag">{g.name}</span>)}
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Оценка</h3>
                  {SLIDERS.map(({ key, label, short }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs w-28 hidden sm:block" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</span>
                      <span className="text-[10px] w-10 sm:hidden" style={{ color: 'rgba(255,255,255,0.25)' }}>{short}</span>
                      <input type="range" min="1" max="10" value={scores[key]} onChange={(e) => handleScoreChange(key, e.target.value)}
                        className="flex-1 rating-slider" style={{ '--val': `${((scores[key] - 1) / 9) * 100}%` }} />
                      <span className={`text-xs font-bold w-6 text-right ${scoreColorClass(scores[key])}`} style={{ fontFamily: 'JetBrains Mono' }}>{scores[key]}</span>
                    </div>
                  ))}
                  <div className="divider my-4" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Средняя: <span className={scoreColorClass(averageScore)} style={{ fontFamily: 'JetBrains Mono' }}>{averageScore.toFixed(2)}</span></span>
                    <button onClick={handleRate} disabled={ratingLoading} className="btn-primary text-xs !py-2 disabled:opacity-40">
                      {ratingLoading ? '...' : ratedIds.has(anime.id) ? 'Переоценить' : 'Оценить'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.15)' }}>Не удалось загрузить аниме</p>}

          <div className="flex justify-center mt-5">
            <button onClick={fetchRandomAnime} disabled={loading} className="btn-primary text-xs">Далее →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
