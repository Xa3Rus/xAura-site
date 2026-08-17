import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { getAuraLevel } from '../utils/aura'
import { parseTierListData } from '../utils/tierLists'
import ProfileHeader from '../components/profile/ProfileHeader'
import RadarChart from '../components/charts/RadarChart'
import ActivityChart from '../components/charts/ActivityChart'
import Achievements from '../components/profile/Achievements'
import { achievementsProgress } from '../components/profile/Achievements'
import {
  TabBar, StatCard, RatingGrid, ScoreHistogram,
  EmptyState,
} from '../components/profile/SharedBits'

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profileUser, setProfileUser] = useState(null)
  const [ratings, setRatings] = useState([])
  const [tierLists, setTierLists] = useState([])
  const [battleStats, setBattleStats] = useState(null)
  const [battleRank, setBattleRank] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ratings')

  useEffect(() => { loadProfile() }, [userId])

  const loadProfile = async () => {
    const { data: profile } = await supabase.from('profiles').select('id, username').eq('id', userId).single()
    if (!profile) { setNotFound(true); setLoading(false); return }
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
        const sorted = Object.entries(bestByUser).sort((a, b) => b[1] - a[1])
        const rank = sorted.findIndex(([uid]) => uid === userId)
        if (rank !== -1) setBattleRank(rank + 1)
      }
    }
    setLoading(false)
  }

  const aura = getAuraLevel(ratings.length, tierLists.length, battleStats?.total ?? 0)

  // Средние покритерийно для радара
  const avgScores = ratings.length ? ratings.reduce((acc, r) => {
    acc.drawing += Number(r.drawing || 0)
    acc.idea += Number(r.idea || 0)
    acc.realization += Number(r.realization || 0)
    acc.characters += Number(r.characters || 0)
    acc.story += Number(r.story || 0)
    acc.emotional += Number(r.emotional || 0)
    return acc
  }, { drawing: 0, idea: 0, realization: 0, characters: 0, story: 0, emotional: 0 }) : null
  if (avgScores) for (const k of Object.keys(avgScores)) avgScores[k] = Number((avgScores[k] / ratings.length).toFixed(1))

  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + (r.average_score || 0), 0) / ratings.length).toFixed(2)
    : '—'

  if (notFound) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <span className="block text-4xl text-text-subtle mb-3">?</span>
        <p className="text-sm mb-3 text-text-muted">Пользователь не найден</p>
        <Link to="/" className="btn-primary btn-shine text-xs">На главную</Link>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
        <div className="max-w-[1400px] mx-auto text-center py-24">
          <div className="inline-block w-8 h-8 rounded-full border-2 border-neon-400/30 border-t-neon-400 animate-spin" />
          <p className="mt-3 text-xs text-text-muted font-mono">загрузка профиля...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'ratings', label: 'Оценки', count: ratings.length },
    { id: 'tierlists', label: 'Тир-листы', count: tierLists.length },
  ]
  if (battleStats) tabs.push({ id: 'battle', label: 'Битва', count: battleStats.total })

  const achieveStats = {
    ratings: ratings.length,
    tierLists: tierLists.length,
    battles: battleStats?.total ?? 0,
    avgScore: ratings.length ? Number(avgRating) : 0,
    bestScore: battleStats?.best ?? 0,
    animeCount: ratings.length,
    level: aura.level,
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 page-enter">
      <div className="max-w-[1400px] mx-auto">
        {/* Hero-баннер (без email, read-only) */}
        <ProfileHeader
          username={profileUser.username}
          aura={aura}
          isOwner={false}
          shareUrl={window.location.href}
        />

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Оценок" value={ratings.length} color="#BBF351" delay={0} />
          <StatCard label="Тир-листов" value={tierLists.length} color="#00E5FF" delay={0.05} />
          <StatCard label="Битв" value={battleStats?.total ?? 0} color="#00CC88" sub={battleRank ? `#${battleRank}` : undefined} delay={0.1} />
          <StatCard label="Средний балл" value={avgRating} color="#FF9F0A" delay={0.15} />
        </div>

        {/* Визуализация + Достижения */}
        {ratings.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="card p-5 flex items-center justify-center">
              <RadarChart values={avgScores} className="w-full max-w-[260px]" />
            </div>

            <div className="card p-5 flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="label">Распределение оценок</span>
                  <span className="font-mono text-[9px] text-text-subtle">1 — 10</span>
                </div>
                <ScoreHistogram ratings={ratings} />
                <div className="flex gap-3 mt-3 font-mono text-[8px] text-text-subtle">
                  <span className="text-danger">■ 1–2</span>
                  <span className="text-coral-500">■ 2–4</span>
                  <span className="text-warning">■ 4–6</span>
                  <span className="text-neon-400">■ 6–8</span>
                  <span className="text-success">■ 8–10</span>
                </div>
              </div>
              <div>
                <span className="label block mb-3">Активность по месяцам</span>
                <ActivityChart items={ratings.map((r) => r.created_at)} />
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="label">Достижения</span>
                <span className="font-mono text-[9px] text-neon-400 font-bold">
                  {achievementsProgress(achieveStats).unlocked}/{achievementsProgress(achieveStats).total}
                </span>
              </div>
              <Achievements stats={achieveStats} />
            </div>
          </motion.div>
        )}

        {/* Вкладки */}
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === 'ratings' && (
            ratings.length === 0 ? (
              <EmptyState icon="★" text="Пока нет оценок" />
            ) : (
              <RatingGrid ratings={ratings} />
            )
          )}

          {activeTab === 'tierlists' && (
            tierLists.length === 0 ? (
              <EmptyState icon="▦" text="Пока нет тир-листов" />
            ) : (
              <div className="space-y-2">
                {tierLists.map((list, index) => {
                  const { tiers } = parseTierListData(list.tiers)
                  return (
                    <motion.div
                      key={list.id}
                      className="rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer group card hover:border-neon-400/30"
                      onClick={() => navigate(`/tierlist/${list.id}`)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <div className="flex gap-0.5 flex-shrink-0">
                        {tiers.filter((t) => (t.items || []).length > 0).slice(0, 6).map((t) => (
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
            )
          )}

          {activeTab === 'battle' && battleStats && (
            <div className="card p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-neon-400/[0.05] rounded-full blur-[90px] -translate-y-1/2 translate-x-1/2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative">
                <div className="text-center">
                  <div className="text-4xl font-bold text-neon-400 mb-1 font-mono drop-shadow-[0_0_14px_rgba(187,243,81,0.3)]">{battleStats.best}</div>
                  <div className="label">Лучший результат</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-mint-400 mb-1 font-mono">{battleStats.total}</div>
                  <div className="label">Всего игр</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-text-muted mb-1 font-mono">{battleStats.avg}</div>
                  <div className="label">Средний счёт</div>
                </div>
              </div>
              {battleRank && (
                <p className="mt-4 text-center font-mono text-[9px] text-text-subtle">
                  место #{battleRank}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
