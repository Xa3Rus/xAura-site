import { useState, useContext, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const searchRef = useRef(null)
  const searchTimeout = useRef(null)
  const featuresRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
      if (featuresRef.current && !featuresRef.current.contains(e.target)) {
        setFeaturesOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (value) => {
    setSearchQuery(value)
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

  const navLinks = user ? [
    { to: '/catalog', label: 'Каталог' },
  ] : [
    { to: '/catalog', label: 'Каталог' },
  ]

  const featureLinks = [
    { to: '/rate', label: 'Оценка', desc: '6 критериев' },
    { to: '/tiermaker', label: 'Tier List', desc: 'Сортируй по тирам' },
    { to: '/battle', label: 'Битва', desc: 'Угадывай рейтинг' },
    { to: '/anime-oped', label: 'Угадай OP/ED', desc: 'По музыке' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-surface-0/80 backdrop-blur-2xl border-b border-white/[0.04] shadow-[0_1px_0_0_rgba(255,255,255,0.02)]'
        : 'bg-transparent'
    }`}>
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-0.5 group relative">
              <span className="text-base font-bold tracking-tight text-white/90 transition-colors group-hover:text-white" style={{ fontFamily: 'Space Grotesk' }}>x</span>
              <span className="text-base font-bold tracking-tight text-amber-400 transition-all group-hover:text-amber-300 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" style={{ fontFamily: 'Space Grotesk' }}>Aura</span>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300 relative ${
                    isActive(link.to)
                      ? 'text-amber-400'
                      : 'text-white/35 hover:text-white/70'
                  }`}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-amber-500/[0.07] rounded-lg border border-amber-500/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}

              {user && (
                <div className="relative" ref={featuresRef}>
                  <button
                    onClick={() => setFeaturesOpen(!featuresOpen)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300 flex items-center gap-1.5 ${
                      featureLinks.some(l => isActive(l.to))
                        ? 'text-amber-400'
                        : 'text-white/35 hover:text-white/70'
                    }`}
                  >
                    Мини-игры
                    <svg className={`w-3 h-3 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {featureLinks.some(l => isActive(l.to)) && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-amber-500/[0.07] rounded-lg border border-amber-500/10 -z-10"
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
                        className="absolute top-full mt-2 left-0 w-52 rounded-xl overflow-hidden"
                        style={{
                          background: 'rgba(17,17,20,0.95)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          boxShadow: '0 16px 48px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
                          backdropFilter: 'blur(20px)',
                        }}
                      >
                        {featureLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setFeaturesOpen(false)}
                            className={`flex flex-col px-4 py-2.5 transition-all duration-200 group/item ${
                              isActive(link.to)
                                ? 'bg-amber-500/[0.06]'
                                : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className={`text-[13px] font-medium ${isActive(link.to) ? 'text-amber-400' : 'text-white/60 group-hover/item:text-white/90'} transition-colors`}>
                              {link.label}
                            </span>
                            <span className="text-[10px] text-white/20 mt-0.5">{link.desc}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="hidden md:block relative" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Найти пользователя..."
                  className="w-44 rounded-lg px-3 py-1.5 pl-8 text-xs text-white/80 placeholder-white/15 focus:outline-none transition-all duration-500"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onFocusCapture={(e) => {
                    e.target.style.borderColor = 'rgba(251,191,36,0.2)'
                    e.target.style.width = '220px'
                    e.target.style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onBlurCapture={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.05)'
                    e.target.style.width = '176px'
                    e.target.style.background = 'rgba(255,255,255,0.03)'
                  }}
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/15 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <AnimatePresence>
                {showDropdown && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full mt-2 left-0 w-56 rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(17,17,20,0.95)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: '0 16px 48px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserClick(u.id)}
                        className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] transition-colors duration-200 text-left group/item"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover/item:shadow-glow-amber" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(249,115,22,0.08) 100%)', border: '1px solid rgba(251,191,36,0.15)' }}>
                          <span className="text-[10px] font-bold text-amber-400">{u.username[0].toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-white/60 truncate group-hover/item:text-white/90 transition-colors">{u.username}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300 relative group"
                >
                  <span className={isActive('/profile') ? 'text-amber-400' : 'text-white/35 group-hover:text-white/70'}>
                    {user.username}
                  </span>
                  {isActive('/profile') && (
                    <motion.div
                      layoutId="nav-active-right"
                      className="absolute inset-0 bg-amber-500/[0.07] rounded-lg border border-amber-500/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-white/20 hover:text-white/50 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.03] transition-all duration-200"
                >
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !text-xs !px-4 !py-2">
                  Вход
                </Link>
                <Link to="/register" className="btn-primary !text-xs !px-4 !py-2">
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white/30 hover:text-white p-2 rounded-lg hover:bg-white/[0.04] transition-all"
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
            className="md:hidden border-t border-white/[0.04] overflow-hidden"
            style={{ background: 'rgba(10,10,12,0.95)', backdropFilter: 'blur(20px)' }}
          >
            <div className="px-5 py-4 space-y-1">
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Поиск..."
                  className="input !text-xs"
                />
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-50" style={{ background: 'rgba(17,17,20,0.95)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 16px 48px -12px rgba(0,0,0,0.7)' }}>
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { handleUserClick(u.id); setMenuOpen(false) }}
                        className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/[0.1] border border-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-amber-400">{u.username[0].toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-white/60 truncate">{u.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2.5 px-3 rounded-lg text-sm transition-all duration-200 ${
                    isActive(link.to) ? 'text-amber-400 bg-amber-500/[0.06]' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.03]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <div className="py-1.5 px-3 text-[10px] text-white/15 uppercase tracking-wider font-medium">Мини-игры</div>
                  {featureLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={`block py-2.5 px-3 rounded-lg text-sm transition-all duration-200 ${
                        isActive(link.to) ? 'text-amber-400 bg-amber-500/[0.06]' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.03]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm text-white/35 hover:text-white/70 hover:bg-white/[0.03]">{user.username}</Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-white/35 hover:text-white/70 hover:bg-white/[0.03]">Выход</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm text-white/35 hover:text-white/70 hover:bg-white/[0.03]">Вход</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block btn-primary text-center mt-2">Регистрация</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
