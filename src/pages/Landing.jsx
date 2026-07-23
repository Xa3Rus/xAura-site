import { useContext, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'

function AnimeStrip({ anime }) {
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-surface-0 to-transparent z-10 rounded-l-2xl" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface-0 to-transparent z-10 rounded-r-2xl" />
      <div className="flex gap-2.5 animate-scroll py-3 px-3">
        {[...anime, ...anime].map((a, i) => (
          <div key={`${a.id}-${i}`} className="flex-shrink-0 w-[120px] h-[170px] rounded-xl overflow-hidden relative group" style={{ background: '#18181c' }}>
            <img
              src={a.image?.original ? `https://shikimori.one${a.image.original}` : ''}
              alt={a.russian || a.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <span className="text-[10px] text-white font-medium line-clamp-2 block leading-tight mb-0.5">{a.russian || a.name}</span>
              <span className="text-[9px] text-amber-400 font-bold" style={{ fontFamily: 'JetBrains Mono' }}>★ {Number(a.score).toFixed(2)}</span>
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

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 relative z-10 pt-20">
        {topAnime.length > 0 && (
          <div className="mb-8">
            <AnimeStrip anime={topAnime} />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-16">
          {[
            { title: 'Оценка', desc: '6 критериев для детальной оценки', to: '/rate', img: '/img000/Octsenka.png' },
            { title: 'Битва', desc: 'Угадывай рейтинг', to: '/battle', img: '/img000/Battle.png' },
            { title: 'Tier List', desc: 'Сортируй по тирам', to: '/tiermaker', img: '/img000/tierlist.png' },
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
                className="block relative rounded-2xl overflow-hidden group h-[200px] sm:h-[220px]"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {item.img ? (
                  <img
                    src={item.img}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-surface-3" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-semibold text-sm mb-0.5 group-hover:text-amber-400 transition-colors duration-300">{item.title}</h3>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.desc}</p>
                </div>
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

            <div className="rounded-2xl overflow-hidden max-w-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {leaderboard.map((entry, i) => (
                <Link
                  key={entry.user_id}
                  to={`/user/${entry.user_id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-all duration-200 group relative"
                  style={{ borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                >
                  <span className="w-7 text-center text-xs font-bold" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono' }}>
                    {i < 3 ? medals[i] : `${i + 1}`}
                  </span>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:shadow-glow-amber" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(249,115,22,0.06) 100%)', border: '1px solid rgba(251,191,36,0.12)' }}>
                    <span className="text-[10px] font-bold text-amber-400">{entry.username[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {entry.username}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono' }}>{entry.best_score}</span>
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <Link to="/battle" className="btn-ghost text-xs !py-2.5">
                Присоединяйся к битве →
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
