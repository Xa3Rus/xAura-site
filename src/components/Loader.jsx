export default function Loader({ size = 'md', text = '' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
        <div className="absolute inset-1 rounded-full border border-transparent border-b-cyan-400/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      {text && <p className="text-gray-500 text-sm font-medium">{text}</p>}
    </div>
  )
}
