export default function ProgressBar({ value, max = 100, label, tone = 'blue', showValue = true, className = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const colors = {
    blue: 'bg-blue-600',
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  }
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="text-slate-600 dark:text-slate-300 font-medium">{label}</span>
          {showValue && <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[tone]} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
