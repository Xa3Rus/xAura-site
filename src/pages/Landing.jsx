import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Landing() {
  const { user } = useContext(AuthContext)

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-2xl animate-fade-in">
        <h1 className="text-6xl sm:text-7xl font-black mb-6">
          <span className="text-purple-500">x</span>Aura
        </h1>
        <p className="text-xl text-gray-400 mb-8 leading-relaxed">
          Современная платформа для оценки аниме.<br />
          Составляй Tier List, делись мнением с друзьями.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link to="/catalog" className="gradient-btn text-lg !px-8 !py-4">
              Начать оценку
            </Link>
          ) : (
            <>
              <Link to="/register" className="gradient-btn text-lg !px-8 !py-4">
                Начать бесплатно
              </Link>
              <Link to="/catalog" className="gradient-btn-outline text-lg !px-8 !py-4">
                Смотреть каталог
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          <div className="glass-card p-6">
            <div className="text-3xl mb-3">⭐</div>
            <h3 className="font-semibold mb-2">Оценка</h3>
            <p className="text-gray-400 text-sm">Оценивай аниме по 6 критериям с детальной шкалой</p>
          </div>
          <div className="glass-card p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">Tier List</h3>
            <p className="text-gray-400 text-sm">Составляй персональный рейтинг в формате Tier List</p>
          </div>
          <div className="glass-card p-6">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold mb-2">Каталог</h3>
            <p className="text-gray-400 text-sm">Находи новое аниме с удобными фильтрами</p>
          </div>
        </div>
      </div>
    </div>
  )
}
