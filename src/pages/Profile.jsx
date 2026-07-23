import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

function scoreColor(score) {
  if (score >= 8) return 'bg-mint-500/15 text-mint-400 border-mint-500/20'
  if (score >= 7) return 'bg-amber-500/15 text-amber-400 border-amber-500/20'
  if (score >= 5.5) return 'bg-white/[0.06] text-white/50 border-white/[0.06]'
  return 'bg-coral-500/15 text-coral-400 border-coral-500/20'
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
        avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
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

  const tabs = [
    { id: 'ratings', label: 'Оценки', count: ratings.length },
    { id: 'tierlists', label: 'Tier Lists', count: tierLists.length },
    { id: 'battle', label: 'Битва', count: battleStats?.total ?? 0 },
  ]

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-[1400px] mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-mint-500/[0.02] rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(249,115,22,0.06) 100%)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <span className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'Space Grotesk' }}>{getAvatarLetter()}</span>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '2px solid #111114' }} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl font-bold tracking-tight mb-0.5" style={{ fontFamily: 'Space Grotesk' }}>{user?.username}</h1>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 relative">
              <div className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-xl font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono', textShadow: '0 0 15px rgba(251,191,36,0.15)' }}>{ratings.length}</div>
                <div className="label">Оценок</div>
              </div>
              <div className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-xl font-bold text-mint-400" style={{ fontFamily: 'JetBrains Mono', textShadow: '0 0 15px rgba(52,211,153,0.15)' }}>{battleRank ? `#${battleRank}` : '—'}</div>
                <div className="label">В рейтинге</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 relative"
              style={activeTab === tab.id ? {
                color: '#fbbf24',
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.12)',
              } : {
                color: 'rgba(255,255,255,0.25)',
                border: '1px solid transparent',
              }}
            >
              {tab.label} <span style={{ fontFamily: 'JetBrains Mono', opacity: 0.5 }}>({tab.count})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: 'rgba(255,255,255,0.15)' }}>Загрузка...</div>
        ) : (
          <>
            {activeTab === 'ratings' && (
              <div>
                {ratings.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Вы ещё не оценили ни одного аниме</p>
                    <Link to="/catalog" className="btn-primary text-xs">Перейти к каталогу</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                    {ratings.map((rating, index) => (
                      <motion.div
                        key={rating.id}
                        className="card-hover overflow-hidden group"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="aspect-[3/4] relative overflow-hidden rounded-t-2xl bg-surface-3">
                          {rating.anime_image ? (
                            <img
                              src={rating.anime_image}
                              alt={rating.anime_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.08)' }}>Нет</div>
                          )}
                          <div className={`absolute top-2 left-2 score-badge border backdrop-blur-md ${scoreColor(rating.average_score)}`} style={{ fontFamily: 'JetBrains Mono' }}>
                            {rating.average_score?.toFixed(2)}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-3 gap-1.5">
                            {rating.drawing > 0 && (
                              <div className="text-[10px] text-center px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                Рис.{rating.drawing} · Ид.{rating.idea} · Реал.{rating.realization}<br/>
                                Пер.{rating.characters} · Сюж.{rating.story} · Эмоц.{rating.emotional}
                              </div>
                            )}
                            <div className="flex gap-1.5">
                              <button onClick={() => handleReRate(rating)} className="btn-primary text-[10px] !px-2.5 !py-1 !rounded-lg">Подробнее</button>
                              <button onClick={() => handleDeleteRating(rating.id)} className="btn-danger text-[10px] !px-2.5 !py-1 !rounded-lg">Удалить</button>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <h3 className="font-medium text-xs truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{rating.anime_name || `#${rating.anime_id}`}</h3>
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
                  <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>У вас пока нет Tier List</p>
                    <Link to="/tiermaker" className="btn-primary text-xs">Создать</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tierLists.map((list, index) => {
                      const tiers = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
                      return (
                        <motion.div
                          key={list.id}
                          className="rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer group transition-all duration-300"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                          onClick={() => navigate(`/tierlist/${list.id}`)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.3 }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                        >
                          <div className="flex gap-0.5 flex-shrink-0">
                            {tiers.filter((t) => t.items.length > 0).slice(0, 6).map((t) => (
                              <div key={t.id} className="w-6 h-6 rounded-lg flex items-center justify-center text-[7px] font-bold" style={{ borderColor: t.color, backgroundColor: t.color + '15', color: t.color, border: `1px solid ${t.color}30` }}>
                                {t.name}
                              </div>
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate group-hover:text-amber-400 transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.7)' }}>{list.name}</h3>
                            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono' }}>{new Date(list.created_at).toLocaleDateString('ru')}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTierList(list.id) }} className="text-[10px] hover:text-coral-400 transition-colors flex-shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }}>Удалить</button>
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
                  <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Вы ещё не играли в Битву</p>
                    <Link to="/battle" className="btn-primary text-xs">Начать</Link>
                  </div>
                ) : (
                  <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-amber-400 mb-1" style={{ fontFamily: 'JetBrains Mono', textShadow: '0 0 25px rgba(251,191,36,0.2)' }}>{battleStats.best}</div>
                        <div className="label">Лучший результат</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-mint-400 mb-1" style={{ fontFamily: 'JetBrains Mono', textShadow: '0 0 25px rgba(52,211,153,0.2)' }}>{battleStats.total}</div>
                        <div className="label">Всего игр</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.5)' }}>{battleStats.avg}</div>
                        <div className="label">Средний счёт</div>
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <Link to="/battle" className="btn-primary text-xs">Играть</Link>
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
