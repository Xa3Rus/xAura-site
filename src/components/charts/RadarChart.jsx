import { motion } from 'framer-motion'

// Радарная диаграмма 6 критериев — чистый SVG без зависимостей:
// оцифрованные кольца, тики по внешнему контуру, двойной контур полигона
const AXES = [
  { key: 'drawing', label: 'Рисунок' },
  { key: 'idea', label: 'Идея' },
  { key: 'realization', label: 'Реализация' },
  { key: 'characters', label: 'Персонажи' },
  { key: 'story', label: 'Сюжет' },
  { key: 'emotional', label: 'Эмоции' },
]

const SIZE = 300
const C = SIZE / 2
const R = 104
const RINGS = [0.2, 0.4, 0.6, 0.8, 1]

function axisPoint(i, frac) {
  const angle = (Math.PI / 3) * i - Math.PI / 2
  return [C + Math.cos(angle) * R * frac, C + Math.sin(angle) * R * frac]
}

export default function RadarChart({ values, className = '' }) {
  const hasData = values && AXES.every((a) => Number(values[a.key]) > 0)
  const ringLabelAnchor = axisPoint(0, 1.12)

  return (
    <div className={`relative ${className}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto overflow-visible">
        {/* Кольца сетки + оцифровка по вертикальной оси */}
        {RINGS.map((frac) => {
          const [lx, ly] = axisPoint(0, frac)
          return (
            <g key={frac}>
              <polygon
                points={AXES.map((_, i) => axisPoint(i, frac).join(',')).join(' ')}
                fill="none"
                stroke={frac === 1 ? 'rgba(187,243,81,0.28)' : 'rgba(187,243,81,0.1)'}
                strokeWidth="1"
                strokeDasharray={frac === 1 ? 'none' : '2 3'}
              />
              <text
                x={lx - 6}
                y={ly + 3}
                textAnchor="end"
                fontSize="7"
                fill="#525252"
                fontFamily="Source Code Pro, monospace"
              >
                {Math.round(frac * 10)}
              </text>
            </g>
          )
        })}

        {/* Тики внешнего контура: по 3 на каждую ось-дугу */}
        {AXES.map((_, i) =>
          [0.06, 0.5, 0.94].map((t) => {
            const a0 = (Math.PI / 3) * i - Math.PI / 2
            const a = a0 + (Math.PI / 3) * t
            const x1 = C + Math.cos(a) * (R + 2)
            const y1 = C + Math.sin(a) * (R + 2)
            const x2 = C + Math.cos(a) * (R + 6)
            const y2 = C + Math.sin(a) * (R + 6)
            return (
              <line key={`${i}-${t}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(187,243,81,0.3)" strokeWidth="1" />
            )
          })
        )}

        {/* Оси */}
        {AXES.map((_, i) => {
          const [x, y] = axisPoint(i, 1)
          return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(187,243,81,0.12)" strokeWidth="1" />
        })}

        {/* Полигон данных: заливка + двойной контур */}
        {hasData && (
          <>
            <motion.polygon
              points={AXES.map((a, i) => axisPoint(i, Number(values[a.key]) / 10).join(',')).join(' ')}
              fill="rgba(187,243,81,0.14)"
              stroke="none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: `${C}px ${C}px` }}
            />
            <motion.polygon
              points={AXES.map((a, i) => axisPoint(i, Number(values[a.key]) / 10).join(',')).join(' ')}
              fill="none"
              stroke="rgba(187,243,81,0.35)"
              strokeWidth="5"
              strokeLinejoin="round"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              style={{ transformOrigin: `${C}px ${C}px` }}
            />
            <motion.polygon
              points={AXES.map((a, i) => axisPoint(i, Number(values[a.key]) / 10).join(',')).join(' ')}
              fill="none"
              stroke="#BBF351"
              strokeWidth="1.5"
              strokeLinejoin="round"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              style={{ transformOrigin: `${C}px ${C}px` }}
            />
          </>
        )}

        {/* Точки-мишени: точка + тонкое кольцо */}
        {hasData && AXES.map((a, i) => {
          const [x, y] = axisPoint(i, Number(values[a.key]) / 10)
          const isPeak = Number(values[a.key]) === Math.max(...AXES.map((ax) => Number(values[ax.key])))
          return (
            <motion.g
              key={a.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 + i * 0.08 }}
            >
              <circle cx={x} cy={y} r={isPeak ? 4 : 3} fill="#0A0D07" stroke="#BBF351" strokeWidth="1.5" />
              <circle cx={x} cy={y} r="1.4" fill="#BBF351" />
              {isPeak && <circle cx={x} cy={y} r="7.5" fill="none" stroke="rgba(187,243,81,0.35)" strokeWidth="1" strokeDasharray="2 2" />}
            </motion.g>
          )
        })}

        {/* Подписи осей: текст + значение отдельным моно-тспеном */}
        {AXES.map((a, i) => {
          const [x, y] = axisPoint(i, 1.26)
          const anchor = Math.abs(x - C) < 10 ? 'middle' : x > C ? 'start' : 'end'
          return (
            <text
              key={a.key}
              x={x}
              y={y}
              textAnchor={anchor}
              fontSize="8.5"
              fontFamily="Inter, sans-serif"
              fontWeight="600"
              fill="#707070"
              letterSpacing="0.04em"
            >
              {a.label.toUpperCase()}
            </text>
          )
        })}
        {/* значения под подписями */}
        {hasData && AXES.map((a, i) => {
          const [x, y] = axisPoint(i, 1.26)
          const anchor = Math.abs(x - C) < 10 ? 'middle' : x > C ? 'start' : 'end'
          return (
            <text
              key={`v-${a.key}`}
              x={x}
              y={y + 11}
              textAnchor={anchor}
              fontSize="9"
              fontFamily="Source Code Pro, monospace"
              fontWeight="700"
              fill="#BBF351"
            >
              {Number(values[a.key]).toFixed(1)}
            </text>
          )
        })}
      </svg>

      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center hatch">
          <span className="text-[10px] text-text-muted font-mono bg-[#070905] px-2 py-0.5 border border-brand-medium/50">нет данных</span>
        </div>
      )}
    </div>
  )
}
