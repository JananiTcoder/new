const TONES = {
  default: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  purple: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  dark: 'bg-slate-800 text-white',
}

export default function Badge({ tone = 'default', children, className = '', icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${TONES[tone]} ${className}`}
    >
      {Icon && <Icon size={12} strokeWidth={2.6} />}
      {children}
    </span>
  )
}

export function riskTone(level) {
  const l = (level || '').toLowerCase()
  if (l.includes('immediate') || l.includes('high') || l.includes('critical')) return 'danger'
  if (l.includes('medium') || l.includes('moderate') || l.includes('watch') || l.includes('short-term')) return 'warning'
  if (l.includes('low') || l.includes('good') || l.includes('excellent') || l.includes('normal') || l.includes('safe')) return 'good'
  return 'default'
}
