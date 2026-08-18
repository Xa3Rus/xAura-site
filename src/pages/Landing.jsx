import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { loadAnimeData } from '../utils/animeData'
import { shikimoriImg } from '../utils/imgUrl'
import { getAuraLevel } from '../utils/aura'
import { AuraLevelChip } from '../components/AuraBadge'
import { Corners, DossierPanel, SectionTitle } from '../components/profile/SharedBits'

// Техническая лента-заголовок: подпись + градиентная линейка + правая аннотация
function TechRibbon({ left, right }) {
  return (
    <div className="flex items-center gap-3">
      <span className="dossier-note !text-neon-400/75 whitespace-nowrap">{left}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/70 via-brand-medium/25 to-transparent" />
      {right && <span className="dossier-note hidden sm:inline text-right">{right}</span>}
    </div>
  )
}

function AnimeStrip({ anime }) {
  return (
    <div className="relative overflow-hidden border border-brand-medium/50 bg-[#070905]/80">
      <Corners size={9} inset={2} />
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10" />
      <div className="flex gap-2.5 animate-scroll py-3 px-3">
        {[...anime, ...anime].map((a, i) => (
          <div key={`${a.id}-${i}`} className="flex-shrink-0 w-[120px] h-[170px] rounded-sm overflow-hidden relative group bg-surface-2">
            <img
              src={shikimoriImg(a.image?.original) || ''}
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

const RANK_STYLES = [
  { medal: '#FFD700', glow: 'rgba(255, 215, 0, 0.35)', edge: 'rgba(255,215,0,0.4)', label: '1' }, // gold
  { medal: '#C0C8D4', glow: 'rgba(192, 200, 212, 0.3)', edge: 'rgba(192,200,212,0.3)', label: '2' }, // silver
  { medal: '#CD7F32', glow: 'rgba(205, 127, 50, 0.3)', edge: 'rgba(205,127,50,0.3)', label: '3' }, // bronze
]

function Avatar({ username, size = 'md', rank }) {
  const style = rank !== undefined && RANK_STYLES[rank]
    ? { borderColor: RANK_STYLES[rank].medal, boxShadow: `0 0 12px -2px ${RANK_STYLES[rank].glow}` }
    : {}
  return (
    <div
      className={`rounded-sm flex items-center justify-center flex-shrink-0 bg-brand-softer border-2 ${size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'}`}
      style={style}
    >
      <span className={`font-bold text-neon-300 ${size === 'lg' ? 'text-base' : 'text-[10px]'}`}>
        {username[0].toUpperCase()}
      </span>
    </div>
  )
}

function Leaderboard({ entries }) {
  const maxScore = entries[0]?.best_score || 1
  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)
  // visual podium order: 2nd, 1st, 3rd
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean)
  const podiumHeights = ['h-24 sm:h-28', 'h-28 sm:h-36', 'h-20 sm:h-24']
  const podiumRanks = [1, 0, 2]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Podium top-3 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end mb-4">
        {podiumOrder.map((entry, i) => {
          const rank = podiumRanks[i]
          const r = RANK_STYLES[rank]
          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.12, duration: 0.5 }}
              className="flex flex-col"
            >
              <div
                className={`cut-wrap cut-sm ${rank === 0 ? 'sm:-mt-4' : ''}`}
                style={{ background: `linear-gradient(155deg, ${r.medal}33, ${r.medal}12 45%, #2D4A0F55)` }}
              >
                <Link
                  to={`/user/${entry.user_id}`}
                  className={`cut-inner cut-sm relative bg-[#070905] flex flex-col items-center justify-center gap-1.5 px-2 pt-4 pb-3 group transition-colors duration-300 ${podiumHeights[i]}`}
                >
                  <Corners color={r.edge} size={8} inset={3} />
                  <div className="relative">
                    <span
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-display z-10"
                      style={{ background: r.medal, color: '#000' }}
                    >
                      {r.label}
                    </span>
                    <Avatar username={entry.username} size="lg" rank={rank} />
                  </div>
                  <span className="w-full text-center text-xs font-medium truncate text-text-secondary group-hover:text-text transition-colors" title={entry.username}>
                    {entry.username}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold font-mono text-neon-400">{entry.best_score}</span>
                    <AuraLevelChip level={entry.level} />
                  </div>
                </Link>
              </div>
              <div
                className={`border-x border-b h-[3px] ${rank === 0 ? 'border-yellow-400/40 bg-yellow-400/20' : rank === 1 ? 'border-slate-300/30 bg-slate-300/10' : 'border-orange-700/40 bg-orange-700/15'}`}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Rows 4–10 */}
      <div className="relative border border-brand-medium/50 bg-[#070905]/80">
        <Corners size={9} inset={2} />
        <div className="divide-y divide-brand-medium/30">
          {rest.map((entry, i) => (
            <Link
              key={entry.user_id}
              to={`/user/${entry.user_id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-neon-400/5 transition-all duration-200 group"
            >
              <span className="w-7 text-center font-mono text-[11px] font-bold text-text-subtle">
                {String(i + 4).padStart(2, '0')}
              </span>
              <Avatar username={entry.username} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block transition-colors duration-200 text-text-secondary group-hover:text-text">
                  {entry.username}
                </span>
                <div className="mt-1.5 h-[6px] bg-surface-3 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 chevron-fill opacity-60 transition-all duration-700"
                    style={{ width: `${Math.max(8, (entry.best_score / maxScore) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-neon-400 font-mono">{entry.best_score}</span>
              {entry.level != null && <AuraLevelChip level={entry.level} className="flex-shrink-0" />}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function RotatingWord() {
  const words = ['Ранжируй.', 'Сражайся.', 'Угадывай.', 'Побеждай.']
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % words.length), 2200)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="relative inline-block text-neon-400 align-baseline">
      <span className="invisible">Сражайся.</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[i]}
          className="absolute inset-0 text-neon-400 drop-shadow-[0_0_18px_rgba(187,243,81,0.45)]"
          initial={{ y: '60%', opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-60%', opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
      <span className="absolute -right-3 top-1 w-[3px] h-[0.9em] bg-neon-400 animate-pulse" />
    </span>
  )
}

// Приборные показатели: срезанный угол + шкала-риска снизу
function StatReadouts({ animeTotal }) {
  const items = [
    { value: animeTotal ? `${Math.round(animeTotal / 1000)}K+` : '15K+', label: 'тайтлов в базе', code: 'DB' },
    { value: '6', label: 'критериев оценки', code: 'CRT' },
    { value: '3200+', label: 'оп/эд треков', code: 'TRK' },
    { value: '∞', label: 'тир-листов', code: 'TIR' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl">
      {items.map((p) => (
        <div
          key={p.code}
          className="cut-wrap cut-sm"
          style={{ background: 'linear-gradient(150deg, rgba(187,243,81,0.2), rgba(45,74,15,0.25))' }}
        >
          <div className="cut-inner cut-sm relative bg-[#070905] px-3 py-2.5 overflow-hidden">
            <div className="absolute bottom-0 inset-x-0 h-1.5 gauge-ticks opacity-25" />
            <div className="flex items-baseline justify-between gap-1">
              <span className="font-display font-bold text-lg text-neon-400 leading-none">{p.value}</span>
              <span className="font-mono text-[8px] text-text-subtle">{p.code}</span>
            </div>
            <span className="block mt-1.5 text-[8px] uppercase tracking-[0.14em] font-mono text-text-subtle">{p.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function Ticker({ anime }) {
  const items = anime.slice(0, 15)
  return (
    <div className="relative overflow-hidden border-x border-b border-brand-medium/50 bg-surface-1/60 backdrop-blur-sm py-2.5">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10" />
      <div className="flex gap-8 animate-scroll w-max">
        {[...items, ...items].map((a, i) => (
          <span key={`${a.id}-${i}`} className="flex items-center gap-2 font-mono text-[11px] whitespace-nowrap">
            <span className="text-neon-400 font-bold">★ {Number(a.score).toFixed(2)}</span>
            <span className="text-text-muted">{a.russian || a.name}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// Карточка «аура-фармера» для гостей: гифка Субару + плавающие XP-чипы,
// обыгрывающие систему уровней сайта
function AuraFarmerCard() {
  const chips = [
    { text: '+12 XP · оценка', className: '-top-3 -left-5', delay: 0, dy: -7 },
    { text: '+40 XP · тир-лист', className: 'top-1/3 -right-6', delay: 0.6, dy: 6 },
    { text: '+8 XP · битва', className: '-bottom-4 left-8', delay: 1.1, dy: -6 },
  ]
  return (
    <motion.div
      className="relative flex-shrink-0 hidden lg:block"
      initial={{ opacity: 0, scale: 0.85, rotate: 6 }}
      animate={{ opacity: 1, scale: 1, rotate: 2 }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="absolute -inset-3 bg-gradient-to-br from-neon-400/25 via-transparent to-cyan-400/20 blur-xl pointer-events-none" />
        <div
          className="cut-wrap cut-lg relative w-[300px] xl:w-[330px]"
          style={{ background: 'linear-gradient(160deg, rgba(187,243,81,0.45), rgba(45,74,15,0.45))' }}
        >
          <div className="cut-inner cut-lg relative overflow-hidden bg-surface-1">
            <picture>
              <source srcSet="https://i.giphy.com/media/mSVGTMHDu6NoXkmcpJ/giphy.webp" type="image/webp" />
              <img
                src="https://media.giphy.com/media/mSVGTMHDu6NoXkmcpJ/giphy.gif"
                alt="Субару Нацики фармит ауру"
                className="w-full aspect-[4/5] object-cover"
              />
            </picture>
            <div className="absolute inset-0 scanlines pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 p-3.5 pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end justify-between gap-2">
              <div className="min-w-0">
                <span className="block font-mono text-[9px] text-neon-300/80 uppercase tracking-widest">aura farmer mode</span>
                <span className="block font-display font-bold text-sm text-white truncate" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>
                  СУБАРУ-СЭМПАЙ
                </span>
              </div>
              <motion.span
                className="px-2 py-1 bg-neon-400 text-black font-mono text-[10px] font-bold flex-shrink-0"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                +∞ AURA
              </motion.span>
            </div>
          </div>
        </div>

        {chips.map((c) => (
          <motion.div
            key={c.text}
            className={`absolute ${c.className} px-2.5 py-1.5 bg-surface-1/95 backdrop-blur-md border border-neon-400/35 font-mono text-[10px] font-bold text-neon-300 shadow-glow-neon whitespace-nowrap z-10`}
            animate={{ y: [0, c.dy, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
          >
            {c.text}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

// Глаз Гасса Лелуша — «приказываю» для секции «Твой вкус. Твои правила.»
function GeassBadge() {
  return (
    <motion.div
      className="relative inline-flex items-center justify-center mb-4"
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
    >
      <motion.div
        className="absolute w-20 h-20 rounded-full border border-accent-purple/30"
        animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute w-20 h-20 rounded-full border border-accent-purple/20"
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
      />
      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-accent-purple/50 shadow-[0_0_24px_-4px_rgba(191,90,242,0.55)]">
        <picture>
          <source srcSet="https://i.giphy.com/media/e9U5tYwBssdLG/giphy.webp" type="image/webp" />
          <img src="https://media.giphy.com/media/e9U5tYwBssdLG/giphy.gif" alt="Глаз Гасса Лелуша" className="w-full h-full object-cover" />
        </picture>
      </div>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-px bg-surface-1/95 backdrop-blur-sm border border-accent-purple/30 font-mono text-[8px] uppercase tracking-widest text-accent-purple whitespace-nowrap">
        geass
      </span>
    </motion.div>
  )
}

export default function Landing() {
  const { user } = useContext(AuthContext)
  const [leaderboard, setLeaderboard] = useState([])
  const [topAnime, setTopAnime] = useState([])
  const [animeTotal, setAnimeTotal] = useState(0)

  useEffect(() => {
    loadAnimeData().then((data) => {
      setAnimeTotal(data.length)
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

      // Уровни ауры для топ-10: считаем активность каждого игрока
      const topIds = sorted.map((e) => e.user_id)
      const [ratingsRes, tierRes, battlesRes] = await Promise.all([
        supabase.from('ratings').select('user_id').in('user_id', topIds),
        supabase.from('tier_lists').select('user_id').in('user_id', topIds),
        supabase.from('battle_games').select('user_id').in('user_id', topIds),
      ])
      const activity = {}
      const bump = (uid, key) => { activity[uid] = activity[uid] || { r: 0, t: 0, b: 0 }; activity[uid][key]++ }
      for (const r of ratingsRes.data || []) bump(r.user_id, 'r')
      for (const t of tierRes.data || []) bump(t.user_id, 't')
      for (const b of battlesRes.data || []) bump(b.user_id, 'b')

      setLeaderboard(sorted.map((e) => ({
        ...e,
        level: getAuraLevel(activity[e.user_id]?.r || 0, activity[e.user_id]?.t || 0, activity[e.user_id]?.b || 0).level,
      })))
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 relative z-10 pt-24">

        <div className="mb-5">
          <TechRibbon left="xAURA // ГЛАВНАЯ" right="SYS: ONLINE · БД: SHIKIMORI" />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <DossierPanel cut="cut-lg" className="overflow-hidden px-6 sm:px-12 py-14 sm:py-20">
            <div className="absolute inset-0 dots-bg opacity-25 pointer-events-none" />
            <div className="absolute inset-0 neon-grid opacity-60 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-neon-400/[0.07] rounded-full blur-[100px] animate-float pointer-events-none" />
            <div className="absolute -bottom-16 left-1/3 w-56 h-56 bg-cyan-400/[0.05] rounded-full blur-[90px] animate-float pointer-events-none" style={{ animationDelay: '-3s' }} />

            <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:justify-between">
              <div className="relative max-w-3xl">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="w-1.5 h-1.5 bg-neon-400 animate-pulse" />
                  <span className="dossier-note !text-neon-400/80">аниме · оценки · тир-листы · битвы</span>
                </div>
                <h1 className="font-display font-bold text-white text-4xl sm:text-6xl leading-[1.05] tracking-wide mb-5">
                  Оценивай. <RotatingWord />
                </h1>
                <p className="text-base sm:text-xl text-white/75 mb-7 max-w-2xl">
                  15 000+ тайтлов, детальная оценка по 6 критериям, тир-листы и музыкальные битвы — вся аниме-вселенная в одном неоновом месте.
                </p>
                <div className="mb-8">
                  <StatReadouts animeTotal={animeTotal} />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {user ? (
                    <>
                      <Link to="/catalog" className="btn-primary btn-shine">
                        Открыть каталог
                      </Link>
                      <Link to="/tier-templates" className="btn-ghost">
                        Создать тир-лист
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/register" className="btn-primary btn-shine">
                        Начать фармит ауру
                      </Link>
                      <Link to="/catalog" className="btn-ghost">
                        Смотреть каталог
                      </Link>
                    </>
                  )}
                </div>
                {!user && (
                  <p className="mt-4 text-xs text-text-muted">
                    Уже есть аккаунт?{' '}
                    <Link to="/login" className="text-neon-400 hover:text-neon-300 font-medium transition-colors">
                      Войти
                    </Link>
                  </p>
                )}
              </div>

              <AuraFarmerCard />
            </div>
          </DossierPanel>
        </motion.section>

        {topAnime.length > 0 && (
          <div className="mb-16">
            <SectionTitle index="01" title="База данных" note="топ-30 · рейтинг shikimori" />
            <AnimeStrip anime={topAnime} />
            <div className="mt-0">
              <Ticker anime={topAnime} />
            </div>
          </div>
        )}

        <div className="mb-16">
          <SectionTitle index="02" title="Режимы" note="4 модуля · выбери свой" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'Битва', desc: 'Угадывай рейтинг', code: 'PVP', to: '/battle', img: '/img000/Battle.png' },
              { title: 'Тир-лист', desc: 'Готовые шаблоны или импорт', code: 'TIR', to: '/tier-templates', img: '/img000/tierlist.png' },
              { title: 'Каталог', desc: '15 000+ тайтлов', code: 'DB', to: '/catalog', img: '/img000/catalog.png' },
              { title: 'Угадай OP/ED', desc: '3200+ треков по музыке', code: 'OPD', to: '/anime-oped', img: '/img000/OPEDGuess.png' },
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
                  className="cut-wrap cut-sm group block h-[200px] sm:h-[220px]"
                  style={{ background: 'linear-gradient(150deg, rgba(187,243,81,0.28), rgba(45,74,15,0.35))' }}
                >
                  <div className="cut-inner cut-sm relative overflow-hidden bg-[#070905] h-full">
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
                    <div className="absolute inset-0 hatch opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <span className="absolute top-2.5 right-3 font-mono text-[10px] font-bold text-white/25 group-hover:text-neon-400/70 transition-colors duration-300">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="absolute top-2.5 left-3 font-mono text-[8px] tracking-[0.2em] text-white/30 group-hover:text-neon-400/60 transition-colors duration-300">
                      {item.code}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="font-display font-semibold text-sm mb-1 text-white group-hover:text-neon-400 transition-colors duration-300 inline-flex items-center gap-1.5">
                        {item.title}
                        <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-neon-400">→</span>
                      </h3>
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">{item.desc}</p>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ boxShadow: 'inset 0 0 30px rgba(187, 243, 81, 0.12)' }}
                    />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <SectionTitle index="03" title="Активация" note={!user ? 'аккаунт — 0 ₽' : 'зал славы ждёт'} />
          <DossierPanel cut="cut-lg" className="overflow-hidden px-6 sm:px-12 py-10 sm:py-14 text-center">
            <div className="absolute inset-0 dots-bg opacity-15 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 bg-neon-400/[0.08] rounded-full blur-[100px] pointer-events-none" />
            <div className="relative">
              {!user ? (
                <>
                  <span className="stamp inline-block px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-neon-400 mb-5">
                    субару уже фармит · ты пока нет
                  </span>
                  <h2 className="font-display font-bold text-white text-2xl sm:text-4xl tracking-wide mb-3">
                    Фарми <span className="text-neon-400 drop-shadow-[0_0_16px_rgba(187,243,81,0.4)]">ауру.</span> Стань легендой.
                  </h2>
                  <p className="text-sm sm:text-base text-white/65 mb-7 max-w-xl mx-auto">
                    Оценки, тир-листы и битвы дают XP и повышают уровень ауры — от «Новичка» до «Бога аниме». Аккаунт бесплатный, зал славы ждёт.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/register" className="btn-primary btn-shine">Создать аккаунт</Link>
                    <Link to="/login" className="btn-ghost">Войти</Link>
                  </div>
                </>
              ) : (
                <>
                  <GeassBadge />
                  <span className="label block mb-3">ГОТОВ ПОКАЗАТЬ СВОЙ ВКУС?</span>
                  <h2 className="font-display font-bold text-white text-2xl sm:text-4xl tracking-wide mb-3">
                    Твой вкус. <span className="text-neon-400 drop-shadow-[0_0_16px_rgba(187,243,81,0.4)]">Твои правила.</span>
                  </h2>
                  <p className="text-sm sm:text-base text-white/65 mb-7 max-w-xl mx-auto">
                    Лелуш одобряет: составь тир-лист, который разнесёт интернет, или выбей рекорд в Битве — зал славы ждёт.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/tier-templates" className="btn-primary btn-shine">Создать тир-лист</Link>
                    <Link to="/battle" className="btn-ghost">В Битву →</Link>
                  </div>
                </>
              )}
            </div>
          </DossierPanel>
        </motion.section>

        {leaderboard.length > 0 && (
          <motion.div
            className="mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionTitle index="04" title="Зал славы" note="битва · лучшие результаты" />

            <Leaderboard entries={leaderboard} />

            <div className="mt-10 flex justify-center">
              <Link to="/battle" className="btn-primary btn-shine text-xs !py-3 !px-8">
                Присоединяйся к битве →
              </Link>
            </div>
          </motion.div>
        )}

        <div className="mb-10">
          <TechRibbon left="END OF PAGE // XAURA.SYS" right="SCROLL COMPLETE" />
        </div>
      </div>
    </div>
  )
}
