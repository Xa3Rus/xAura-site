import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#0a0a14]/80 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="text-lg font-black tracking-tight">
              <span className="text-gradient-static">x</span>Aura
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Link to="/catalog" className="hover:text-purple-400 transition-colors">Каталог</Link>
            <Link to="/battle" className="hover:text-purple-400 transition-colors">Битва</Link>
            <a href="https://shikimori.one" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors">Shikimori</a>
          </div>
        </div>
        <div className="text-center mt-4 text-[11px] text-gray-600/60">
          Данные об аниме предоставлены <a href="https://shikimori.one" target="_blank" rel="noreferrer" className="text-purple-400/40 hover:text-purple-400 transition-colors">Shikimori.one</a>
        </div>
      </div>
    </footer>
  )
}
