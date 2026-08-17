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
  EmptyState, SectionTitle, DossierPanel, Corners,
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

  const topAxis = avgScores
    ? Object.entries(avgScores).sort((a, b) => b[1] - a[1])[0]
    : null
  const AXIS_NAMES = { drawing: 'рисунок', idea: 'идея', realization: 'реализация', characters: 'персонажи', story: 'сюжет', emotional: 'эмоции' }

  if (notFound) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <DossierPanel cut="cut-sm" className="inline-block px-8 py-6">
          <Corners inset={4} size={8} color="rgba(255,51,102,0.5)" />
          <span className="block text-3xl text-text-subtle mb-3">?</span>
          <p className="text-sm mb-3 text-text-muted">Пользователь не найден</p>
          <Link to="/" className="btn-primary btn-shine text-xs">На главную</Link>
        </DossierPanel>
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
        {/* Досье: шапка (read-only) */}
        <ProfileHeader
          username={profileUser.username}
          aura={aura}
          isOwner={false}
          shareUrl={window.location.href}
          idCode={userId.slice(0, 8).toUpperCase()}
        />

        {/* 01 // Сводка */}
        <SectionTitle index="01" title="Сводка" note={`аура ${aura.xp.toLocaleString('ru')} xp · ур. ${aura.level}`} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <StatCard label="Оценок" value={ratings.length} color="#BBF351" delay={0} />
          <StatCard label="Тир-листов" value={tierLists.length} color="#00E5FF" delay={0.05} />
          <StatCard label="Битв" value={battleStats?.total ?? 0} color="#33EBD4" sub={battleRank ? `РАНГ ${battleRank}` : undefined} delay={0.1} />
          <StatCard label="Ср. балл" value={avgRating} color="#FF9F0A" delay={0.15} />
        </div>

        {/* 02 // Аналитика */}
        {ratings.length > 0 && (
          <>
            <SectionTitle
              index="02"
              title="Аналитика"
              note={topAxis ? `сильная сторона: ${AXIS_NAMES[topAxis[0]]} ${topAxis[1].toFixed(1)}` : undefined}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <DossierPanel cut="cut-sm" className="p-5">
                <Corners inset={4} size={8} color="rgba(187,243,81,0.35)" />
                <div className="flex items-center justify-between mb-2">
                  <span className="dossier-note">профиль критика</span>
                  <span className="dossier-note">6 осей</span>
                </div>
                <div className="flex items-center justify-center">
                  <RadarChart values={avgScores} className="w-full max-w-[280px]" />
                </div>
              </DossierPanel>

              <DossierPanel cut="cut-sm" className="p-5 flex flex-col gap-5">
                <Corners inset={4} size={8} color="rgba(187,243,81,0.35)" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="dossier-note">распределение</span>
                    <span className="dossier-note">шкала 1–10</span>
                  </div>
                  <ScoreHistogram ratings={ratings} />
                </div>
                <div className="border-t border-dashed border-brand-medium/40 pt-4">
                  <span className="dossier-note block mb-3">активность</span>
                  <ActivityChart items={ratings.map((r) => r.created_at)} />
                </div>
              </DossierPanel>

              <DossierPanel cut="cut-sm" className="p-5">
                <Corners inset={4} size={8} color="rgba(187,243,81,0.35)" />
                <div className="flex items-center justify-between mb-3">
                  <span className="dossier-note">достижения</span>
                  <span className="font-mono text-[9px] font-bold text-neon-400">
                    {achievementsProgress(achieveStats).unlocked}/{achievementsProgress(achieveStats).total}
                  </span>
                </div>
                <Achievements stats={achieveStats} />
              </DossierPanel>
            </div>
          </>
        )}

        {/* 03 // Архив */}
        <SectionTitle index={ratings.length > 0 ? '03' : '02'} title="Архив" note={`${ratings.length + tierLists.length + (battleStats?.total ?? 0)} записей`} />
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
                  const filled = tiers.filter((t) => (t.items || []).length > 0)
                  return (
                    <motion.div
                      key={list.id}
                      className="group relative flex items-stretch gap-4 cursor-pointer border border-brand-medium/70 bg-[#070905] hover:border-neon-400/50 transition-colors duration-300"
                      onClick={() => navigate(`/tierlist/${list.id}`)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <div className="hidden sm:flex flex-col items-center justify-center w-14 flex-shrink-0 border-r border-brand-medium/50 hatch">
                        <span className="font-mono text-[8px] text-text-subtle">REC</span>
                        <span className="font-display font-bold text-lg text-neon-400/80 leading-none">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center py-3 flex-shrink-0">
                        {filled.slice(0, 6).map((t) => (
                          <div
                            key={t.id}
                            className="w-5 h-10 flex items-center justify-center font-display text-[8px] font-bold"
                            style={{
                              color: t.color,
                              border: `1px solid ${t.color}55`,
                              background: `linear-gradient(to top, ${t.color}30, transparent)`,
                            }}
                          >
                            {t.name}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-3 pr-3">
                        <h3 className="font-display font-bold text-sm text-text-secondary group-hover:text-neon-400 transition-colors truncate uppercase tracking-wide">
                          {list.name}
                        </h3>
                        <p className="dossier-note mt-1">
                          {filled.reduce((n, t) => n + (t.items || []).length, 0)} тайтлов · {new Date(list.created_at).toLocaleDateString('ru')}
                        </p>
                      </div>
                      <div className="flex items-center pr-4">
                        <span className="dossier-note group-hover:text-neon-400 transition-colors">открыть →</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          )}

          {activeTab === 'battle' && battleStats && (
            <DossierPanel cut="cut-sm" className="p-6 sm:p-8">
              <Corners inset={6} size={10} color="rgba(51,235,212,0.45)" />
              <div className="flex items-center justify-between mb-6">
                <span className="dossier-note">арена · режим рейтинга</span>
                {battleRank && (
                  <span className="font-mono text-[10px] font-bold text-mint-400 tracking-widest">
                    RANK #{String(battleRank).padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0">
                <div className="sm:px-6 sm:first:pl-0 text-center sm:text-left relative">
                  <div className="dossier-note mb-1">лучший счёт</div>
                  <div className="font-display font-bold text-5xl text-neon-400 leading-none tracking-tight">{battleStats.best}</div>
                </div>
                <div className="sm:px-6 text-center sm:text-left relative ruled-v sm:border-l border-brand-medium/40">
                  <div className="dossier-note mb-1">всего игр</div>
                  <div className="font-display font-bold text-5xl text-mint-400 leading-none tracking-tight">{battleStats.total}</div>
                </div>
                <div className="sm:px-6 text-center sm:text-left relative ruled-v sm:border-l border-brand-medium/40">
                  <div className="dossier-note mb-1">средний счёт</div>
                  <div className="font-display font-bold text-5xl text-text-secondary leading-none tracking-tight">{battleStats.avg}</div>
                </div>
              </div>
            </DossierPanel>
          )}
        </div>
      </div>
    </div>
  )
}
