import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-dark-900/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-1">
            <span className="text-xl font-black">
              <span className="text-purple-500">x</span>Aura
            </span>
            <span className="text-gray-600 text-sm ml-2">© 2025</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/catalog" className="hover:text-purple-400 transition-colors">Каталог</Link>
            <Link to="/battle" className="hover:text-purple-400 transition-colors">Битва</Link>
            <a href="https://shikimori.one" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors">Shikimori</a>
          </div>
        </div>
        <div className="text-center mt-6 text-xs text-gray-600">
          Все рейтинги и данные об аниме предоставлены <a href="https://shikimori.one" target="_blank" rel="noreferrer" className="text-purple-400/60 hover:text-purple-400 transition-colors">Shikimori.one</a>
        </div>
      </div>
    </footer>
  )
}
