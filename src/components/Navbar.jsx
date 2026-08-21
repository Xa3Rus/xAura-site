import { useState, useContext, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import { getAuraLevel } from '../utils/aura'

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [aura, setAura] = useState(null)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)
  const searchTimeout = useRef(null)
  const featuresRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false)
      if (featuresRef.current && !featuresRef.current.contains(e.target)) setFeaturesOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Ctrl+K / Cmd+K — фокус на поиск
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowDropdown(false)
        setFeaturesOpen(false)
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Уровень ауры для чипа рядом с ником
  useEffect(() => {
    if (!user) { setAura(null); return }
    const load = async () => {
      const [ratingsRes, tierRes, battleRes] = await Promise.all([
        supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tier_lists').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('battle_games').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setAura(getAuraLevel(ratingsRes.count || 0, tierRes.count || 0, battleRes.count || 0))
    }
    load()
  }, [user, location.pathname])

  const handleSearch = (value) => {
    setSearchQuery(value)
    setSearched(false)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.trim().length < 1) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${value.trim()}%`)
        .limit(5)
      setSearchResults(data || [])
      setSearched(true)
      setShowDropdown(true)
    }, 300)
  }

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`)
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { to: '/catalog', label: 'Каталог' },
  ]

  const featureLinks = [
    { to: '/tier-templates', label: 'Тир-лист', desc: 'Выбери шаблон' },
    { to: '/battle', label: 'Битва', desc: 'Угадывай рейтинг' },
    { to: '/anime-oped', label: 'Угадай OP/ED', desc: 'По музыке' },
    { to: '/screenshot-quiz', label: 'Угадай кадр', desc: 'По скриншоту' },
    { to: '/draft', label: 'Драфт сезона', desc: 'Фэнтези-лига' },
  ]

  const avatarLetter = user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-surface-0/85 backdrop-blur-2xl border-b border-neon-400/20 shadow-neon'
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">

          <div className="flex items-center gap-6 lg:gap-8">
            <Link to="/" className="flex items-baseline gap-0.5 group relative">
              <span className="text-base font-bold tracking-tight font-display text-text-muted transition-colors group-hover:text-text">x</span>
              <span className="text-base font-bold tracking-tight font-display text-neon-400 transition-all group-hover:text-neon-300 group-hover:drop-shadow-[0_0_12px_rgba(187,243,81,0.5)]">Aura</span>
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-neon-400 group-hover:w-full transition-all duration-300" />
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300 relative ${
                    isActive(link.to)
                      ? 'text-neon-400'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-neon-400/10 rounded-lg border border-neon-400/15"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}

              <div className="relative" ref={featuresRef}>
                <button
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300 flex items-center gap-1.5 ${
                    featureLinks.some(l => isActive(l.to))
                      ? 'text-neon-400'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Развлечения
                  <svg className={`w-3 h-3 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {featureLinks.some(l => isActive(l.to)) && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-neon-400/10 rounded-lg border border-neon-400/15 -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>

                <AnimatePresence>
                  {featuresOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute top-full mt-2 left-0 w-60 rounded-xl overflow-hidden glass border border-neon-400/10 shadow-neon-lg z-50"
                    >
                      <div className="py-1.5 px-4 border-b border-brand-medium/30">
                        <span className="dossier-note">развлечения · 4 модуля</span>
                      </div>
                      {featureLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setFeaturesOpen(false)}
                          className={`flex items-center justify-between px-4 py-2.5 transition-all duration-200 group/item ${
                            isActive(link.to)
                              ? 'bg-neon-400/10'
                              : 'hover:bg-surface-2/50'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`text-[13px] font-medium ${isActive(link.to) ? 'text-neon-400' : 'text-text-secondary group-hover/item:text-text'} transition-colors`}>
                              {link.label}
                            </span>
                            <span className="text-[10px] text-text-muted mt-0.5">{link.desc}</span>
                          </div>
                          <span className={`text-xs opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 ${isActive(link.to) ? 'text-neon-400 opacity-100 translate-x-0' : 'text-neon-400'}`}>
                            →
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="hidden md:block relative" ref={searchRef}>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Найти пользователя..."
                  className="w-44 rounded-sm px-3 py-1.5 pl-8 pr-12 font-mono text-[11px] text-text placeholder-text-muted focus:outline-none transition-all duration-500 bg-surface-1/80 border border-neon-400/10 focus:border-neon-400/50 focus:shadow-[0_0_0_3px_rgba(187,243,81,0.12)] focus:w-56 backdrop-blur-sm"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
                  <kbd className="hidden lg:flex items-center px-1 py-px rounded border border-surface-4 bg-surface-2 font-mono text-[9px] text-text-subtle">Ctrl</kbd>
                  <kbd className="hidden lg:flex items-center px-1 py-px rounded border border-surface-4 bg-surface-2 font-mono text-[9px] text-text-subtle">K</kbd>
                </span>
              </div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full mt-2 left-0 w-56 rounded-xl overflow-hidden glass border border-neon-400/10 shadow-neon-lg z-50"
                  >
                    {searchResults.length > 0 ? searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserClick(u.id)}
                        className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-surface-2/50 transition-colors duration-200 text-left group/item"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover/item:shadow-glow-neon bg-neon-400/10 border border-neon-400/20">
                          <span className="text-[10px] font-bold text-neon-400">{u.username[0].toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-text-secondary truncate group-hover/item:text-text transition-colors">{u.username}</span>
                      </button>
                    )) : searched ? (
                      <div className="px-3.5 py-3 text-xs text-text-muted">Никого не нашли</div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg border transition-all duration-300 ${
                    isActive('/profile') || userMenuOpen
                      ? 'bg-neon-400/10 border-neon-400/25'
                      : 'border-transparent hover:bg-surface-2/50 hover:border-neon-400/15'
                  }`}
                >
                  <div className="relative w-7 h-7 rounded-lg flex items-center justify-center bg-neon-400/10 border border-neon-400/25">
                    <span className="text-[11px] font-bold text-neon-400 font-display">{avatarLetter}</span>
                    {aura && (
                      <span className="absolute -bottom-1 -right-1 px-1 rounded bg-neon-400 text-black font-mono text-[8px] font-bold leading-tight">
                        {aura.level}
                      </span>
                    )}
                  </div>
                  <span className={`text-[13px] font-medium max-w-[120px] truncate ${isActive('/profile') ? 'text-neon-400' : 'text-text-secondary'}`}>
                    {user.username}
                  </span>
                  <svg className={`w-3 h-3 text-text-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute top-full mt-2 right-0 w-52 rounded-xl overflow-hidden glass border border-neon-400/10 shadow-neon-lg z-50"
                    >
                      {aura && (
                        <div className="px-4 py-3 border-b border-neon-400/10">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-[10px] text-text-muted">{aura.title}</span>
                            <span className="font-mono text-[10px] text-neon-400">LVL {aura.level}</span>
                          </div>
                          <div className="relative h-1.5 bg-surface-3 overflow-hidden">
                            <div className="absolute inset-y-0 left-0 chevron-fill opacity-70" style={{ width: `${aura.progress}%` }} />
                          </div>
                          <p className="mt-1 font-mono text-[9px] text-text-subtle">{aura.xp} XP · до след. уровня {aura.next}</p>
                        </div>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors duration-200 ${isActive('/profile') ? 'text-neon-400 bg-neon-400/10' : 'text-text-secondary hover:bg-surface-2/50 hover:text-text'}`}
                      >
                        Профиль
                        <span className="text-xs opacity-0 group-hover:opacity-100">→</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-text-muted hover:text-danger hover:bg-danger/5 transition-colors duration-200"
                      >
                        Выйти
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !text-xs !px-4 !py-2">
                  Вход
                </Link>
                <Link to="/register" className="btn-primary btn-shine !text-xs !px-4 !py-2">
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-2/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-neon-400/10 overflow-hidden bg-surface-0/95 backdrop-blur-xl"
          >
            <div className="px-5 py-4 space-y-1">
              {user && (
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-surface-1 border border-neon-400/10"
                >
                  <div className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-neon-400/10 border border-neon-400/25 flex-shrink-0">
                    <span className="text-sm font-bold text-neon-400 font-display">{avatarLetter}</span>
                    {aura && (
                      <span className="absolute -bottom-1 -right-1 px-1 rounded bg-neon-400 text-black font-mono text-[8px] font-bold leading-tight">
                        {aura.level}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-text truncate">{user.username}</span>
                    {aura && <span className="block text-[10px] text-text-muted font-mono">{aura.title} · {aura.xp} XP</span>}
                  </div>
                  <span className="text-neon-400 text-xs">→</span>
                </Link>
              )}

              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Поиск..."
                  className="input !text-xs"
                />
                {showDropdown && (
                  <div className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-50 glass border border-neon-400/10 shadow-neon-lg">
                    {searchResults.length > 0 ? searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { handleUserClick(u.id); setMenuOpen(false) }}
                        className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-surface-2/50 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-neon-400/10 border border-neon-400/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-neon-400">{u.username[0].toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-text-secondary truncate">{u.username}</span>
                      </button>
                    )) : searched ? (
                      <div className="px-3.5 py-3 text-xs text-text-muted">Никого не нашли</div>
                    ) : null}
                  </div>
                )}
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2.5 px-3 rounded-lg text-sm transition-all duration-200 ${
                    isActive(link.to) ? 'text-neon-400 bg-neon-400/10' : 'text-text-muted hover:text-text hover:bg-surface-2/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="py-1.5 px-3 text-[10px] text-text-muted uppercase tracking-wider font-medium">Развлечения</div>
              {featureLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2.5 px-3 rounded-lg text-sm transition-all duration-200 ${
                    isActive(link.to) ? 'text-neon-400 bg-neon-400/10' : 'text-text-muted hover:text-text hover:bg-surface-2/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  <div className="pt-2 border-t border-neon-400/10 mt-2" />
                  <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-text-muted hover:text-danger hover:bg-danger/5 transition-colors">Выйти</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-2/50">Вход</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block btn-primary btn-shine text-center mt-2">Регистрация</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
