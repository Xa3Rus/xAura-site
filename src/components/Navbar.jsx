import { useState, useContext, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
  const searchRef = useRef(null)
  const searchTimeout = useRef(null)

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1">
              <span className="text-2xl font-black">
                <span className="text-purple-500">x</span>
                <span className="text-white">Aura</span>
              </span>
            </Link>

            <div className="hidden md:block relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Поиск пользователя..."
                className="w-48 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
              />
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleUserClick(u.id)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-purple-400">{u.username[0].toUpperCase()}</span>
                      </div>
                      <span className="text-sm text-white truncate">{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link
                  to="/rate"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive('/rate') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Оценить
                </Link>
                <Link
                  to="/catalog"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive('/catalog') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Каталог
                </Link>
                <Link
                  to="/tiermaker"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive('/tiermaker') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tier List
                </Link>
                <Link
                  to="/battle"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive('/battle') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Битва
                </Link>
                <Link
                  to="/profile"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive('/profile') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-xl hover:border-purple-500/50 transition-all duration-200"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/rate"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive('/rate') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Оценить
                </Link>
                <Link
                  to="/catalog"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive('/catalog') ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Каталог
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Вход
                </Link>
                <Link
                  to="/register"
                  className="gradient-btn text-sm !px-5 !py-2"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-dark-800/95 backdrop-blur-xl border-b border-white/5 px-4 py-4 space-y-3">
          <div className="relative mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Поиск пользователя..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { handleUserClick(u.id); setMenuOpen(false) }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-400">{u.username[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-white truncate">{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {user ? (
            <>
              <Link to="/rate" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white py-2">Оценить</Link>
              <Link to="/catalog" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white py-2">Каталог</Link>
              <Link to="/tiermaker" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white py-2">Tier List</Link>
              <Link to="/battle" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white py-2">Битва</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white py-2">{user.username}</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block text-gray-400 hover:text-white py-2">Выйти</button>
            </>
          ) : (
            <>
              <Link to="/rate" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white py-2">Оценить</Link>
              <Link to="/catalog" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white py-2">Каталог</Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white py-2">Вход</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block gradient-btn text-center">Регистрация</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
