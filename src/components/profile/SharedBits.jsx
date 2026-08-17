import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { shikimoriImg } from '../../utils/imgUrl'

// Общие куски Profile/PublicProfile — убирают дублирование двух страниц

export function scoreColor(score) {
  if (score >= 8) return '#00CC88'
  if (score >= 7) return '#BBF351'
  if (score >= 5.5) return '#A0A0A0'
  return '#FF3366'
}

export function StatCard({ label, value, color = '#BBF351', sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border border-surface-4 bg-surface-1/80 backdrop-blur-sm px-4 py-3.5 hover:border-neon-400/30 transition-colors duration-300"
    >
      <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1.5">{label}</div>
      <div className="font-display font-bold text-2xl leading-none" style={{ color }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[9px] text-text-subtle font-mono">{sub}</div>}
    </motion.div>
  )
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1.5 p-1 rounded-xl bg-surface-1/80 border border-surface-4 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-shrink-0 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
            active === tab.id ? 'text-black' : 'text-text-secondary hover:text-text'
          }`}
        >
          {active === tab.id && (
            <motion.span
              layoutId="profile-tab"
              className="absolute inset-0 rounded-lg"
              style={{ background: '#8fc420' }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative z-10">
            {tab.label}
            <span className={`ml-1.5 font-mono text-[10px] ${active === tab.id ? 'text-black/60' : 'text-text-subtle'}`}>
              {tab.count}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}

// Карточка оценки в сетке
export function RatingCard({ rating, index = 0, isOwner = false, onDelete, onRerate }) {
  const score = Number(rating.average_score)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.4 }}
      className="group relative rounded-lg overflow-hidden border border-surface-4 hover:border-neon-400/40 transition-all duration-300 bg-surface-1"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
        <img
          src={shikimoriImg(rating.anime_image) || ''}
          alt={rating.anime_name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className="score-badge absolute top-1.5 left-1.5"
          style={{ color: scoreColor(score) }}
        >
          {score.toFixed(2)}
        </span>

        {/* Ховер с покритиевкой */}
        {isOwner && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2.5">
            <div className="space-y-1 font-mono text-[9px]">
              {[
                ['Рисование', rating.drawing],
                ['Идея', rating.idea],
                ['Реализация', rating.realization],
                ['Персонажи', rating.characters],
                ['Сюжет', rating.story],
                ['Эмоции', rating.emotional],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-text-muted flex-1">{label}</span>
                  <div className="w-12 h-1 rounded-full bg-surface-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${val * 10}%`, background: scoreColor(Number(val)) }} />
                  </div>
                  <span className="text-text font-bold w-3 text-right">{val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              {onRerate && (
                <button onClick={() => onRerate(rating)} className="flex-1 px-2 py-1.5 rounded text-[9px] font-bold bg-neon-400/10 border border-neon-400/40 text-neon-400 hover:bg-neon-400 hover:text-black transition-all cursor-pointer">
                  Пересмотреть
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(rating)} className="px-2 py-1.5 rounded text-[9px] font-bold bg-danger/10 border border-danger/30 text-danger hover:bg-danger hover:text-black transition-all cursor-pointer">
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="px-2 py-1.5">
        <span className="block text-[10px] text-text-secondary truncate" title={rating.anime_name}>
          {rating.anime_name}
        </span>
      </div>
    </motion.div>
  )
}

export function RatingGrid({ ratings, isOwner = false, onDelete, onRerate }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {ratings.map((r, i) => (
        <RatingCard key={r.id} rating={r} index={i} isOwner={isOwner} onDelete={onDelete} onRerate={onRerate} />
      ))}
    </div>
  )
}

// Гистограмма распределения оценок: 5 вёдер
export function ScoreHistogram({ ratings }) {
  const buckets = [0, 0, 0, 0, 0]
  for (const r of ratings) {
    const s = Number(r.average_score)
    if (s <= 2) buckets[0]++
    else if (s <= 4) buckets[1]++
    else if (s <= 6) buckets[2]++
    else if (s <= 8) buckets[3]++
    else buckets[4]++
  }
  const max = Math.max(1, ...buckets)
  const colors = ['#FF3366', '#FF9F0A', '#A0A0A0', '#BBF351', '#00CC88']
  const labels = ['1–2', '2–4', '4–6', '6–8', '8–10']

  return (
    <div className="flex items-end gap-2 h-20">
      {buckets.map((count, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="font-mono text-[9px] text-text-muted group-hover:text-neon-400 transition-colors">{count}</span>
          <div className="w-full h-full flex items-end rounded-sm bg-surface-2/60 overflow-hidden">
            <motion.div
              className="w-full rounded-sm"
              style={{ background: colors[i], opacity: 0.85 }}
              initial={{ height: 0 }}
              whileInView={{ height: `${(count / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            />
          </div>
          <span className="font-mono text-[8px] text-text-subtle">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon = '∅', text, to, linkText }) {
  return (
    <div className="text-center py-14">
      <span className="block text-3xl text-text-subtle mb-3">{icon}</span>
      <p className="text-sm text-text-muted mb-4">{text}</p>
      {to && (
        <Link to={to} className="btn-primary btn-shine text-xs !py-2.5 !px-6 inline-block">
          {linkText}
        </Link>
      )}
    </div>
  )
}
