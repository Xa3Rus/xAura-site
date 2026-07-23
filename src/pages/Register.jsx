import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (username.length < 2) { setError('Имя пользователя — минимум 2 символа'); return }
    setLoading(true)
    try {
      const result = await register(username, email, password)
      if (result?.error) setError(result.error.message)
      else navigate('/profile')
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Ошибка регистрации')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-16 pb-12 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="mb-10 text-center page-enter">
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk' }}>Регистрация</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Создайте аккаунт</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl text-xs text-center" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#fb7185' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 page-enter" style={{ animationDelay: '0.05s' }}>
          <div>
            <label className="label mb-1.5 block">Имя пользователя</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input" required minLength={2} />
          </div>
          <div>
            <label className="label mb-1.5 block">Почта</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label mb-1.5 block">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 !text-sm mt-2">
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center text-xs mt-10 page-enter" style={{ color: 'rgba(255,255,255,0.15)', animationDelay: '0.1s' }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
