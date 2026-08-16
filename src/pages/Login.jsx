import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result?.error) setError(result.error.message)
      else navigate('/profile')
    } catch (e) {
      setError(e?.message || 'Неверный email или пароль')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-16 pb-12 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon-400/[0.04] rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-cyan-400/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="mb-10 text-center page-enter">
          <h1 className="text-2xl font-bold tracking-tight mb-1 neon-text" style={{ fontFamily: 'Quantico, Inter, sans-serif' }}>Вход</h1>
          <p className="text-xs text-text-muted">Войдите в свой аккаунт</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl text-xs text-center bg-danger/10 border border-danger/20 text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 page-enter" style={{ animationDelay: '0.05s' }}>
          <div>
            <label className="label mb-1.5 block">Почта</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label mb-1.5 block">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary btn-shine w-full !py-3 !text-sm mt-2">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-xs mt-10 page-enter text-text-muted" style={{ animationDelay: '0.1s' }}>
          Нет аккаунта?{' '}
          <Link to="/register" className="text-neon-400 hover:text-neon-300 font-medium transition-colors neon-text">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  )
}
