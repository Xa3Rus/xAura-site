import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInView, motion } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'
import { AURA_CHARACTERS } from '../data/auraCharacters'
import { Corners } from './profile/SharedBits'

const TELEMETRY = [
  { label: 'Тайтлы в каталоге', code: 'DB / INDEX', color: '#BBF351', icon: '◈', getValue: (data) => data.animeCount, format: (value) => value.toLocaleString('ru-RU'), note: 'активная база' },
  { label: 'Пользователи', code: 'USR / NODE', color: '#00E5FF', icon: '◎', getValue: (data) => data.userCount, format: (value) => value.toLocaleString('ru-RU'), note: 'зарегистрировано' },
  { label: 'Режимы', code: 'MOD / LIVE', color: '#33EBD4', icon: '△', getValue: () => 6, format: (value) => String(value).padStart(2, '0'), note: 'доступно сейчас' },
  { label: 'Система', code: 'SYS / OK', color: '#00CC88', icon: '✓', getValue: () => 100, format: (value) => `${value}%`, note: 'все каналы онлайн' },
]

function TelemetryCard({ metric, data, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })
  const target = metric.getValue(data)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let frame
    const started = performance.now()
    const duration = 850
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, target])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="group relative overflow-hidden border border-brand-medium/70 bg-[#0A0D07] p-4 sm:p-5 hover:border-neon-400/50 transition-colors duration-300"
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: metric.color }} />
      <div className="absolute -right-8 -top-8 text-7xl font-display opacity-[0.035] transition-transform duration-500 group-hover:scale-110" style={{ color: metric.color }}>{metric.icon}</div>
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[9px] font-bold tracking-[0.16em] text-text-muted">{metric.code}</span>
          <h3 className="mt-2 text-sm text-text-secondary group-hover:text-text transition-colors">{metric.label}</h3>
        </div>
        <span className="font-mono text-[10px] font-bold" style={{ color: metric.color }}>LIVE</span>
      </div>
      <div className="relative mt-5 flex items-end justify-between gap-3">
        <span className="font-display text-3xl sm:text-4xl font-bold leading-none" style={{ color: metric.color }}>{metric.format(value)}</span>
        <span className="text-right font-mono text-[9px] leading-relaxed text-text-muted">{metric.note}</span>
      </div>
      <div className="relative mt-4 h-1 overflow-hidden bg-surface-3">
        <motion.div className="h-full" style={{ background: metric.color }} initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 0.9, delay: index * 0.08 }} />
      </div>
    </motion.div>
  )
}

export default function Footer() {
  const [animeCount, setAnimeCount] = useState(0)
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    loadAnimeData().then((data) => setAnimeCount(data.length))
    supabase.from('profiles').select('*', { count: 'exact', head: true }).then(({ count }) => setUserCount(count || 0))
  }, [])

  return (
    <footer className="mt-auto relative bg-[#070905]">
      {/* приборная лента-разделитель сверху */}
      <div className="h-[3px] chevron-fill opacity-50" />
      <div
        className="absolute inset-x-0 top-[3px] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(187, 243, 81, 0.5), transparent)' }}
      />

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-7 sm:py-8">
        {/* системная лента */}
        <div className="flex items-center gap-3 mb-5">
          <span className="dossier-note !text-neon-400/70 whitespace-nowrap">xAURA // FOOTER</span>
          <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/60 via-brand-medium/20 to-transparent" />
          <span className="dossier-note hidden sm:inline">канал связи закрыт</span>
        </div>

        <div className="mb-7">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-[9px] font-bold text-text-muted">01</span>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary font-semibold">Телеметрия</h3>
              </div>
              <p className="text-xs text-text-muted">Состояние xAura в реальном времени</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 font-mono text-[9px] text-success-DEFAULT uppercase tracking-[0.16em]"><span className="w-1.5 h-1.5 bg-success-DEFAULT animate-pulse" />all systems nominal</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TELEMETRY.map((metric, index) => (
              <TelemetryCard key={metric.code} metric={metric} index={index} data={{ animeCount, userCount }} />
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative pt-4 border-t border-brand-medium/40">
          <Corners size={8} inset={-1} color="rgba(187,243,81,0.3)" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-text-secondary uppercase tracking-[0.14em]">© 2025 xAura</span>
              {/* Пасхалка: Годжо наблюдает */}
              <span className="relative inline-block group/easter cursor-pointer" title="Во всём Поднебесной лишь я достоин 10/10">
                <picture>
                  <source srcSet={AURA_CHARACTERS[7].webp} type="image/webp" />
                  <img
                    src={AURA_CHARACTERS[7].gif}
                    alt="Годжо наблюдает"
                    loading="lazy"
                    className="w-5 h-5 rounded object-cover opacity-30 transition-all duration-500 group-hover/easter:opacity-100 group-hover/easter:scale-[2.2] group-hover/easter:-translate-y-1.5 group-hover/easter:shadow-[0_0_16px_rgba(123,140,255,0.7)]"
                  />
                </picture>
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary">
              данные:{' '}
              <a
                href="https://shikimori.one"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neon-400 transition-colors font-semibold text-text-secondary"
              >
                shikimori
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
