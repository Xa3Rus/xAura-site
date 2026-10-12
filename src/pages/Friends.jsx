import { useState, useEffect, useContext, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getSocket } from '../services/socket'
import Avatar from '../components/Avatar'
import { Corners, DossierPanel } from '../components/profile/SharedBits'
import Loader from '../components/Loader'

// Управление друзьями: заявки, поиск, список, приглашение в драфт-лобби.
export default function Friends() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState([])
  const [incoming, setIncoming] = useState([]) // заявки мне
  const [outgoing, setOutgoing] = useState([]) // мои заявки
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null) // null — поиск ещё не был
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)

  // приглашение в драфт
  const [inviteModal, setInviteModal] = useState(null) // { friendId, friendName }
  const [inviteCode, setInviteCode] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')

  useEffect(() => { if (user) loadFriendships() }, [user])

  const loadFriendships = async () => {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    if (error) {
      setActionError('Не удалось загрузить друзей — выполни sql/avatars_friends.sql в Supabase')
      setLoading(false)
      return
    }
    const ids = [...new Set((data || []).map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id)))]
    let profilesOf = {}
    if (ids.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', ids)
      profilesOf = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
    }
    const enrich = (f) => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
      return { ...f, otherId, profile: profilesOf[otherId] || { id: otherId, username: '…' } }
    }
    setFriends((data || []).filter((f) => f.status === 'accepted').map(enrich))
    setIncoming((data || []).filter((f) => f.status === 'pending' && f.addressee_id === user.id).map(enrich))
    setOutgoing((data || []).filter((f) => f.status === 'pending' && f.requester_id === user.id).map(enrich))
    setLoading(false)
  }

  const runSearch = useCallback(async (value) => {
    setSearchQuery(value)
    if (value.trim().length < 2) return setSearchResults(null)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${value.trim()}%`)
      .neq('id', user.id)
      .limit(8)
    setSearchResults(data || [])
  }, [user.id])

  const relationOf = (userId) => {
    if (friends.some((f) => f.otherId === userId)) return 'friend'
    if (outgoing.some((f) => f.otherId === userId)) return 'outgoing'
    if (incoming.some((f) => f.otherId === userId)) return 'incoming'
    return 'none'
  }

  const sendRequest = async (targetId) => {
    // встречная заявка сразу становится дружбой
    const reverse = incoming.find((f) => f.otherId === targetId)
    if (reverse) return acceptRequest(reverse)
    setBusyId(targetId)
    setActionError('')
    const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: targetId })
    setBusyId(null)
    if (error) return setActionError(error.code === '23505' ? 'Заявка уже отправлена' : 'Не удалось отправить заявку')
    loadFriendships()
  }

  const acceptRequest = async (f) => {
    setBusyId(f.otherId)
    setActionError('')
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', f.id)
    setBusyId(null)
    if (error) return setActionError('Не удалось принять заявку')
    loadFriendships()
  }

  const removeFriendship = async (f) => {
    setBusyId(f.otherId)
    setActionError('')
    await supabase.from('friendships').delete().eq('id', f.id)
    setBusyId(null)
    loadFriendships()
  }

  const sendInvite = async () => {
    const code = inviteCode.trim().toUpperCase()
    if (code.length < 6) return setInviteMsg('Код комнаты — 6 символов')
    setInviteMsg('')
    const s = getSocket(user.id, user.username)
    const doEmit = () => {
      s.emit('draft:invite', { code, toUserId: inviteModal.friendId }, (res) => {
        if (res?.error) return setInviteMsg(res.error)
        setInviteMsg('Приглашение отправлено — друг увидит его в драфт-лобби')
      })
    }
    if (s.connected) doEmit()
    else s.once('connect', doEmit)
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader text="Загрузка друзей..." />
      </div>
    )
  }

  const relationLabel = { friend: 'уже друзья', outgoing: 'заявка отправлена', incoming: 'ждёт твоего ответа' }

  return (
    <div className="min-h-screen pt-24 pb-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <span className="dossier-note !text-neon-400/75 whitespace-nowrap">ДРУЗЬЯ / ЭКИПАЖ</span>
          <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/70 via-brand-medium/25 to-transparent" />
          <span className="dossier-note hidden sm:inline">{friends.length} АКТИВНЫХ</span>
        </div>

        {actionError && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2.5 border border-amber-400/40 bg-amber-400/10 text-amber-200/90 text-sm cut-sm">
            {actionError}
          </motion.div>
        )}

        {/* Входящие заявки */}
        {incoming.length > 0 && (
          <DossierPanel accent="#FFB340">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="dossier-note">ВХОДЯЩИЕ ЗАЯВКИ ({incoming.length})</span>
                <Corners color="rgba(255,179,64,0.5)" />
              </div>
              {incoming.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 border border-brand-medium/30 bg-surface-1 cut-sm">
                  <Avatar url={f.profile.avatar_url} name={f.profile.username} size={36} />
                  <Link to={`/user/${f.otherId}`} className="flex-1 min-w-0 text-sm text-text hover:text-neon-400 transition-colors truncate">
                    {f.profile.username}
                  </Link>
                  <button
                    onClick={() => acceptRequest(f)}
                    disabled={busyId === f.otherId}
                    className="px-3 py-1.5 bg-neon-400 text-black text-xs font-display font-bold cut-sm hover:bg-neon-300 transition-colors disabled:opacity-40"
                  >
                    ПРИНЯТЬ
                  </button>
                  <button
                    onClick={() => removeFriendship(f)}
                    disabled={busyId === f.otherId}
                    className="px-3 py-1.5 border border-[#FF2D78]/40 text-[#FF9AB8] text-xs cut-sm hover:bg-[#FF2D78]/10 transition-colors disabled:opacity-40"
                  >
                    ОТКЛОНИТЬ
                  </button>
                </div>
              ))}
            </div>
          </DossierPanel>
        )}

        {/* Поиск */}
        <DossierPanel accent="#00E5FF">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="dossier-note">НАЙТИ ИГРОКА</span>
              <Corners color="rgba(0,229,255,0.5)" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="минимум 2 символа…"
              className="w-full bg-surface-1 border border-brand-medium/40 cut-sm px-4 py-2.5 text-text text-sm focus:outline-none focus:border-cyan-400/60"
            />
            {searchResults && (
              searchResults.length === 0 ? (
                <p className="text-xs text-text-dim font-mono">Никого не нашли</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((p) => {
                    const rel = relationOf(p.id)
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border border-brand-medium/25 bg-surface-1 cut-sm">
                        <Avatar url={p.avatar_url} name={p.username} size={32} accent="#00E5FF" />
                        <Link to={`/user/${p.id}`} className="flex-1 min-w-0 text-sm text-text hover:text-cyan-300 transition-colors truncate">
                          {p.username}
                        </Link>
                        {rel === 'none' ? (
                          <button
                            onClick={() => sendRequest(p.id)}
                            disabled={busyId === p.id}
                            className="px-3 py-1.5 border border-cyan-400/50 text-cyan-300 text-xs font-display cut-sm hover:bg-cyan-400/10 transition-colors disabled:opacity-40"
                          >
                            + В ДРУЗЬЯ
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-text-subtle uppercase">{relationLabel[rel]}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </DossierPanel>

        {/* Список друзей */}
        <DossierPanel>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="dossier-note">МОИ ДРУЗЬЯ ({friends.length})</span>
              <Corners />
            </div>
            {friends.length === 0 ? (
              <p className="text-sm text-text-dim font-mono py-3 text-center">
                Пока пусто — найди игроков через поиск выше
              </p>
            ) : (
              friends.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 border border-brand-medium/30 bg-surface-1 cut-sm">
                  <Avatar url={f.profile.avatar_url} name={f.profile.username} size={36} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/user/${f.otherId}`} className="block text-sm text-text hover:text-neon-400 transition-colors truncate">
                      {f.profile.username}
                    </Link>
                    {outgoing.some((o) => o.otherId === f.otherId) && (
                      <span className="text-[9px] font-mono text-text-subtle uppercase">встречная заявка</span>
                    )}
                  </div>
                  <button
                    onClick={() => { setInviteModal({ friendId: f.otherId, friendName: f.profile.username }); setInviteCode(''); setInviteMsg('') }}
                    className="px-3 py-1.5 border border-neon-400/50 text-neon-400 text-xs font-display cut-sm hover:bg-neon-400/10 transition-colors"
                  >
                    В ДРАФТ
                  </button>
                  <button
                    onClick={() => removeFriendship(f)}
                    disabled={busyId === f.otherId}
                    className="px-2.5 py-1.5 border border-[#FF2D78]/40 text-[#FF9AB8] text-xs cut-sm hover:bg-[#FF2D78]/10 transition-colors disabled:opacity-40"
                    title="Удалить из друзей"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}

            {/* Исходящие заявки */}
            {outgoing.length > 0 && (
              <div className="pt-2 border-t border-dashed border-brand-medium/40 space-y-2">
                <span className="dossier-note block pt-2">ОТПРАВЛЕННЫЕ ЗАЯВКИ ({outgoing.length})</span>
                {outgoing.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 border border-brand-medium/25 bg-surface-1 opacity-80 cut-sm">
                    <Avatar url={f.profile.avatar_url} name={f.profile.username} size={28} />
                    <span className="flex-1 text-sm text-text-dim truncate">{f.profile.username}</span>
                    <button
                      onClick={() => removeFriendship(f)}
                      disabled={busyId === f.otherId}
                      className="px-2.5 py-1 border border-brand-medium/40 text-text-muted text-xs cut-sm hover:bg-surface-3 transition-colors disabled:opacity-40"
                    >
                      отменить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DossierPanel>
      </div>

      {/* Модалка приглашения в драфт */}
      {inviteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={() => setInviteModal(null)}>
          <motion.div
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <DossierPanel cut="cut-sm">
              <div className="p-5 space-y-4">
                <Corners inset={4} size={7} />
                <p className="dossier-note">приглашение в драфт</p>
                <p className="text-sm text-text-secondary">
                  Отправить приглашение <span className="text-neon-400 font-bold">{inviteModal.friendName}</span> в лобби драфта
                </p>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={6}
                  placeholder="Код комнаты"
                  className="w-full bg-surface-1 border border-brand-medium/40 cut-sm px-4 py-2.5 text-center font-mono text-xl tracking-[0.4em] text-text placeholder:text-text-subtle/40 focus:outline-none focus:border-neon-400/60"
                />
                {inviteMsg && <p className="text-xs font-mono text-text-muted">{inviteMsg}</p>}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setInviteModal(null)} className="btn-ghost text-xs !py-1.5 !px-4">Отмена</button>
                  <button onClick={sendInvite} className="btn-primary text-xs !py-1.5 !px-4">Отправить</button>
                </div>
              </div>
            </DossierPanel>
          </motion.div>
        </div>
      )}
    </div>
  )
}
