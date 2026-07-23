import { useContext, useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'

function AnimatedCounter({ target, duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.05,
    })), [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-purple-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.07] rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/[0.05] rounded-full blur-[120px]" />
    </div>
  )
}

function AnimeStrip({ anime }) {
  return (
    <div className="relative overflow-hidden py-6 mb-20 -mx-4">
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#0a0a14] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#0a0a14] to-transparent z-10" />
      <div className="flex gap-3 animate-scroll">
        {[...anime, ...anime].map((a, i) => (
          <div key={`${a.id}-${i}`} className="flex-shrink-0 w-[120px] h-[170px] rounded-xl overflow-hidden relative group shadow-lg shadow-black/20">
            <img
              src={a.image?.original ? `https://shikimori.one${a.image.original}` : ''}
              alt={a.russian || a.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
              <div>
                <span className="text-[10px] text-white font-medium line-clamp-2 block leading-tight">{a.russian || a.name}</span>
                <span className="text-[9px] text-purple-300 font-bold">★ {Number(a.score).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Landing() {
  const { user } = useContext(AuthContext)
  const [leaderboard, setLeaderboard] = useState([])
  const [animeCount, setAnimeCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [topAnime, setTopAnime] = useState([])

  useEffect(() => {
    loadAnimeData().then((data) => {
      setAnimeCount(data.length)
      const top = data
        .filter((a) => a.score > 0 && a.image?.original && !a.image.original.includes('missing_'))
        .sort((a, b) => Number(b.score) - Number(a.score))
        .slice(0, 30)
      setTopAnime(top)
    })

    const fetchStats = async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      setUserCount(count || 0)

      const { data: games } = await supabase
        .from('battle_games')
        .select('user_id, score')
        .order('score', { ascending: false })
        .limit(50)

      if (!games?.length) return

      const bestByUser = {}
      for (const g of games) {
        if (!bestByUser[g.user_id] || g.score > bestByUser[g.user_id]) {
          bestByUser[g.user_id] = g.score
        }
      }

      const userIds = Object.keys(bestByUser)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      const profileMap = {}
      for (const p of profiles || []) profileMap[p.id] = p.username

      const sorted = Object.entries(bestByUser)
        .map(([user_id, best_score]) => ({
          user_id,
          username: profileMap[user_id] || 'Unknown',
          best_score,
        }))
        .sort((a, b) => b.best_score - a.best_score)
        .slice(0, 10)

      setLeaderboard(sorted)
    }
    fetchStats()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen relative">
      <Particles />

      <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 relative">
        <motion.div
          className="text-center max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-7xl sm:text-[120px] font-black mb-6 tracking-tighter leading-none">
              <span className="text-gradient">x</span>Aura
            </h1>
          </motion.div>

          <motion.p
            className="text-lg sm:text-xl text-gray-400/80 mb-12 leading-relaxed max-w-lg mx-auto font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Оценивай аниме. Составляй Tier List.<br />
            Бросай вызов в Битве.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {user ? (
              <Link to="/catalog" className="gradient-btn text-base !px-10 !py-4">
                Перейти в каталог
              </Link>
            ) : (
              <>
                <Link to="/register" className="gradient-btn text-base !px-10 !py-4">
                  Начать бесплатно
                </Link>
                <Link to="/catalog" className="gradient-btn-outline text-base !px-10 !py-4">
                  Смотреть каталог
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center pt-1.5">
            <motion.div
              className="w-1 h-2 bg-white/40 rounded-full"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-20 max-w-xl mx-auto">
          <motion.div
            className="glass-card p-6 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-3xl sm:text-4xl font-black text-gradient-static mb-2">
              <AnimatedCounter target={animeCount} />
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Тайтлов</div>
          </motion.div>
          <motion.div
            className="glass-card p-6 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-3xl sm:text-4xl font-black text-gradient-static mb-2">
              <AnimatedCounter target={userCount} />
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Пользователей</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-24">
          {[
            { icon: '⭐', title: 'Оценка', desc: '6 критериев для детальной оценки каждого аниме', gradient: 'from-purple-500/10' },
            { icon: '⚔️', title: 'Битва', desc: 'Угадывай рейтинг и соревнуйся с другими', gradient: 'from-cyan-500/10' },
            { icon: '📊', title: 'Tier List', desc: 'Сортируй аниме по своим тирам', gradient: 'from-green-500/10' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="glass-card-hover p-7 text-center relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${item.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className="text-3xl mb-4 inline-block">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {topAnime.length > 0 && <AnimeStrip anime={topAnime} />}

        {leaderboard.length > 0 && (
          <motion.div
            className="mb-24"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Топ игроков</h2>
              <p className="text-gray-500 text-sm">Лучшие в Битве аниме</p>
            </div>

            <div className="glass-card overflow-hidden max-w-xl mx-auto divide-y divide-white/[0.04]">
              {leaderboard.map((entry, i) => (
                <Link
                  key={entry.user_id}
                  to={`/user/${entry.user_id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-all duration-200 group"
                >
                  <span className="text-base w-7 text-center font-bold">
                    {i < 3 ? medals[i] : <span className="text-gray-600 text-sm">{i + 1}</span>}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-purple-300">{entry.username[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium group-hover:text-purple-400 transition-colors truncate block">
                      {entry.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-purple-400 font-bold">{entry.best_score}</span>
                    <span className="text-gray-600 text-xs">очк.</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/battle" className="gradient-btn-outline text-sm">
                Присоединяйся к битве
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
