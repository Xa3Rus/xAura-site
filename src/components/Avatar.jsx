// Универсальный аватар: картинка из profiles.avatar_url или буква-заглушка.
export default function Avatar({ url, name, size = 28, shape = 'rounded-lg', className = '', accent = '#BBF351' }) {
  const letter = name?.[0]?.toUpperCase() || 'U'
  const fontSize = Math.max(9, Math.round(size * 0.38))

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'avatar'}
        loading="lazy"
        className={`object-cover flex-shrink-0 ${shape} ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => { e.target.style.display = 'none' }}
      />
    )
  }
  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${shape} ${className}`}
      style={{
        width: size,
        height: size,
        background: `${accent}1a`,
        border: `1px solid ${accent}40`,
      }}
    >
      <span className="font-bold font-display leading-none" style={{ fontSize, color: accent }}>
        {letter}
      </span>
    </div>
  )
}
