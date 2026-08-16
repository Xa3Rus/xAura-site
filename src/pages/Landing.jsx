import { useContext, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'

function AnimeStrip({ anime }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-neon-400/15 bg-surface-1/80 backdrop-blur-sm">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-surface-0 to-transparent z-10 rounded-l-lg" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface-0 to-transparent z-10 rounded-r-lg" />
      <div className="flex gap-2.5 animate-scroll py-3 px-3">
        {[...anime, ...anime].map((a, i) => (
          <div key={`${a.id}-${i}`} className="flex-shrink-0 w-[120px] h-[170px] rounded-md overflow-hidden relative group bg-surface-2">
            <img
              src={a.image?.original ? `https://shikimori.one${a.image.original}` : ''}
              alt={a.russian || a.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <span className="text-[10px] text-white font-medium line-clamp-2 block leading-tight mb-0.5">{a.russian || a.name}</span>
              <span className="text-[9px] text-neon-400 font-bold font-mono">★ {Number(a.score).toFixed(2)}</span>
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
  const [topAnime, setTopAnime] = useState([])

  useEffect(() => {
    loadAnimeData().then((data) => {
      const top = data
        .filter((a) => a.score > 0 && a.image?.original && !a.image.original.includes('missing_'))
        .sort((a, b) => Number(b.score) - Number(a.score))
        .slice(0, 30)
      setTopAnime(top)
    })

    const fetchStats = async () => {
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

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 relative z-10 pt-24">

        <motion.section
          className="hero-panel relative overflow-hidden px-6 sm:px-12 py-14 sm:py-20 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 neon-grid pointer-events-none" />
          <div className="relative max-w-3xl">
            <span className="label block mb-4">АНИМЕ · ОЦЕНКИ · ТИР-ЛИСТЫ · БИТВЫ</span>
            <h1 className="font-display font-bold text-white text-4xl sm:text-6xl leading-[1.05] tracking-wide mb-5">
              Оценивай. Ранжируй. <span className="text-neon-400">Сражайся.</span>
            </h1>
            <p className="text-base sm:text-xl text-white/75 mb-8 max-w-2xl">
              15 000+ тайтлов, детальная оценка по 6 критериям, тир-листы и музыкальные битвы — вся аниме-вселенная в одном неоновом месте.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to={user ? '/rate' : '/register'} className="btn-primary btn-shine">
                Начать оценку
              </Link>
              <Link to="/catalog" className="btn-ghost">
                Открыть каталог
              </Link>
            </div>
          </div>
        </motion.section>

        {topAnime.length > 0 && (
          <div className="mb-10">
            <AnimeStrip anime={topAnime} />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-16">
          {[
            { title: 'Оценка', desc: '6 критериев для детальной оценки', to: '/rate', img: '/img000/Octsenka.png' },
            { title: 'Битва', desc: 'Угадывай рейтинг', to: '/battle', img: '/img000/Battle.png' },
            { title: 'Шаблоны', desc: 'Готовые tier list шаблоны', to: '/tier-templates', img: '/img000/tierlist.png' },
            { title: 'Каталог', desc: '15 000+ тайтлов', to: '/catalog', img: '/img000/catalog.png' },
            { title: 'Угадай OP/ED', desc: '3200+ треков по музыке', to: '/anime-oped', img: '/img000/OPEDGuess.png' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={item.to}
                className="block relative rounded-lg overflow-hidden group h-[200px] sm:h-[220px] border border-neon-400/15 hover:border-neon-400 hover:shadow-glow-neon transition-all duration-300"
              >
                {item.img ? (
                  <img
                    src={item.img}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-surface-2" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display font-semibold text-sm mb-0.5 text-white group-hover:text-neon-400 transition-colors duration-300">{item.title}</h3>
                  <p className="text-[10px] text-white/50">{item.desc}</p>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 30px rgba(187, 243, 81, 0.12)' }}
                />
              </Link>
            </motion.div>
          ))}
        </div>

        {leaderboard.length > 0 && (
          <motion.div
            className="mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="section-title">Топ игроков</h2>
              <span className="label">Битва</span>
            </div>

            <div className="card overflow-hidden max-w-2xl">
              {leaderboard.map((entry, i) => (
                <Link
                  key={entry.user_id}
                  to={`/user/${entry.user_id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-neon-400/5 transition-all duration-200 group relative"
                  style={{ borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(187, 243, 81, 0.08)' : 'none' }}
                >
                  <span className={`w-7 text-center text-xs font-bold font-display ${i < 3 ? 'text-neon-400' : 'text-text-subtle'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:shadow-glow-neon bg-brand-softer border-2 border-brand-medium">
                    <span className="text-[10px] font-bold text-neon-300">{entry.username[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block transition-colors duration-200 text-text-secondary group-hover:text-text">
                      {entry.username}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-neon-400 font-mono">{entry.best_score}</span>
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <Link to="/battle" className="btn-ghost btn-shine text-xs !py-2.5">
                Присоединяйся к битве →
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
