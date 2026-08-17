import { motion } from 'framer-motion'

// Радарная диаграмма 6 критериев оценки — чистый SVG без зависимостей
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
const R = 108
const RINGS = [0.25, 0.5, 0.75, 1]

function axisPoint(i, frac) {
  const angle = (Math.PI / 3) * i - Math.PI / 2
  return [C + Math.cos(angle) * R * frac, C + Math.sin(angle) * R * frac]
}

export default function RadarChart({ values, className = '' }) {
  const hasData = values && AXES.every((a) => Number(values[a.key]) > 0)

  return (
    <div className={`relative ${className}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto overflow-visible">
        {/* Кольца сетки */}
        {RINGS.map((frac) => (
          <polygon
            key={frac}
            points={AXES.map((_, i) => axisPoint(i, frac).join(',')).join(' ')}
            fill="none"
            stroke="rgba(187,243,81,0.12)"
            strokeWidth="1"
          />
        ))}
        {/* Оси */}
        {AXES.map((_, i) => {
          const [x, y] = axisPoint(i, 1)
          return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(187,243,81,0.1)" strokeWidth="1" />
        })}

        {/* Полигон данных */}
        {hasData && (
          <motion.polygon
            points={AXES.map((a, i) => axisPoint(i, Number(values[a.key]) / 10).join(',')).join(' ')}
            fill="rgba(187,243,81,0.18)"
            stroke="#BBF351"
            strokeWidth="2"
            strokeLinejoin="round"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${C}px ${C}px` }}
          />
        )}

        {/* Точки и подписи значений */}
        {hasData && AXES.map((a, i) => {
          const [x, y] = axisPoint(i, Number(values[a.key]) / 10)
          return (
            <motion.g
              key={a.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              <circle cx={x} cy={y} r="3.5" fill="#BBF351" />
              <circle cx={x} cy={y} r="7" fill="none" stroke="rgba(187,243,81,0.3)" strokeWidth="1" />
            </motion.g>
          )
        })}

        {/* Подписи осей */}
        {AXES.map((a, i) => {
          const [x, y] = axisPoint(i, 1.22)
          const anchor = Math.abs(x - C) < 10 ? 'middle' : x > C ? 'start' : 'end'
          return (
            <text
              key={a.key}
              x={x}
              y={y + 3}
              textAnchor={anchor}
              className="fill-text-muted"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              fontWeight="600"
            >
              {a.label}
              {hasData && (
                <tspan fill="#BBF351" fontFamily="Source Code Pro, monospace" fontWeight="700">
                  {' '}{Number(values[a.key]).toFixed(1)}
                </tspan>
              )}
            </text>
          )
        })}
      </svg>

      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-text-muted font-mono">нет оценок</span>
        </div>
      )}
    </div>
  )
}
