import { useContext, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

export default function Landing() {
  const { user } = useContext(AuthContext)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    const fetchLeaderboard = async () => {
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
      for (const p of profiles || []) {
        profileMap[p.id] = p.username
      }

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
    fetchLeaderboard()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen">
      <div className="min-h-[85vh] flex items-center justify-center px-4">
        <div className="text-center max-w-2xl animate-fade-in">
          <motion.h1
            className="text-6xl sm:text-8xl font-black mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-purple-500">x</span>Aura
          </motion.h1>
          <motion.p
            className="text-xl text-gray-400 mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Современная платформа для оценки аниме.<br />
            Составляй Tier List, бросай вызов в Битве.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-20">
          {[
            { icon: '⭐', title: 'Оценка', desc: 'Оценивай аниме по 6 критериям с детальной шкалой' },
            { icon: '📊', title: 'Tier List', desc: 'Составляй персональный рейтинг в формате Tier List' },
            { icon: '⚔️', title: 'Битва', desc: 'Угадывай какое аниме рейтинг выше и бей рекорды' },
            { icon: '🏆', title: 'Лидеры', desc: 'Соревнуйся с другими пользователями' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="glass-card p-6 text-center hover:border-purple-500/30 transition-colors duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {leaderboard.length > 0 && (
          <motion.div
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
