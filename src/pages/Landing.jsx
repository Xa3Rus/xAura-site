import { useContext, useState, useEffect, useRef } from 'react'
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

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/5 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
    </div>
  )
}

function AnimeStrip({ anime }) {
  const topAnime = anime.slice(0, 20)
  return (
    <div className="relative overflow-hidden py-4 mb-20">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-dark-900 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-dark-900 to-transparent z-10" />
      <div className="flex gap-3 animate-scroll">
        {[...topAnime, ...topAnime].map((a, i) => (
          <div key={`${a.id}-${i}`} className="flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden relative group">
            <img
              src={a.image?.original ? `https://shikimori.one${a.image.original}` : ''}
              alt={a.russian || a.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
              <span className="text-[10px] text-white font-medium truncate">{a.russian || a.name}</span>
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
      <FloatingOrbs />

      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 relative">
        <motion.div
          className="text-center max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
          >
            <h1 className="text-7xl sm:text-9xl font-black mb-6 tracking-tight">
              <span className="text-gradient">x</span>Aura
            </h1>
          </motion.div>

          <motion.p
            className="text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Платформа для оценки аниме.<br />
            Tier List, Битва, Каталог — всё в одном месте.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {user ? (
              <Link to="/catalog" className="gradient-btn text-lg !px-10 !py-4">
                Начать оценку
              </Link>
            ) : (
              <>
                <Link to="/register" className="gradient-btn text-lg !px-10 !py-4">
                  Начать бесплатно
                </Link>
                <Link to="/catalog" className="gradient-btn-outline text-lg !px-10 !py-4">
                  Смотреть каталог
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-16 max-w-2xl mx-auto">
          <motion.div
            className="glass-card p-6 text-center glow-purple"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-2">
              <AnimatedCounter target={animeCount} />
            </div>
            <div className="text-sm text-gray-400">Тайтлов в каталоге</div>
          </motion.div>
          <motion.div
            className="glass-card p-6 text-center glow-purple"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-3xl sm:text-4xl font-black text-cyan-400 mb-2">
              <AnimatedCounter target={userCount} />
            </div>
            <div className="text-sm text-gray-400">Пользователей</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
          {[
            { icon: '⭐', title: 'Оценка', desc: 'Детальная оценка по 6 критериям — рисунок, идея, реализация, персонажи, сюжет, эмоции', color: 'from-purple-500/20 to-transparent' },
            { icon: '⚔️', title: 'Битва', desc: 'Угадывай какое аниме рейтинг выше. Соревнуйся с другими и бей рекорды', color: 'from-cyan-500/20 to-transparent' },
            { icon: '📊', title: 'Tier List', desc: 'Составляй персональный рейтинг аниме в формате таблицы', color: 'from-green-500/20 to-transparent' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="glass-card p-8 text-center group hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {topAnime.length > 0 && <AnimeStrip anime={topAnime} />}

        {leaderboard.length > 0 && (
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-3">
                🏆 Топ игроков
              </h2>
              <p className="text-gray-400">Лучшие в Битве аниме</p>
            </div>

            <div className="glass-card overflow-hidden max-w-2xl mx-auto">
              <div className="divide-y divide-white/5">
                {leaderboard.map((entry, i) => (
                  <Link
                    key={entry.user_id}
                    to={`/user/${entry.user_id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors duration-200 group"
                  >
                    <span className="text-xl w-8 text-center font-bold">
                      {i < 3 ? medals[i] : <span className="text-gray-500">{i + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold group-hover:text-purple-400 transition-colors truncate block">
                        {entry.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold text-lg">{entry.best_score}</span>
                      <span className="text-gray-500 text-sm">очков</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <Link to="/battle" className="gradient-btn-outline">
                Присоединяйся к битве
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
