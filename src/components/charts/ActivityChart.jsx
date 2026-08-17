import { motion } from 'framer-motion'

// График активности по месяцам — SVG столбики с анимацией роста.
// items: [{ date: ISO-строка или Date }] — любая активность с датой
const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

export default function ActivityChart({ items, className = '' }) {
  // Последние 12 месяцев, включая текущий
  const now = new Date()
  const buckets = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ year: d.getFullYear(), month: d.getMonth(), count: 0, label: MONTHS[d.getMonth()] })
  }
  for (const it of items || []) {
    const d = new Date(it)
    const b = buckets.find((x) => x.year === d.getFullYear() && x.month === d.getMonth())
    if (b) b.count++
  }
  const max = Math.max(1, ...buckets.map((b) => b.count))

  return (
    <div className={className}>
      <div className="flex items-end gap-1 sm:gap-1.5 h-24">
        {buckets.map((b, i) => {
          const h = (b.count / max) * 100
          const isCurrent = i === buckets.length - 1
          return (
            <div key={`${b.year}-${b.month}`} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
              <span className="font-mono text-[9px] text-neon-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {b.count || ''}
              </span>
              <div className="w-full h-full flex items-end rounded-sm overflow-hidden bg-surface-2/60">
                <motion.div
                  className="w-full rounded-sm"
                  style={{
                    background: b.count
                      ? isCurrent
                        ? 'linear-gradient(to top, #BBF351, #D4F785)'
                        : 'linear-gradient(to top, rgba(187,243,81,0.45), rgba(187,243,81,0.85))'
                      : 'transparent',
                  }}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${Math.max(b.count ? 8 : 0, h)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className={`text-[8px] font-mono ${isCurrent ? 'text-neon-400' : 'text-text-subtle'}`}>
                {b.label[0]}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="font-mono text-[9px] text-text-muted">
          активность: 12 мес
        </span>
        <span className="font-mono text-[9px] text-neon-400 font-bold">
          всего: {(items || []).length}
        </span>
      </div>
    </div>
  )
}
