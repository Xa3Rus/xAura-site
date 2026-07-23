export default function Loader({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-purple-500/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin"></div>
      </div>
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  )
}
