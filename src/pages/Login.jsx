import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import AuraCharacterCard from '../components/AuraCharacterCard'
import { AURA_CHARACTERS } from '../data/auraCharacters'
import { DossierPanel, Corners } from '../components/profile/SharedBits'

// Маскот страницы входа — Лелуш (Критик)
const MASCOT = AURA_CHARACTERS[2]

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
        <div className="hidden lg:block absolute -left-[290px] top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl blur-2xl" style={{ background: `radial-gradient(circle, ${MASCOT.accent}26, transparent 70%)` }} />
            <AuraCharacterCard char={MASCOT} size="md" index={1} />
          </div>
        </div>

        <div className="page-enter">
          <DossierPanel cut="cut-lg" className="px-6 sm:px-8 pt-7 pb-8">
            <div className="absolute inset-0 dots-bg opacity-30 pointer-events-none" />
            <Corners inset={4} size={11} />
            <div className="absolute bottom-0 inset-x-0 h-2 gauge-ticks opacity-20 pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-1.5 h-1.5 bg-neon-400 animate-pulse" />
                <span className="dossier-note !text-neon-400/75">auth // вход в систему</span>
                <span className="h-px flex-1 bg-gradient-to-r from-brand-medium/60 to-transparent" />
              </div>

              <h1 className="font-display font-bold text-2xl tracking-wide mb-1 neon-text">Вход</h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mb-6">войдите в свой аккаунт</p>

              {error && (
                <div className="cut-wrap cut-sm mb-4" style={{ background: 'linear-gradient(150deg, rgba(255,51,102,0.3), rgba(77,0,26,0.3))' }}>
                  <div className="cut-inner cut-sm relative bg-[#0A0305] px-3.5 py-3 text-xs text-center text-danger">
                    <span className="dossier-note !text-danger/70 block mb-1">ошибка доступа</span>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="dossier-note block mb-1.5">почта</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input !rounded-sm font-mono !text-[13px]" required />
                </div>
                <div>
                  <label className="dossier-note block mb-1.5">пароль</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input !rounded-sm font-mono !text-[13px]" required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary btn-shine w-full !py-3 !text-sm mt-2">
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </form>

              <p className="mt-6 pt-4 border-t border-brand-medium/40 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                нет аккаунта?{' '}
                <Link to="/register" className="text-neon-400 hover:text-neon-300 font-bold transition-colors">
                  регистрация
                </Link>
              </p>
            </div>
          </DossierPanel>
        </div>
      </div>
    </div>
  )
}
