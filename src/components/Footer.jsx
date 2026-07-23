import { useState, useEffect, useRef } from 'react'
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

export default function Footer() {
  const [animeCount, setAnimeCount] = useState(0)
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    loadAnimeData().then((data) => setAnimeCount(data.length))
    supabase.from('profiles').select('*', { count: 'exact', head: true }).then(({ count }) => setUserCount(count || 0))
  }, [])

  return (
    <footer className="mt-auto py-8 px-5 sm:px-8" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>x</span>
              <span className="text-amber-400">Aura</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.06)' }}>·</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(255,255,255,0.12)' }}>2025</span>
            <span style={{ color: 'rgba(255,255,255,0.06)' }}>·</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)' }}>Данные <a href="https://shikimori.one" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>Shikimori</a></span>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ fontFamily: 'JetBrains Mono' }}>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}><span className="text-amber-400 font-bold">{animeCount.toLocaleString()}</span> тайтлов</span>
            <span style={{ color: 'rgba(255,255,255,0.06)' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}><span className="text-mint-400 font-bold">{userCount}</span> {userCount === 1 ? 'пользователь' : userCount < 5 ? 'пользователя' : 'пользователей'}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
