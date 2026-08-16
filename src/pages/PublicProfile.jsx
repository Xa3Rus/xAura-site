import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../utils/supabase'

function scoreColor(score) {
  if (score >= 8) return 'bg-success/10 text-success border-success/20'
  if (score >= 7) return 'bg-neon-400/10 text-neon-400 border-neon-400/15'
  if (score >= 5.5) return 'bg-surface-2 text-text-muted border-surface-3'
  return 'bg-danger/10 text-danger border-danger/15'
}

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profileUser, setProfileUser] = useState(null)
  const [ratings, setRatings] = useState([])
  const [tierLists, setTierLists] = useState([])
  const [battleStats, setBattleStats] = useState(null)
  const [battleRank, setBattleRank] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('ratings')

  useEffect(() => { loadProfile() }, [userId])

  const loadProfile = async () => {
    const { data: profile } = await supabase.from('profiles').select('id, username').eq('id', userId).single()
    if (!profile) { setNotFound(true); return }
    setProfileUser(profile)

    const [ratingsRes, tierListsRes, battleRes] = await Promise.all([
      supabase.from('ratings').select('*').eq('user_id', userId),
      supabase.from('tier_lists').select('*').eq('user_id', userId),
      supabase.from('battle_games').select('score').eq('user_id', userId),
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
        const rank = sorted.findIndex(([uid]) => uid === userId)
        if (rank !== -1) setBattleRank(rank + 1)
      }
    }
  }

  const getAvatarLetter = () => profileUser?.username?.[0]?.toUpperCase() || 'U'

  if (notFound) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm mb-3 text-text-muted">Пользователь не найден</p>
        <Link to="/" className="text-neon-400 hover:text-neon-500 text-xs">На главную</Link>
      </div>
    </div>
  )

  if (!profileUser) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <p className="text-sm text-text-muted">Загрузка...</p>
    </div>
  )

  const tabs = [
    { id: 'ratings', label: 'Оценки', count: ratings.length },
    { id: 'tierlists', label: 'Tier Lists', count: tierLists.length },
  ]
  if (battleStats) tabs.push({ id: 'battle', label: 'Битва', count: battleStats.total })

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-[1400px] mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-surface-1 border border-neon-400/10 shadow-soft">
            <div className="absolute top-0 right-0 w-40 h-40 bg-neon-400/[0.06] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-neon-400/10 border border-neon-400/20">
                <span className="text-2xl font-bold text-neon-400" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{getAvatarLetter()}</span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{profileUser.username}</h1>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 relative">
              <div className="rounded-xl px-4 py-3.5 flex items-center gap-3 bg-surface-1 border border-neon-400/10">
                <div className="text-xl font-bold text-neon-400 font-mono">{ratings.length}</div>
                <div className="label">Оценок</div>
              </div>
              <div className="rounded-xl px-4 py-3.5 flex items-center gap-3 bg-surface-1 border border-neon-400/10">
                <div className="text-xl font-bold text-mint-500 font-mono">{battleRank ? `#${battleRank}` : '—'}</div>
                <div className="label">В рейтинге</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit bg-surface-1 border border-neon-400/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
              style={activeTab === tab.id ? {
                color: '#8fc420',
                background: 'rgba(187,243,81,0.12)',
                border: '1px solid rgba(187,243,81,0.18)',
              } : {
                color: '#9CA3AF',
                border: '1px solid transparent',
              }}
            >
              {tab.label} <span className="font-mono opacity-50">({tab.count})</span>
            </button>
          ))}
        </div>

        {activeTab === 'ratings' && (
          <div>
            {ratings.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-surface-1 border border-neon-400/10 shadow-soft">
                <p className="text-sm text-text-muted">Пока нет оценок</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {ratings.map((rating, index) => (
                  <motion.div
                    key={rating.id}
                    className="card-hover overflow-hidden group"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-2xl bg-surface-2">
                      {rating.anime_image ? (
                        <img src={rating.anime_image} alt={rating.anime_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-subtle">Нет</div>
                      )}
                      <div className={`absolute top-2 left-2 score-badge border font-mono ${scoreColor(rating.average_score)}`}>
                        {rating.average_score?.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-medium text-xs truncate text-text-secondary">{rating.anime_name || `#${rating.anime_id}`}</h3>
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
              <div className="text-center py-16 rounded-2xl bg-surface-1 border border-neon-400/10 shadow-soft">
                <p className="text-sm text-text-muted">Пока нет Tier List</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tierLists.map((list, index) => {
                  const tiers = typeof list.tiers === 'string' ? JSON.parse(list.tiers) : list.tiers
                  return (
                    <motion.div
                      key={list.id}
                      className="rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer group transition-all duration-300 bg-surface-1 border border-neon-400/10 shadow-soft hover:border-neon-400/20"
                      onClick={() => navigate(`/tierlist/${list.id}`)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <div className="flex gap-0.5 flex-shrink-0">
                        {tiers.filter((t) => t.items.length > 0).slice(0, 6).map((t) => (
                          <div key={t.id} className="w-6 h-6 rounded-lg flex items-center justify-center text-[7px] font-bold" style={{ backgroundColor: t.color + '15', color: t.color, border: `1px solid ${t.color}30` }}>
                            {t.name}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate group-hover:text-neon-400 transition-colors text-text-secondary">{list.name}</h3>
                        <p className="text-[10px] text-text-muted font-mono">{new Date(list.created_at).toLocaleDateString('ru')}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'battle' && battleStats && (
          <div className="rounded-2xl p-6 bg-surface-1 border border-neon-400/10 shadow-soft">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-neon-400 mb-1 font-mono">{battleStats.best}</div>
                <div className="label">Лучший результат</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-mint-500 mb-1 font-mono">{battleStats.total}</div>
                <div className="label">Всего игр</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-text-muted mb-1 font-mono">{battleStats.avg}</div>
                <div className="label">Средний счёт</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
