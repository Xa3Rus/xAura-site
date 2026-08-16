import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'framer-motion'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'

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
    links: [
      { label: 'Каталог', to: '/catalog' },
      { label: 'Тир-лист', to: '/tier-templates' },
      { label: 'Битва', to: '/battle' },
      { label: 'Угадай OP/ED', to: '/anime-oped' },
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
    <footer className="mt-auto relative border-t border-neon-400/20 bg-surface-0/80">
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(187, 243, 81, 0.5), transparent)' }}
      />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10">
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
              <span className="w-1.5 h-1.5 rounded-full bg-success-DEFAULT animate-pulse" />
              <span className="font-mono text-[10px] text-text-muted">сервис активен</span>
            </div>
          </div>

          {/* Nav */}
          {NAV.map((col) => (
            <div key={col.title}>
              <h3 className="label !mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-xs text-text-secondary hover:text-neon-400 transition-colors inline-flex items-center gap-1.5 group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-neon-400 transition-all duration-200" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Stats */}
          <div>
            <h3 className="label !mb-4">Статистика</h3>
            <div className="font-mono text-xs space-y-2.5">
              <div>
                <span className="text-neon-400 font-bold text-base"><Counter target={animeCount} /></span>
                <span className="text-text-muted"> тайтлов</span>
              </div>
              <div>
                <span className="text-cyan-400 font-bold text-base"><Counter target={userCount} /></span>
                <span className="text-text-muted"> {userCount === 1 ? 'пользователь' : userCount < 5 ? 'пользователя' : 'пользователей'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-5 border-t border-neon-400/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-[10px] text-text-muted">© 2025 xAura</span>
          <span className="text-[10px] text-text-muted">
            Данные:{' '}
            <a
              href="https://shikimori.one"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neon-400 transition-colors font-medium text-text-secondary"
            >
              Shikimori
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
