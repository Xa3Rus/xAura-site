import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { shikimoriImg } from '../utils/imgUrl'

const KIND_LABELS = {
  tv: 'TV Сериал',
  movie: 'Фильм',
  ova: 'OVA',
  ona: 'ONA',
  special: 'Спэшл',
  music: 'Клип',
}

const STATUS_LABELS = {
  released: 'Вышло',
  ongoing: 'Онгоинг',
  anons: 'Анонс',
}

const QUICK_COLORS = {
  1: { bg: 'rgba(255,51,102,0.95)', text: '#fff' },
  2: { bg: 'rgba(255,51,102,0.85)', text: '#fff' },
  3: { bg: 'rgba(255,102,136,0.8)', text: '#fff' },
  4: { bg: 'rgba(255,136,160,0.7)', text: '#fff' },
  5: { bg: 'rgba(255,138,51,0.55)', text: '#fff' },
  6: { bg: 'rgba(255,138,51,0.7)', text: '#000' },
  7: { bg: 'rgba(187,243,81,0.55)', text: '#000' },
  8: { bg: 'rgba(187,243,81,0.7)', text: '#000' },
  9: { bg: 'rgba(187,243,81,0.85)', text: '#000' },
  10: { bg: 'rgba(158,219,62,0.95)', text: '#000' },
}

function cleanDescription(text) {
  if (!text) return ''
  return text
    .replace(/\[\/?(?:character|anime|manga|person|entry|b|i|u|s|url|quote|spoiler|video|span|div|hr)(?:=[^\]]*)?\]/gi, '')
    .trim()
}

export default function AnimeDetailModal({ anime, myRating, onClose, onQuickRate, onFullRate }) {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  if (!anime) return null

  const rawImage = typeof anime.image === 'string' ? anime.image : (anime.image?.original || anime.anime_image)
  const posterUrl = shikimoriImg(rawImage)
  const kindText = KIND_LABELS[anime.kind?.toLowerCase()] || (anime.kind ? anime.kind.toUpperCase() : '')
  const statusText = STATUS_LABELS[anime.status?.toLowerCase()] || anime.status || ''
  const year = anime.aired_on ? anime.aired_on.split('-')[0] : ''
  const episodesText = anime.episodes ? `${anime.episodes} эп.` : ''
  const genresList = (anime.genres || [])
    .map((g) => (typeof g === 'object' ? (g.russian || g.name) : g))
    .filter(Boolean)
  const description = cleanDescription(anime.description)
  const shikimoriScore = anime.score ? Number(anime.score) : 0
  const userScore = myRating?.average_score != null ? Number(myRating.average_score) : null

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Оверлей с затемнением */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-label="Закрыть"
      />

      {/* Модальное окно: на <768px шторка Bottom Sheet, на >=768px центрированное окно */}
      <motion.div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl md:relative md:inset-auto md:max-h-[85vh] md:max-w-2xl md:w-full md:rounded-2xl md:mx-auto overflow-y-auto bg-[#070905] border-t border-x md:border border-neon-400/25 text-text shadow-2xl z-10 flex flex-col"
        style={{
          boxShadow: '0 0 0 1px rgba(187, 243, 81, 0.25), 0 0 35px -5px rgba(187, 243, 81, 0.2)',
        }}
        initial={isMobile ? { y: '100%' } : { scale: 0.95, y: 20, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ручка для свайпа на мобильных */}
        <div className="md:hidden pt-3 pb-1 flex justify-center flex-shrink-0">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-lg bg-surface-2/80 hover:bg-surface-3 border border-white/10 hover:border-white/20 text-text-muted hover:text-text flex items-center justify-center transition-colors z-20 font-mono text-sm"
          aria-label="Закрыть"
        >
          ✕
        </button>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Верхняя часть: постер и основная информация */}
          <div className="flex gap-4 sm:gap-5 items-start">
            {/* Постер */}
            <div className="w-24 sm:w-32 md:w-44 shrink-0 aspect-[3/4] relative rounded-xl overflow-hidden bg-surface-2 border border-neon-400/15 shadow-md">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={anime.russian || anime.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.style.display = 'none'
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-surface-2 items-center justify-center ${
                  posterUrl ? 'hidden' : 'flex'
                }`}
              >
                <span className="text-text-subtle text-2xl sm:text-3xl font-bold font-display">
                  {(anime.russian || anime.name || '?')[0]}
                </span>
              </div>
            </div>

            {/* Заголовки и метаданные */}
            <div className="flex-1 min-w-0 pr-7 sm:pr-8">
              <h2
                className="text-base sm:text-xl font-bold text-text leading-snug line-clamp-2 mb-1"
                style={{ fontFamily: 'Quantico, Inter, sans-serif' }}
              >
                {anime.russian || anime.name}
              </h2>
              {anime.russian && anime.name && anime.name !== anime.russian && (
                <p className="text-xs text-text-muted truncate mb-2 font-mono">
                  {anime.name}
                </p>
              )}

              {/* Мета-теги (тип, год, серии, статус) */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-text-muted mb-3">
                {kindText && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-3/60 border border-white/5 text-text-secondary">
                    {kindText}
                  </span>
                )}
                {year && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-3/60 border border-white/5">
                    {year}
                  </span>
                )}
                {episodesText && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-3/60 border border-white/5">
                    {episodesText}
                  </span>
                )}
                {statusText && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-3/60 border border-white/5 text-neon-400">
                    {statusText}
                  </span>
                )}
              </div>

              {/* Оценки */}
              <div className="flex flex-wrap items-center gap-2">
                {shikimoriScore > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-white/10 font-mono text-xs">
                    <span className="text-text-muted text-[10px]">Shikimori:</span>
                    <span className="font-bold text-neon-400">{shikimoriScore.toFixed(2)}</span>
                  </div>
                )}
                {userScore != null && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-400/10 border border-neon-400/30 font-mono text-xs text-neon-400">
                    <span className="text-[10px] opacity-75">Моя:</span>
                    <span className="font-bold">{userScore.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Жанровые теги */}
          {genresList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {genresList.map((genreName, idx) => (
                <span key={idx} className="tag text-[10px] sm:text-[11px] px-2 py-0.5">
                  {genreName}
                </span>
              ))}
            </div>
          )}

          {/* Синопсис / Описание */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider font-mono">
              Описание
            </h4>
            <div className="text-xs sm:text-sm text-text-secondary leading-relaxed max-h-36 sm:max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-surface-1/40 p-3 rounded-lg border border-white/5">
              {description || <span className="text-text-muted italic">Описание отсутствует.</span>}
            </div>
          </div>

          {/* Быстрая оценка (1-10) */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider font-mono">
                Быстрая оценка
              </span>
              {userScore != null && (
                <span className="text-[11px] font-mono text-neon-400">
                  Текущая: {userScore.toFixed(1)} / 10
                </span>
              )}
            </div>
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((scoreVal) => {
                const color = QUICK_COLORS[scoreVal]
                const isSelected = userScore != null && Math.round(userScore) === scoreVal
                return (
                  <button
                    key={scoreVal}
                    type="button"
                    onClick={() => onQuickRate?.(anime, scoreVal)}
                    className={`h-9 sm:h-10 rounded-lg text-xs sm:text-sm font-bold font-mono transition-all duration-150 active:scale-95 flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#070905] scale-105 z-10'
                        : 'hover:brightness-110'
                    }`}
                    style={{
                      background: color.bg,
                      color: color.text,
                      boxShadow: isSelected ? '0 0 12px rgba(187, 243, 81, 0.4)' : undefined,
                    }}
                    title={`Поставить оценку ${scoreVal}`}
                  >
                    {scoreVal}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Кнопка подробной оценки и закрытия */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={() => onFullRate?.(anime)}
              className="w-full btn-primary btn-shine flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Подробно (6 шкал)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto btn-ghost py-2.5 px-5 text-xs sm:text-sm"
            >
              Закрыть
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
