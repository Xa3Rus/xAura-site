import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

function getScoreColor(score) {
  if (score >= 8) return '#22d3ee'
  if (score >= 7) return '#c084fc'
  if (score >= 5.6) return '#22c55e'
  if (score >= 4.5) return '#4ade80'
  if (score >= 3) return '#fde047'
  return '#fca5a5'
}

function getScoreTextClass(score) {
  if (score >= 8) return 'text-cyan-400'
  if (score >= 7) return 'text-purple-300'
  if (score >= 5.6) return 'text-green-500'
  if (score >= 4.5) return 'text-green-400'
  if (score >= 3) return 'text-yellow-300'
  return 'text-red-300'
}

export default function Profile() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [ratings, setRatings] = useState([])
  const [tierLists, setTierLists] = useState([])
  const [battleStats, setBattleStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadData()
    else setLoading(false)
  }, [user])

  const loadData = async () => {
    const [ratingsRes, tierListsRes, battleRes] = await Promise.all([
      supabase.from('ratings').select('*').eq('user_id', user.id),
      supabase.from('tier_lists').select('*').eq('user_id', user.id),
      supabase.from('battle_games').select('score').eq('user_id', user.id),
    ])
    setRatings((ratingsRes.data || []).sort((a, b) => (b.average_score || 0) - (a.average_score || 0)))
    setTierLists(tierListsRes.data || [])
    if (battleRes.data?.length) {
      const scores = battleRes.data.map((g) => g.score)
      setBattleStats({
        best: Math.max(...scores),
        total: scores.length,
        avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      })
    }
    setLoading(false)
  }

  const handleDeleteRating = async (ratingId) => {
    if (!confirm('Удалить эту оценку?')) return
    await supabase.from('ratings').delete().eq('id', ratingId)
    setRatings((prev) => prev.filter((r) => r.id !== ratingId))
  }

  const handleDeleteTierList = async (listId) => {
    if (!confirm('Удалить tier list?')) return
    await supabase.from('tier_lists').delete().eq('id', listId)
    setTierLists((prev) => prev.filter((l) => l.id !== listId))
  }

  const getAvatarLetter = () => user?.username?.[0]?.toUpperCase() || 'U'

  const handleReRate = (rating) => {
    const anime = {
      id: rating.anime_id,
      name: rating.anime_name,
      russian: rating.anime_name,
      image: rating.anime_image ? { original: rating.anime_image.replace('https://shikimori.io', '') } : null,
    }
    navigate('/rate', { state: { selectedAnime: anime } })
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black mb-2 animate-slide-up">Личный кабинет</h1>
        <p className="text-gray-400 mb-8 animate-slide-up">Ваш профиль и оценки</p>

        <div className="glass-card p-6 mb-8 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-400">{getAvatarLetter()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.username}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 animate-slide-up">Мои Tier List ({tierLists.length})</h2>
        {loading ? (
          <div className="text-center py-16 text-gray-400">Загрузка...</div>
        ) : tierLists.length === 0 ? (
          <div className="text-center py-8 mb-8">
            <p className="text-gray-400 mb-4">У вас пока нет сохранённых Tier List</p>
            <Link to="/tiermaker" className="text-purple-400 hover:text-purple-300 transition-colors">Создать Tier List</Link>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {tierLists.map((list) => {
              const tiers = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
              return (
                <div key={list.id} className="glass-card p-4 flex items-center gap-4 animate-slide-up cursor-pointer hover:border-purple-500/30 transition-all" onClick={() => navigate(`/tierlist/${list.id}`)}>
                  <div className="flex gap-1 flex-shrink-0">
                    {tiers.filter((t) => t.items.length > 0).slice(0, 6).map((t) => (
                      <div key={t.id} className="flex -space-x-2">
                        {t.items.slice(0, 3).map((itemId, i) => (
                          <div key={i} className="w-8 h-8 rounded border-2 flex items-center justify-center text-[8px] font-bold" style={{ borderColor: t.color, backgroundColor: t.color + '20', color: t.color, zIndex: 3 - i }}>
                            {t.name}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{list.name}</h3>
                    <p className="text-xs text-gray-500">{new Date(list.created_at).toLocaleDateString('ru')}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {tiers.filter((t) => t.items.length > 0).map((t) => (
                      <span key={t.id} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: t.color + '20', color: t.color }}>
                        {t.name}:{t.items.length}
                      </span>
                    ))}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTierList(list.id) }} className="text-red-400 hover:text-red-300 text-sm flex-shrink-0">Удалить</button>
                </div>
              )
            })}
          </div>
        )}

        {battleStats && (
          <div className="glass-card p-6 mb-8 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">🎮 Battle статистика</h2>
                <div className="flex gap-6 text-sm text-gray-400">
                  <span>Лучший: <span className="text-purple-400 font-bold">{battleStats.best}</span></span>
                  <span>Всего игр: <span className="text-white font-bold">{battleStats.total}</span></span>
                  <span>Средний: <span className="text-cyan-400 font-bold">{battleStats.avg}</span></span>
                </div>
              </div>
              <Link to="/battle" className="gradient-btn text-sm !py-2">Играть</Link>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6 animate-slide-up">Мои оценки ({ratings.length})</h2>
        {ratings.length === 0 && !loading ? (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-gray-400 mb-4">Вы ещё не оценили ни одного аниме.</p>
            <Link to="/catalog" className="text-purple-400 hover:text-purple-300 transition-colors">Перейти к каталогу</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ratings.map((rating, index) => (
              <div
                key={rating.id}
                className="glass-card overflow-hidden group hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] animate-slide-up"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  {rating.anime_image ? (
                    <img
                      src={rating.anime_image}
                      alt={rating.anime_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-600 flex items-center justify-center text-gray-500 text-sm">Нет постера</div>
                  )}
                  <div
                    className="absolute top-2 left-2 text-white text-sm font-bold px-2 py-1 rounded-lg"
                    style={{ backgroundColor: getScoreColor(rating.average_score) + 'cc' }}
                  >
                    {rating.average_score?.toFixed(1)}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-4 gap-2">
                    {rating.drawing > 0 && (
                      <div className="text-[10px] text-gray-300 text-center px-2 leading-tight">
                        🎨 {rating.drawing} · 💡 {rating.idea} · ⚙️ {rating.realization}<br/>
                        👥 {rating.characters} · 📖 {rating.story} · 🔥 {rating.emotional}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReRate(rating)}
                        className="gradient-btn text-xs !px-3 !py-1.5 !rounded-lg"
                      >Подробнее</button>
                      <button
                        onClick={() => handleDeleteRating(rating.id)}
                        className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded-lg bg-dark-800/80 hover:bg-red-500/10 transition-all"
                      >Удалить</button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate mb-1">
                    {rating.anime_name || `Anime #${rating.anime_id}`}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={getScoreTextClass(rating.average_score)}>★ {rating.average_score?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
