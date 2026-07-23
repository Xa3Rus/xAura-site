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
  const searchRef = useRef(null)
  const searchTimeout = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
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
    { to: '/rate', label: 'Оценить' },
    { to: '/tiermaker', label: 'Tier List' },
    { to: '/battle', label: 'Битва' },
  ] : [
    { to: '/catalog', label: 'Каталог' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0a0a14]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/20'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-0.5 group">
              <span className="text-2xl font-black tracking-tight">
                <span className="text-gradient-static">x</span>
                <span className="text-white group-hover:text-white/90 transition-colors">Aura</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link px-3 py-2 rounded-lg ${isActive(link.to) ? 'active text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:block relative" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Найти пользователя..."
                  className="w-52 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 pl-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all duration-200"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <AnimatePresence>
                {showDropdown && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 left-0 w-64 bg-[#12121f]/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
                  >
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserClick(u.id)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.05] transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-300">{u.username[0].toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-white/80 truncate">{u.username}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className={`nav-link px-3 py-2 rounded-lg ${isActive('/profile') ? 'active text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-white/80 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all duration-200"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all">
                  Вход
                </Link>
                <Link to="/register" className="gradient-btn text-sm !px-5 !py-2">
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-white p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#0e0e1c]/95 backdrop-blur-2xl border-b border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Найти пользователя..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 pl-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/40"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-[#12121f]/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { handleUserClick(u.id); setMenuOpen(false) }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.05] transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-300">{u.username[0].toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-white/80 truncate">{u.username}</span>
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
                  className={`block py-2.5 px-3 rounded-lg transition-colors ${isActive(link.to) ? 'text-white bg-white/[0.05]' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'}`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.03]">{user.username}</Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block w-full text-left py-2.5 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.03]">Выйти</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.03]">Вход</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block gradient-btn text-center mt-2">Регистрация</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
