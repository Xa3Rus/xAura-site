import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  const [battleRank, setBattleRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ratings')

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
      const best = Math.max(...scores)
      setBattleStats({
        best,
        total: scores.length,
        avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      })

      const { data: allGames } = await supabase
        .from('battle_games')
        .select('user_id, score')
        .order('score', { ascending: false })
        .limit(200)

      if (allGames?.length) {
        const bestByUser = {}
        for (const g of allGames) {
          if (!bestByUser[g.user_id] || g.score > bestByUser[g.user_id]) {
            bestByUser[g.user_id] = g.score
          }
        }
        const sorted = Object.entries(bestByUser)
          .sort((a, b) => b[1] - a[1])
        const rank = sorted.findIndex(([uid]) => uid === user.id)
        if (rank !== -1) setBattleRank(rank + 1)
      }
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

  const avgScore = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + (r.average_score || 0), 0) / ratings.length).toFixed(1)
    : '—'

  const stats = [
    { label: 'В рейтинге', value: battleRank ? `#${battleRank}` : '—', color: 'text-yellow-300' },
  ]

  const tabs = [
    { id: 'ratings', label: 'Оценки', count: ratings.length },
    { id: 'tierlists', label: 'Tier Lists', count: tierLists.length },
    { id: 'battle', label: 'Битва', count: battleStats?.total ?? 0 },
  ]

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 p-[2px]">
                  <div className="w-full h-full rounded-2xl bg-dark-800 flex items-center justify-center">
                    <span className="text-3xl font-black text-purple-400">{getAvatarLetter()}</span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-dark-700" />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-black mb-1">{user?.username}</h1>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-8 relative">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 leading-tight">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 mb-6 bg-dark-800/40 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Загрузка...</div>
        ) : (
          <>
            {activeTab === 'ratings' && (
              <div>
                {ratings.length === 0 ? (
                  <div className="text-center py-16 glass-card animate-fade-in">
                    <p className="text-gray-400 mb-4">Вы ещё не оценили ни одного аниме.</p>
                    <Link to="/catalog" className="gradient-btn">Перейти к каталогу</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {ratings.map((rating, index) => (
                      <motion.div
                        key={rating.id}
                        className="glass-card overflow-hidden group hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
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
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tierlists' && (
              <div>
                {tierLists.length === 0 ? (
                  <div className="text-center py-16 glass-card animate-fade-in">
                    <p className="text-gray-400 mb-4">У вас пока нет сохранённых Tier List</p>
                    <Link to="/tiermaker" className="gradient-btn">Создать Tier List</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tierLists.map((list, index) => {
                      const tiers = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
                      return (
                        <motion.div
                          key={list.id}
                          className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-purple-500/30 transition-all"
                          onClick={() => navigate(`/tierlist/${list.id}`)}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
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
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'battle' && (
              <div>
                {!battleStats ? (
                  <div className="text-center py-16 glass-card animate-fade-in">
                    <p className="text-gray-400 mb-4">Вы ещё не играли в Битву</p>
                    <Link to="/battle" className="gradient-btn">Начать битву</Link>
                  </div>
                ) : (
                  <div className="glass-card p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-black text-purple-400 mb-2">{battleStats.best}</div>
                        <div className="text-sm text-gray-400">Лучший результат</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-black text-cyan-400 mb-2">{battleStats.total}</div>
                        <div className="text-sm text-gray-400">Всего игр</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-black text-green-400 mb-2">{battleStats.avg}</div>
                        <div className="text-sm text-gray-400">Средний счёт</div>
                      </div>
                    </div>
                    <div className="text-center mt-8">
                      <Link to="/battle" className="gradient-btn">Играть</Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
