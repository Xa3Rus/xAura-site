import { motion } from 'framer-motion'

// График активности по месяцам — SVG-бары в техно-стиле:
// горизонтальная сетка, «пиковая» шапка у столбиков, полная подпись месяцев
// items: [{ date: ISO-строка или Date }] — любая активность с датой
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

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
  const gridLines = [0.5, 1].map((f) => Math.round(max * f))
  const bestIdx = buckets.reduce((bi, b, i) => (b.count > buckets[bi].count ? i : bi), 0)

  return (
    <div className={className}>
      <div className="relative h-24 flex items-end gap-1 sm:gap-1.5">
        {/* горизонтальная сетка */}
        {gridLines.map((v) => (
          <div
            key={v}
            className="absolute inset-x-0 border-t border-dashed border-brand-medium/30 pointer-events-none"
            style={{ bottom: `${(v / max) * 100}%` }}
          >
            <span className="absolute -top-[7px] left-0 font-mono text-[7px] text-text-subtle bg-[#070905] px-0.5">{v}</span>
          </div>
        ))}

        {buckets.map((b, i) => {
          const h = (b.count / max) * 100
          const isCurrent = i === buckets.length - 1
          const isBest = b.count > 0 && i === bestIdx
          return (
            <div key={`${b.year}-${b.month}`} className="flex-1 h-full flex flex-col justify-end group min-w-0 relative">
              <span
                className={`font-mono text-[9px] font-bold mb-0.5 transition-opacity text-center ${
                  isBest || isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ color: isBest ? '#BBF351' : undefined }}
              >
                {b.count || ''}
              </span>
              <motion.div
                className="relative w-full"
                style={{
                  background: b.count
                    ? isCurrent
                      ? 'linear-gradient(to top, #7AB328, #BBF351)'
                      : 'linear-gradient(to top, rgba(122,179,40,0.55), rgba(187,243,81,0.9))'
                    : 'rgba(187,243,81,0.05)',
                  boxShadow: 'inset 0 0 0 1px rgba(187,243,81,0.15)',
                }}
                initial={{ height: 0 }}
                whileInView={{ height: `${Math.max(b.count ? 8 : 3, h)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* пиковая шапка столбика */}
                {b.count > 0 && (
                  <span
                    className="absolute top-0 inset-x-0 h-[3px]"
                    style={{ background: isBest || isCurrent ? '#D4F785' : 'rgba(212,247,133,0.55)' }}
                  />
                )}
              </motion.div>
            </div>
          )
        })}
      </div>
      {/* ось месяцев */}
      <div className="flex gap-1 sm:gap-1.5 mt-1 pt-1 border-t border-brand-medium/60">
        {buckets.map((b, i) => {
          const isCurrent = i === buckets.length - 1
          return (
            <span
              key={`${b.year}-${b.month}-l`}
              className={`flex-1 text-center font-mono text-[7px] ${isCurrent ? 'text-neon-400 font-bold' : 'text-text-subtle'}`}
            >
              {b.label}
            </span>
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="dossier-note">активность · 12 мес</span>
        <span className="font-mono text-[9px] text-neon-400 font-bold">
          всего: {(items || []).length}
        </span>
      </div>
    </div>
  )
}
