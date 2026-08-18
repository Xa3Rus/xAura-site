import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'
import { AURA_CHARACTERS } from '../data/auraCharacters'
import { Corners } from './profile/SharedBits'

function Counter({ target }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || !target) return
    let start = 0
    const step = target / 40
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

const NAV = [
  {
    title: 'Разделы',
    index: '01',
    links: [
      { label: 'Каталог', to: '/catalog', code: 'DB' },
      { label: 'Тир-лист', to: '/tier-templates', code: 'TIR' },
      { label: 'Битва', to: '/battle', code: 'PVP' },
      { label: 'Угадай OP/ED', to: '/anime-oped', code: 'OPD' },
    ],
  },
]

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

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10">
        {/* системная лента */}
        <div className="flex items-center gap-3 mb-8">
          <span className="dossier-note !text-neon-400/70 whitespace-nowrap">xAURA // FOOTER</span>
          <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/60 via-brand-medium/20 to-transparent" />
          <span className="dossier-note hidden sm:inline">канал связи закрыт</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link to="/" className="inline-flex items-baseline gap-1 font-display font-bold text-xl tracking-tight group">
              <span className="text-text-muted group-hover:text-text transition-colors">x</span>
              <span className="text-neon-400 drop-shadow-[0_0_12px_rgba(187,243,81,0.35)]">Aura</span>
            </Link>
            <p className="mt-3 text-xs text-text-muted leading-relaxed max-w-xs">
              Оценивай. Ранжируй. Сражайся. Вся аниме-вселенная в одном неоновом месте.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-success-DEFAULT animate-pulse" />
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.14em]">sys: online</span>
            </div>
          </div>

          {/* Nav */}
          {NAV.map((col) => (
            <div key={col.title}>
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-[9px] font-bold text-text-subtle">{col.index}</span>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary font-semibold">{col.title}</h3>
              </div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-xs text-text-secondary hover:text-neon-400 transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="font-mono text-[8px] text-text-subtle group-hover:text-neon-400/60 transition-colors">{l.code}</span>
                      <span className="w-0 group-hover:w-2 h-px bg-neon-400 transition-all duration-200" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Stats — приборные показания */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[9px] font-bold text-text-subtle">02</span>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary font-semibold">Телеметрия</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'тайтлов', value: animeCount, color: '#BBF351', code: 'DB' },
                { label: userCount === 1 ? 'пользователь' : userCount < 5 ? 'пользователя' : 'пользователей', value: userCount, color: '#00E5FF', code: 'USR' },
              ].map((s) => (
                <div
                  key={s.code}
                  className="cut-wrap cut-sm w-fit min-w-[130px]"
                  style={{ background: `linear-gradient(150deg, ${s.color}26, rgba(45,74,15,0.2))` }}
                >
                  <div className="cut-inner cut-sm relative bg-[#0A0A0A] px-3 py-2 overflow-hidden">
                    <div className="absolute bottom-0 inset-x-0 h-1.5 gauge-ticks opacity-25" />
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono font-bold text-sm" style={{ color: s.color }}><Counter target={s.value} /></span>
                      <span className="font-mono text-[8px] text-text-subtle">{s.code}</span>
                    </div>
                    <span className="block mt-0.5 text-[8px] uppercase tracking-[0.14em] font-mono text-text-subtle">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative pt-5 border-t border-brand-medium/40">
          <Corners size={8} inset={-1} color="rgba(187,243,81,0.3)" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.14em]">© 2025 xAura</span>
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
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
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
