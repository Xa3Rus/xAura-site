export function getImageUrl(path) {
  if (!path || path.includes('missing_')) return null
  return `https://shikimori.io${path}`
}

export function ImgWithFallback({ src, alt, className, fallbackClassName, fallbackText }) {
  if (!src) {
    return (
      <div className={`${className} ${fallbackClassName || 'bg-dark-600 flex items-center justify-center'}`}>
        <span className="text-gray-500 text-3xl font-bold">{fallbackText?.[0]?.toUpperCase() || '?'}</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={(e) => {
        e.target.onerror = null
        e.target.style.display = 'none'
        const div = document.createElement('div')
        div.className = `${className} ${fallbackClassName || 'bg-dark-600 flex items-center justify-center'}`
        div.innerHTML = `<span class="text-gray-500 text-3xl font-bold">${fallbackText?.[0]?.toUpperCase() || '?'}</span>`
        e.target.parentNode.appendChild(div)
      }}
    />
  )
}
