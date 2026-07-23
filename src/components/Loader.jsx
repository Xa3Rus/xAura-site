export default function Loader({ size = 'md', text = '' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(251,191,36,0.08)' }} />
        <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2px solid transparent', borderTopColor: '#f59e0b' }} />
      </div>
      {text && <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.15)' }}>{text}</p>}
    </div>
  )
}
