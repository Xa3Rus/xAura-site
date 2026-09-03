import { useState, useEffect, useContext, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getAuraLevel } from '../utils/aura'
import { shikimoriImg } from '../utils/imgUrl'
import { parseTierListData } from '../utils/tierLists'
import ProfileHeader from '../components/profile/ProfileHeader'
import Avatar from '../components/Avatar'
import RadarChart from '../components/charts/RadarChart'
import ActivityChart from '../components/charts/ActivityChart'
import { achievementsProgress } from '../components/profile/Achievements'
import {
  TabBar, StatCard, ScoreHistogram,
  EmptyState, ArchiveRatingGrid, SectionTitle, DossierPanel, Corners,
} from '../components/profile/SharedBits'

export default function Profile() {
  const { user, updateAvatar } = useContext(AuthContext)
  const navigate = useNavigate()
  const [ratings, setRatings] = useState([])
  const [tierLists, setTierLists] = useState([])
  const [battleStats, setBattleStats] = useState(null)
  const [battleRank, setBattleRank] = useState(null)
  const [leaderScore, setLeaderScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ratings')
  const [confirmModal, setConfirmModal] = useState(null)
  const [dailyCount, setDailyCount] = useState(0)
  const [friends, setFriends] = useState([])
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef(null)

  useEffect(() => {
    if (user) loadData()
    else setLoading(false)
  }, [user])

  const loadData = async () => {
    const [ratingsRes, tierListsRes, battleRes, dailyRes, friendsRes] = await Promise.all([
      supabase.from('ratings').select('*').eq('user_id', user.id),
      supabase.from('tier_lists').select('*').eq('user_id', user.id),
      supabase.from('battle_games').select('score').eq('user_id', user.id),
      supabase.from('daily_results').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      // таблица friendships появляется после sql/avatars_friends.sql — ошибка не ломает профиль
      supabase.from('friendships').select('requester_id, addressee_id').eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    ])
    setDailyCount(dailyRes.count || 0)
    if (friendsRes.data) {
      const otherIds = friendsRes.data.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id))
      if (otherIds.length) {
        const { data: friendProfiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', otherIds)
        setFriends(friendProfiles || [])
      }
    }
    setRatings((ratingsRes.data || []).sort((a, b) => (b.average_score || 0) - (a.average_score || 0)))
    setTierLists(tierListsRes.data || [])
    if (battleRes.data?.length) {
      const scores = battleRes.data.map((g) => g.score)
      const best = Math.max(...scores)
      setBattleStats({
        best,
        total: scores.length,
        avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      })

      const { data: allGames } = await supabase
        .from('battle_games')
        .select('user_id, score')
        .order('score', { ascending: false })
        .limit(200)

      if (allGames?.length) {
        const bestByUser = {}
        for (const g of allGames) {
          if (!bestByUser[g.user_id] || g.score > bestByUser[g.user_id]) {
            bestByUser[g.user_id] = g.score
          }
        }
        const sorted = Object.entries(bestByUser).sort((a, b) => b[1] - a[1])
        const rank = sorted.findIndex(([uid]) => uid === user.id)
        if (rank !== -1) setBattleRank(rank + 1)
        if (sorted.length > 1 && sorted[0][0] !== user.id) setLeaderScore(sorted[0][1])
      }
    }
    setLoading(false)
  }

  const handleDeleteRating = (rating) => setConfirmModal({ type: 'rating', id: rating.id, text: `Удалить оценку «${rating.anime_name}»?` })
  const handleDeleteTierList = (listId) => setConfirmModal({ type: 'tierlist', id: listId, text: 'Удалить tier list?' })

  const confirmAction = async () => {
    if (!confirmModal) return
    if (confirmModal.type === 'rating') {
      await supabase.from('ratings').delete().eq('id', confirmModal.id)
      setRatings((prev) => prev.filter((r) => r.id !== confirmModal.id))
    } else if (confirmModal.type === 'tierlist') {
      await supabase.from('tier_lists').delete().eq('id', confirmModal.id)
      setTierLists((prev) => prev.filter((l) => l.id !== confirmModal.id))
    }
    setConfirmModal(null)
  }

  const handleReRate = (rating) => {
    const anime = {
      id: rating.anime_id,
      name: rating.anime_name,
      russian: rating.anime_name,
      image: rating.anime_image ? { original: shikimoriImg(rating.anime_image) } : null,
    }
    navigate('/rate', { state: { selectedAnime: anime } })
  }

  // === Аватар ===
  const compressImage = (file, max = 512) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl)
          blob ? resolve(blob) : reject(new Error('Не удалось обработать изображение'))
        }, 'image/png')
      }
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Не удалось прочитать файл')) }
      img.src = objectUrl
    })

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return setAvatarError('Только JPG, PNG или WebP')
    }
    if (file.size > 5 * 1024 * 1024) return setAvatarError('Файл больше 5 МБ')
    setAvatarBusy(true)
    setAvatarError('')
    try {
      const blob = await compressImage(file)
      const path = `${user.id}/avatar.png`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/png', upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?v=${Date.now()}`
      const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      if (dbErr) throw dbErr
      updateAvatar(url)
    } catch (err) {
      setAvatarError(err?.message || 'Не удалось загрузить аватар')
    } finally {
      setAvatarBusy(false)
    }
  }

  const removeAvatar = async () => {
    if (avatarBusy) return
    setAvatarBusy(true)
    setAvatarError('')
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.png`])
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    updateAvatar(null)
    setAvatarBusy(false)
  }

  // Средний покритерийный профиль пользователя (для радара)
  const avgScores = ratings.length ? ratings.reduce((acc, r) => {
    acc.drawing += Number(r.drawing || 0)
    acc.idea += Number(r.idea || 0)
    acc.realization += Number(r.realization || 0)
    acc.characters += Number(r.characters || 0)
    acc.story += Number(r.story || 0)
    acc.emotional += Number(r.emotional || 0)
    return acc
  }, { drawing: 0, idea: 0, realization: 0, characters: 0, story: 0, emotional: 0 }) : null
  if (avgScores) for (const k of Object.keys(avgScores)) avgScores[k] = Number((avgScores[k] / ratings.length).toFixed(1))

  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + (r.average_score || 0), 0) / ratings.length).toFixed(2)
    : '—'

  const aura = getAuraLevel(ratings.length, tierLists.length, battleStats?.total ?? 0, dailyCount)

  const tabs = [
    { id: 'ratings', label: 'Оценки', count: ratings.length },
    { id: 'tierlists', label: 'Тир-листы', count: tierLists.length },
    { id: 'battle', label: 'Битва', count: battleStats?.total ?? 0 },
    { id: 'friends', label: 'Друзья', count: friends.length },
  ]

  const achieveStats = {
    ratings: ratings.length,
    tierLists: tierLists.length,
    battles: battleStats?.total ?? 0,
    avgScore: ratings.length ? Number(avgRating) : 0,
    bestScore: battleStats?.best ?? 0,
    animeCount: ratings.length,
    level: aura.level,
    friends: friends.length,
    dailyCount,
    modesPlayed: [ratings.length > 0, tierLists.length > 0, (battleStats?.total ?? 0) > 0, dailyCount > 0, friends.length > 0].filter(Boolean).length,
  }

  // сильнейший критерий и самый «горячий» месяц для аннотаций
  const topAxis = avgScores
    ? Object.entries(avgScores).sort((a, b) => b[1] - a[1])[0]
    : null
  const AXIS_NAMES = { drawing: 'рисунок', idea: 'идея', realization: 'реализация', characters: 'персонажи', story: 'сюжет', emotional: 'эмоции' }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
        <div className="max-w-[1400px] mx-auto text-center py-24">
          <div className="inline-block w-8 h-8 rounded-full border-2 border-neon-400/30 border-t-neon-400 animate-spin" />
          <p className="mt-3 text-xs text-text-muted font-mono">загрузка профиля...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8 page-enter">
      <div className="max-w-[1400px] mx-auto">
        {/* Досье: шапка */}
        <ProfileHeader
          username={user?.username}
          email={user?.email}
          avatarUrl={user?.avatar_url}
          aura={aura}
          isOwner
          idCode={user?.id?.slice(0, 8).toUpperCase()}
          avatarBusy={avatarBusy}
          avatarError={avatarError}
          onPickAvatar={() => avatarInputRef.current?.click()}
          onRemoveAvatar={removeAvatar}
        />
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarFile}
        />

        {/* 01 // Сводка */}
        <SectionTitle index="01" title="Сводка" />
        <DossierPanel accent="#BBF351" className="p-5 sm:p-6 mb-10">
          <Corners inset={5} size={9} color="rgba(187,243,81,0.35)" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-5">
            <div><span className="dossier-note block mb-1">оценок</span><span className="font-display font-bold text-3xl text-neon-400">{ratings.length}</span></div>
            <div><span className="dossier-note block mb-1">битв</span><span className="font-display font-bold text-3xl text-mint-400">{battleStats?.total ?? 0}</span></div>
            <div><span className="dossier-note block mb-1">тир-листов</span><span className="font-display font-bold text-3xl text-cyan-300">{tierLists.length}</span></div>
            <div><span className="dossier-note block mb-1">ср. балл</span><span className="font-display font-bold text-3xl text-orange-300">{avgRating}</span></div>
          </div>
        </DossierPanel>

        {/* 02 // Архив */}
        <SectionTitle index="02" title="Архив" note={`${ratings.length + tierLists.length + (battleStats?.total ?? 0)} записей`} />
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === 'ratings' && (
            ratings.length === 0 ? (
              <EmptyState icon="★" text="Вы ещё не оценили ни одного аниме" to="/catalog" linkText="Перейти к каталогу" />
            ) : (
              <ArchiveRatingGrid ratings={ratings} isOwner onDelete={handleDeleteRating} onRerate={handleReRate} />
            )
          )}

          {activeTab === 'tierlists' && (
            tierLists.length === 0 ? (
              <EmptyState icon="▦" text="У вас пока нет тир-листов" to="/tier-templates" linkText="Создать тир-лист" />
            ) : (
              <div className="space-y-2">
                {tierLists.map((list, index) => {
                  const { tiers } = parseTierListData(list.tiers)
                  const filled = tiers.filter((t) => (t.items || []).length > 0)
                  return (
                    <motion.div
                      key={list.id}
                      className="group relative flex items-stretch gap-4 cursor-pointer border border-brand-medium/70 bg-[#070905] hover:border-neon-400/50 transition-colors duration-300"
                      onClick={() => navigate(`/tierlist/${list.id}`)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      {/* Порядковый номер-код */}
                      <div className="hidden sm:flex flex-col items-center justify-center w-14 flex-shrink-0 border-r border-brand-medium/50 hatch">
                        <span className="font-mono text-[8px] text-text-subtle">REC</span>
                        <span className="font-display font-bold text-lg text-neon-400/80 leading-none">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Полосы тиров */}
                      <div className="flex gap-1 items-center py-3 flex-shrink-0">
                        {filled.slice(0, 6).map((t) => (
                          <div
                            key={t.id}
                            className="w-5 h-10 flex items-center justify-center font-display text-[8px] font-bold"
                            style={{
                              color: t.color,
                              border: `1px solid ${t.color}55`,
                              background: `linear-gradient(to top, ${t.color}30, transparent)`,
                            }}
                          >
                            {t.name}
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center py-3 pr-3">
                        <h3 className="font-display font-bold text-sm text-text-secondary group-hover:text-neon-400 transition-colors truncate uppercase tracking-wide">
                          {list.name}
                        </h3>
                        <p className="dossier-note mt-1">
                          {filled.reduce((n, t) => n + (t.items || []).length, 0)} тайтлов · {new Date(list.created_at).toLocaleDateString('ru')}
                        </p>
                      </div>

                      <div className="flex items-center pr-4">
                        <span className="dossier-note group-hover:text-neon-400 transition-colors">открыть →</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          )}

          {activeTab === 'battle' && (
            !battleStats ? (
              <EmptyState icon="◈" text="Вы ещё не играли в Битву" to="/battle" linkText="Начать" />
            ) : (
              <DossierPanel cut="cut-sm" className="p-6 sm:p-8">
                <Corners inset={6} size={10} color="rgba(51,235,212,0.45)" accent="#33EBD4" />
                {/* Верхняя техническая строка */}
                <div className="flex items-center justify-between mb-6">
                  <span className="dossier-note">арена · режим рейтинга</span>
                  {battleRank && (
                    <span className="font-mono text-[10px] font-bold text-mint-400 tracking-widest">
                      RANK #{String(battleRank).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Счётчики с разделителями-линейками */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0">
                  <div className="sm:px-6 sm:first:pl-0 text-center sm:text-left relative">
                    <div className="dossier-note mb-1">лучший счёт</div>
                    <div className="font-display font-bold text-5xl text-neon-400 leading-none tracking-tight">
                      {battleStats.best}
                    </div>
                    <div className="dossier-note mt-2 normal-case">рекорд сессии</div>
                  </div>
                  <div className="sm:px-6 text-center sm:text-left relative ruled-v sm:border-l border-brand-medium/40">
                    <div className="dossier-note mb-1">всего игр</div>
                    <div className="font-display font-bold text-5xl text-mint-400 leading-none tracking-tight">
                      {battleStats.total}
                    </div>
                    <div className="dossier-note mt-2 normal-case">заходов на арену</div>
                  </div>
                  <div className="sm:px-6 text-center sm:text-left relative ruled-v sm:border-l border-brand-medium/40">
                    <div className="dossier-note mb-1">средний счёт</div>
                    <div className="font-display font-bold text-5xl text-text-secondary leading-none tracking-tight">
                      {battleStats.avg}
                    </div>
                    <div className="dossier-note mt-2 normal-case">по всем играм</div>
                  </div>
                </div>

                {/* Шкала до лидера */}
                {leaderScore && battleRank && (
                  <div className="mt-8 pt-5 border-t border-dashed border-brand-medium/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="dossier-note">
                        до лидера: <span className="text-neon-400 font-bold">{leaderScore - battleStats.best}</span> очков
                      </span>
                      <span className="font-mono text-[10px] font-bold text-neon-400">
                        {Math.round((battleStats.best / leaderScore) * 100)}%
                      </span>
                    </div>
                    <div className="relative h-[14px] bg-[#0A0D07] border border-brand-medium overflow-hidden">
                      <div className="absolute inset-0 gauge-ticks opacity-60 z-10 pointer-events-none" />
                      <motion.div
                        className="absolute inset-y-0 left-0"
                        style={{
                          background: 'linear-gradient(to right, #00E5FF33, #00E5FF66 30%, #BBF351 100%)',
                          boxShadow: 'inset 0 0 0 1px rgba(187,243,81,0.4)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (battleStats.best / leaderScore) * 100)}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                      />
                    </div>
                    <p className="dossier-note mt-2">
                      лидер: {leaderScore} очков · цель {leaderScore + 1}
                    </p>
                  </div>
                )}

                <div className="mt-8 text-center sm:text-left">
                  <Link to="/battle" className="btn-primary btn-shine text-xs">Играть</Link>
                </div>
              </DossierPanel>
            )
          )}

          {activeTab === 'friends' && (
            friends.length === 0 ? (
              <EmptyState icon="∞" text="Пока нет друзей — отправь заявку или прими входящую" to="/friends" linkText="Управление друзьями" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {friends.map((f) => (
                  <motion.div
                    key={f.id}
                    className="group flex items-center gap-3 px-4 py-3 border border-brand-medium/60 bg-[#070905] hover:border-neon-400/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/user/${f.id}`)}
                  >
                    <Avatar url={f.avatar_url} name={f.username} size={36} />
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-text-secondary group-hover:text-neon-400 transition-colors truncate">{f.username}</span>
                      <span className="dossier-note">в друзьях</span>
                    </div>
                    <span className="dossier-note group-hover:text-neon-400 transition-colors">профиль →</span>
                  </motion.div>
                ))}
                <Link to="/friends" className="flex items-center justify-center px-4 py-3 border border-dashed border-brand-medium/40 text-xs text-text-subtle font-mono hover:border-neon-400/50 hover:text-neon-400 transition-colors cut-sm">
                  + управлять друзьями
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {/* Модалка подтверждения */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
            <motion.div
              className="relative p-5 w-[90%] max-w-xs bg-[#070905] border border-brand-medium shadow-soft-lg cut-wrap cut-sm"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Corners inset={4} size={7} />
              <p className="dossier-note mb-2">подтверждение</p>
              <p className="text-sm font-medium mb-5 text-text-secondary">{confirmModal.text}</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmModal(null)} className="btn-ghost text-xs !py-1.5 !px-4">Отмена</button>
                <button onClick={confirmAction} className="btn-danger text-xs !py-1.5">Удалить</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
