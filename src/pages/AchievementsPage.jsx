import { useEffect, useMemo, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getAuraLevel } from '../utils/aura'
import Achievements, { ACHIEVEMENT_DEFS, CATEGORY_LABELS, RARITY, achievementsProgress, getAchievementState } from '../components/profile/Achievements'
import { DossierPanel, Corners, SectionTitle } from '../components/profile/SharedBits'

const filters = [
  { id: 'all', label: 'Все' },
  { id: 'unlocked', label: 'Открытые' },
  { id: 'progress', label: 'В процессе' },
]

export default function AchievementsPage() {
  const { user } = useContext(AuthContext)
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('ratings').select('id, average_score', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('tier_lists').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('battle_games').select('score', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('daily_results').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('friendships').select('id', { count: 'exact' }).eq('status', 'accepted').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    ]).then(([ratings, tiers, battles, daily, friends]) => {
      const scores = ratings.data || []
      const battleScores = battles.data || []
      const average = scores.length ? scores.reduce((sum, r) => sum + Number(r.average_score || 0), 0) / scores.length : 0
      const aura = getAuraLevel(ratings.count || 0, tiers.count || 0, battles.count || 0, daily.count || 0)
      setStats({ ratings: ratings.count || 0, tierLists: tiers.count || 0, battles: battles.count || 0, avgScore: average, bestScore: Math.max(0, ...battleScores.map((r) => Number(r.score || 0))), animeCount: ratings.count || 0, level: aura.level, friends: friends.count || 0, dailyCount: daily.count || 0, modesPlayed: [ratings.count, tiers.count, battles.count, daily.count, friends.count].filter(Boolean).length })
    })
  }, [user])

  const visible = useMemo(() => {
    if (!stats) return []
    return ACHIEVEMENT_DEFS.filter((def) => {
      const state = getAchievementState(def, stats)
      return (category === 'all' || def.category === category) && (filter === 'all' || (filter === 'unlocked' ? state.unlocked : !state.unlocked))
    })
  }, [stats, category, filter])

  if (!stats) return <div className="min-h-screen pt-32 text-center text-xs font-mono text-text-muted">синхронизация достижений...</div>
  const progress = achievementsProgress(stats)
  const percent = Math.round((progress.unlocked / progress.total) * 100)
  const categories = [...new Set(ACHIEVEMENT_DEFS.map((def) => def.category))]

  return (
    <main className="min-h-screen pt-24 pb-16 px-5 sm:px-8 page-enter">
      <div className="max-w-[1180px] mx-auto">
        <div className="flex items-center gap-3 mb-2"><span className="dossier-note !text-neon-400/75">AURA ARCHIVE / ДОСТИЖЕНИЯ</span><span className="h-px flex-1 bg-gradient-to-r from-brand-medium/70 to-transparent" /><Link to="/profile" className="dossier-note hover:text-neon-400">профиль →</Link></div>
        <section className="grid lg:grid-cols-[1.35fr_0.65fr] gap-4 mb-10">
          <DossierPanel accent="#BBF351" className="p-6 sm:p-8"><Corners inset={6} size={12} /><div className="flex items-end justify-between gap-4"><div><span className="dossier-note block mb-2">коллекция оператора</span><h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">Достижения</h1><p className="mt-3 max-w-md text-sm leading-relaxed text-text-muted">Каждый открытый артефакт — след реальной активности в xAura. Никаких случайных наград, только твой путь.</p></div><div className="text-right shrink-0"><span className="block font-display text-5xl sm:text-6xl font-bold text-neon-400">{percent}%</span><span className="dossier-note">синхронизация</span></div></div><div className="mt-7"><div className="flex items-center justify-between mb-2"><span className="dossier-note">ОТКРЫТО {progress.unlocked} / {progress.total}</span><span className="font-mono text-[10px] text-neon-400">AURA SIGNAL</span></div><div className="h-3 bg-surface-3 border border-brand-medium overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.9 }} className="h-full chevron-fill" /></div></div></DossierPanel>
          <DossierPanel accent="#00E5FF" className="p-6"><Corners inset={6} size={10} color="rgba(0,229,255,0.4)" /><span className="dossier-note block mb-4">шкала редкости</span><div className="space-y-3">{Object.entries(RARITY).map(([id, value]) => <div key={id} className="flex items-center gap-3"><span className="w-3 h-3 border" style={{ borderColor: value.color, background: `${value.color}35` }} /><span className="text-sm text-text-secondary flex-1">{value.label}</span><span className="font-mono text-[10px]" style={{ color: value.color }}>{ACHIEVEMENT_DEFS.filter((d) => d.rarity === id).length} артеф.</span></div>)}</div><div className="mt-6 pt-4 border-t border-dashed border-brand-medium/40"><span className="dossier-note">СОВЕТ</span><p className="mt-2 text-xs text-text-muted leading-relaxed">Заблокированные артефакты показывают следующий ориентир, а не просто пустое место.</p></div></DossierPanel>
        </section>
        <SectionTitle index="01" title="Артефакты" note={`${visible.length} в текущем фильтре`} />
        <div className="flex flex-wrap gap-2 mb-5">{filters.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`px-3 py-2 border cut-sm font-mono text-[10px] uppercase tracking-wider transition-colors ${filter === item.id ? 'border-neon-400/60 text-neon-400 bg-neon-400/10' : 'border-brand-medium/40 text-text-muted hover:text-text'}`}>{item.label}</button>)}<span className="w-px bg-brand-medium/50 mx-1" />{['all', ...categories].map((id) => <button key={id} onClick={() => setCategory(id)} className={`px-3 py-2 border cut-sm font-mono text-[10px] uppercase tracking-wider transition-colors ${category === id ? 'border-cyan-400/60 text-cyan-300 bg-cyan-400/10' : 'border-brand-medium/40 text-text-muted hover:text-text'}`}>{id === 'all' ? 'Все категории' : CATEGORY_LABELS[id]}</button>)}</div>
        {visible.length ? <Achievements stats={stats} defs={visible} compact={false} className="mb-10" /> : <DossierPanel className="p-10 text-center"><span className="text-2xl text-text-subtle">⌁</span><p className="mt-3 text-sm text-text-muted">В этом секторе пока нет артефактов.</p></DossierPanel>}
      </div>
    </main>
  )
}
