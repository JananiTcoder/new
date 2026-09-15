import * as Icons from 'lucide-react'
import Card from './Card'
import AnimatedCounter from './AnimatedCounter'

const TONE_STYLES = {
  default: { bg: 'bg-blue-50 dark:bg-blue-500/10', icon: 'text-blue-600 dark:text-blue-400' },
  good: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: 'text-emerald-600 dark:text-emerald-400' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-500/10', icon: 'text-amber-600 dark:text-amber-400' },
  danger: { bg: 'bg-red-50 dark:bg-red-500/10', icon: 'text-red-600 dark:text-red-400' },
}

export default function MetricCard({ label, value, icon, trend, tone = 'default', onClick }) {
  const Icon = Icons[icon] || Icons.Activity
  const styles = TONE_STYLES[tone]
  return (
    <Card
      hover
      onClick={onClick}
      className={`p-5 flex flex-col gap-3 animate-fade-up ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`h-9 w-9 rounded-xl ${styles.bg} flex items-center justify-center`}>
          <Icon size={18} className={styles.icon} strokeWidth={2.2} />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        <AnimatedCounter value={value} />
      </div>
      {trend && <div className="text-xs font-medium text-slate-400 dark:text-slate-500">{trend}</div>}
    </Card>
  )
}
