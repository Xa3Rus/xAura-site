export default function Loader({ size = 'md', text = '' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 rounded-full border-2 border-neon-400/15" />
        <div className="absolute inset-0 rounded-full animate-spin border-2 border-transparent border-t-neon-400" />
      </div>
      {text && <p className="text-xs font-medium text-text-muted">{text}</p>}
    </div>
  )
}
