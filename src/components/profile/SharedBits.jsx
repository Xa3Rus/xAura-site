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

// Уголки-скобки технической рамки
export function Corners({ color = 'rgba(187,243,81,0.55)', size = 10, inset = 0 }) {
  const common = 'absolute pointer-events-none'
  const s = { width: size, height: size, borderColor: color }
  return (
    <>
      <span className={`${common} border-l border-t`} style={{ ...s, top: inset, left: inset }} />
      <span className={`${common} border-r border-t`} style={{ ...s, top: inset, right: inset }} />
      <span className={`${common} border-l border-b`} style={{ ...s, bottom: inset, left: inset }} />
      <span className={`${common} border-r border-b`} style={{ ...s, bottom: inset, right: inset }} />
    </>
  )
}

// Панель досье: срезанные углы через двойную обёртку (рамка не режется clip-path)
export function DossierPanel({ children, className = '', accent = '#BBF351', cut = 'cut-lg', style }) {
  return (
    <div className={`cut-wrap ${cut}`} style={{ background: `linear-gradient(160deg, ${accent}2E, ${accent}14 30%, #2D4A0F66 100%)`, ...style }}>
      <div className={`cut-inner ${cut} bg-[#070905] relative ${className}`}>{children}</div>
    </div>
  )
}

// Секционный заголовок досье: 01 / НАЗВАНИЕ —— примечание справа
export function SectionTitle({ index, title, note }) {
  return (
    <div className="dossier-rule mb-4">
      <span className="font-mono text-[10px] font-bold text-text-subtle">{index}</span>
      <h2 className="font-display font-bold text-[15px] tracking-wide text-white uppercase">{title}</h2>
      {note && <span className="dossier-note hidden sm:inline">{note}</span>}
    </div>
  )
}

// Приборная плитка статистики: срезанный угол, шкала-риска снизу
export function StatCard({ label, value, color = '#BBF351', sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="cut-wrap cut-sm group"
      style={{ background: `linear-gradient(150deg, ${color}30, transparent 55%)` }}
    >
      <div className="cut-inner cut-sm relative bg-[#070905] border-0 px-4 pt-3.5 pb-3 overflow-hidden transition-colors duration-300">
        {/* нижняя dotted-линейка */}
        <div className="absolute bottom-0 inset-x-0 h-2 gauge-ticks opacity-25" />
        {/* цветная риска слева */}
        <div className="absolute left-0 top-3 bottom-3 w-[2px]" style={{ background: `${color}66` }} />

        <div className="flex items-baseline justify-between mb-1.5 pr-1">
          <span className="dossier-note">{label}</span>
          {sub && <span className="font-mono text-[9px] font-bold" style={{ color }}>{sub}</span>}
        </div>
        <div className="font-display font-bold text-[26px] leading-none tracking-tight" style={{ color }}>
          {value}
        </div>
      </div>
    </motion.div>
  )
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex items-stretch border-b border-brand-medium/50 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-shrink-0 px-4 sm:px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 cursor-pointer ${
              isActive ? 'text-neon-400' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {isActive && (
              <>
                <motion.span
                  layoutId="profile-tab"
                  className="absolute inset-x-0 bottom-[-1px] h-[2px] chevron-fill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
                <span className="absolute top-1/2 -translate-y-1/2 left-1 text-[8px] text-neon-400/60">▸</span>
              </>
            )}
            <span className={`pl-2.5 ${!isActive && 'pl-2.5'}`}>
              {tab.label}
              <span className={`ml-2 font-mono text-[9px] font-bold ${isActive ? 'text-neon-400/70' : 'text-text-subtle'}`}>
                {String(tab.count).padStart(2, '0')}
              </span>
            </span>
          </button>
        )
      })}
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
      className="group relative overflow-hidden border border-brand-medium/70 bg-[#070905] hover:border-neon-400/60 transition-all duration-300"
    >
      {/* верхняя цветная риска по оценке */}
      <div className="absolute top-0 inset-x-0 h-[2px] z-10" style={{ background: scoreColor(score) }} />
      <div className="relative aspect-[3/4] overflow-hidden bg-[#0A0D07]">
        <img
          src={shikimoriImg(rating.anime_image) || ''}
          alt={rating.anime_name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* табличка оценки: чёрная подложка с левым цветным торцом */}
        <span
          className="absolute top-1.5 left-1.5 flex items-center font-mono text-[10px] font-bold bg-black/90 px-1.5 py-0.5 border border-white/5"
          style={{ color: scoreColor(score) }}
        >
          <span className="w-[3px] h-3 mr-1.5" style={{ background: scoreColor(score) }} />
          {score.toFixed(2)}
        </span>

        {/* Ховер с покритиевкой */}
        {isOwner && (
          <div className="absolute inset-0 bg-black/88 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2.5">
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
                  <div className="w-12 h-1 bg-surface-4 overflow-hidden">
                    <div className="h-full" style={{ width: `${val * 10}%`, background: scoreColor(Number(val)) }} />
                  </div>
                  <span className="text-text font-bold w-3 text-right">{val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              {onRerate && (
                <button onClick={() => onRerate(rating)} className="flex-1 px-2 py-1.5 text-[9px] font-bold bg-neon-400/10 border border-neon-400/40 text-neon-400 hover:bg-neon-400 hover:text-black transition-all cursor-pointer">
                  Пересмотреть
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(rating)} className="px-2 py-1.5 text-[9px] font-bold bg-danger/10 border border-danger/30 text-danger hover:bg-danger hover:text-black transition-all cursor-pointer">
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="px-2 py-1.5 border-t border-brand-medium/50">
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

// Гистограмма распределения оценок: 5 вёдер, сетка, мода подсвечена шевроном
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
  const modeIdx = buckets.indexOf(Math.max(...buckets))
  const colors = ['#FF3366', '#FF9F0A', '#A0A0A0', '#BBF351', '#00CC88']
  const labels = ['1–2', '2–4', '4–6', '6–8', '8–10']
  // уровни горизонтальной сетки
  const gridLines = [0.5, 1].map((f) => Math.round(max * f))

  return (
    <div>
      <div className="relative h-24 flex items-end gap-2">
        {/* горизонтальная сетка с подписями */}
        {gridLines.map((v) => (
          <div
            key={v}
            className="absolute inset-x-0 border-t border-dashed border-brand-medium/40 pointer-events-none"
            style={{ bottom: `${(v / max) * 100}%` }}
          >
            <span className="absolute -top-[7px] -left-0.5 font-mono text-[7px] text-text-subtle bg-[#070905] px-0.5">
              {v}
            </span>
          </div>
        ))}
        {buckets.map((count, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end group">
            <span
              className={`font-mono text-[9px] font-bold mb-0.5 transition-colors ${
                i === modeIdx ? 'text-neon-400' : 'text-text-muted group-hover:text-text-secondary'
              }`}
            >
              {count || '·'}
            </span>
            <motion.div
              className={`w-full ${i === modeIdx ? 'chevron-fill' : ''}`}
              style={i === modeIdx ? {} : { background: colors[i], opacity: 0.7 }}
              initial={{ height: 0 }}
              whileInView={{ height: `${Math.max(count ? 6 : 1.5, (count / max) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        ))}
      </div>
      {/* ось X */}
      <div className="flex gap-2 mt-1 pt-1 border-t border-brand-medium/60">
        {labels.map((l, i) => (
          <span
            key={l}
            className={`flex-1 text-center font-mono text-[8px] ${i === modeIdx ? 'text-neon-400 font-bold' : 'text-text-subtle'}`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

export function EmptyState({ icon = '∅', text, to, linkText }) {
  return (
    <div className="text-center py-14 relative">
      <div className="absolute inset-0 hatch-dense opacity-40 pointer-events-none" />
      <span className="relative block text-3xl text-text-subtle mb-3">{icon}</span>
      <p className="relative text-sm text-text-muted mb-4">{text}</p>
      {to && (
        <Link to={to} className="relative btn-primary btn-shine text-xs !py-2.5 !px-6 inline-block">
          {linkText}
        </Link>
      )}
    </div>
  )
}
