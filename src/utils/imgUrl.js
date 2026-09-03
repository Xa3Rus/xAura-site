// Картинки Шикимори отдаются только после ddos-guard редиректа с куками —
// браузерный <img> такую цепочку не всегда проходит и падает в onError.
// Поэтому все изображения Шикимори грузятся через собственный прокси
// /shikimori-img (edge-функция на Netlify, proxy в vite dev-сервере).
// Хелпер принимает и относительный путь, и абсолютный URL старого/нового домена.
export function shikimoriImg(path) {
  if (!path) return null
  const clean = String(path).replace(/^https?:\/\/shikimori\.(one|io)/, '')
  if (!clean || clean.includes('missing_')) return null
  if (clean.startsWith('/shikimori-img')) return clean
  return `/shikimori-img${clean.startsWith('/') ? '' : '/'}${clean}`
}
