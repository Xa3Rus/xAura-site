import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

function scoreColor(score) {
  if (score >= 8) return 'bg-success/10 text-success border-success/20'
  if (score >= 7) return 'bg-neon-400/10 text-neon-400 border-neon-400/15'
  if (score >= 5.5) return 'bg-surface-2 text-text-muted border-surface-3'
  return 'bg-danger/10 text-danger border-danger/15'
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
  const [confirmModal, setConfirmModal] = useState(null)

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
    setConfirmModal({ type: 'rating', id: ratingId, text: 'Удалить эту оценку?' })
  }

  const handleDeleteTierList = async (listId) => {
    setConfirmModal({ type: 'tierlist', id: listId, text: 'Удалить tier list?' })
  }

  const confirmAction = async () => {
    if (!confirmModal) return
    if (confirmModal.type === 'rating') {
      await supabase.from('ratings').delete().eq('id', confirmModal.id)
      setRatings((prev) => prev.filter((r) => r.id !== confirmModal.id))
    } else if (confirmModal.type === 'tierlist') {
      await supabase.from('tier_lists').delete().eq('id', confirmModal.id)
      setTierLists((prev) => prev.filter((l) => l.id !== confirmModal.id))
    }
    setConfirmModal(null)
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
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-surface-1 border border-neon-400/10 shadow-soft glass">
            <div className="absolute top-0 right-0 w-40 h-40 bg-neon-400/[0.06] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-mint-400/[0.04] rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 relative bg-neon-400/10 border border-neon-400/20">
                <span className="text-2xl font-bold text-neon-400" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{getAvatarLetter()}</span>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success" style={{ border: '2px solid #FFFFFF' }} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl font-bold tracking-tight mb-0.5 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>{user?.username}</h1>
                <p className="text-xs text-text-muted">{user?.email}</p>
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
              className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 relative"
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

        {loading ? (
          <div className="text-center py-16 text-sm text-text-muted">Загрузка...</div>
        ) : (
          <>
            {activeTab === 'ratings' && (
              <div>
                {ratings.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl bg-surface-1 border border-neon-400/10 shadow-soft">
                    <p className="text-sm mb-3 text-text-muted">Вы ещё не оценили ни одного аниме</p>
                    <Link to="/catalog" className="btn-primary btn-shine text-xs">Перейти к каталогу</Link>
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
                        <div className="aspect-[3/4] relative overflow-hidden rounded-t-2xl bg-surface-2">
                          {rating.anime_image ? (
                            <img
                              src={rating.anime_image}
                              alt={rating.anime_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-subtle">Нет</div>
                          )}
                          <div className={`absolute top-2 left-2 score-badge border font-mono ${scoreColor(rating.average_score)}`}>
                            {rating.average_score?.toFixed(2)}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-3 gap-1.5">
                            {rating.drawing > 0 && (
                              <div className="text-[10px] text-center px-2 text-white/70">
                                Рис.{rating.drawing} · Ид.{rating.idea} · Реал.{rating.realization}<br/>
                                Пер.{rating.characters} · Сюж.{rating.story} · Эмоц.{rating.emotional}
                              </div>
                            )}
                            <div className="flex gap-1.5">
                              <button onClick={() => handleReRate(rating)} className="btn-primary btn-shine text-[10px] !px-2.5 !py-1 !rounded-lg">Подробнее</button>
                              <button onClick={() => handleDeleteRating(rating.id)} className="btn-danger text-[10px] !px-2.5 !py-1 !rounded-lg">Удалить</button>
                            </div>
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
                    <p className="text-sm mb-3 text-text-muted">У вас пока нет Tier List</p>
                    <Link to="/tiermaker" className="btn-primary btn-shine text-xs">Создать</Link>
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
                            <h3 className="font-medium text-sm truncate group-hover:text-neon-400 transition-colors duration-200 text-text-secondary">{list.name}</h3>
                            <p className="text-[10px] text-text-muted font-mono">{new Date(list.created_at).toLocaleDateString('ru')}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTierList(list.id) }} className="text-[10px] hover:text-danger transition-colors flex-shrink-0 text-text-muted">Удалить</button>
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
                  <div className="text-center py-16 rounded-2xl bg-surface-1 border border-neon-400/10 shadow-soft">
                    <p className="text-sm mb-3 text-text-muted">Вы ещё не играли в Битву</p>
                    <Link to="/battle" className="btn-primary btn-shine text-xs">Начать</Link>
                  </div>
                ) : (
                  <div className="rounded-2xl p-6 sm:p-8 bg-surface-1 border border-neon-400/10 shadow-soft">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-neon-400 mb-1 font-mono">{battleStats.best}</div>
                        <div className="label">Лучший результат</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-mint-500 mb-1 font-mono">{battleStats.total}</div>
                        <div className="label">Всего игр</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-text-muted mb-1 font-mono">{battleStats.avg}</div>
                        <div className="label">Средний счёт</div>
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <Link to="/battle" className="btn-primary btn-shine text-xs">Играть</Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {confirmModal && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
            <motion.div
              className="relative rounded-2xl p-5 w-[90%] max-w-xs bg-surface-1 border border-neon-400/10 shadow-soft-lg"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-sm font-medium mb-5 text-text-secondary">{confirmModal.text}</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmModal(null)} className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors text-text-muted border border-surface-3 hover:bg-surface-1">
                  Отмена
                </button>
                <button onClick={confirmAction} className="btn-primary btn-shine text-xs !py-1.5">
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
