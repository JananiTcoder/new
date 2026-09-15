import { AlertTriangle, Clock, Radio } from 'lucide-react'
import Badge from '../ui/Badge'
import { currentEvent, computeOperationalStatusLabel } from '../../data/dashboard'
import { useAppState } from '../../state/AppStateContext'

const SEVERITY_TONE = { HIGH: 'danger', MODERATE: 'warning', LOW: 'good' }
const STATUS_TONE = { Active: 'danger', Monitoring: 'blue', Paused: 'warning', Completed: 'good', 'Data unavailable': 'default' }

// Persistent "Emergency Operations Center" strip shown on every Emergency
// Coordinator page (rendered once in DashboardLayout, not per-page) so the
// coordinator always has current-emergency context without re-deriving it —
// every value here reads from the same currentEvent/operations state every
// other page uses, never a separate hardcoded banner value.
export default function EOCBanner() {
  const { operations } = useAppState()
  const statusLabel = computeOperationalStatusLabel(operations)

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-white/[0.02] px-4 lg:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      <span className="font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase text-[11px] shrink-0">Emergency Operations Center</span>
      <Badge tone={SEVERITY_TONE[currentEvent.severity] || 'danger'} icon={AlertTriangle}>
        {currentEvent.severity} SEVERITY
      </Badge>
      <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[420px]" title={`${currentEvent.name} — ${currentEvent.region}`}>
        {currentEvent.name} — {currentEvent.region}
      </span>
      <Badge tone={STATUS_TONE[statusLabel] || 'default'} icon={Radio}>
        {statusLabel} operation
      </Badge>
      <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0">
        <Clock size={12} /> Updated {currentEvent.updated}
      </span>
      <Badge tone="default" className="shrink-0 ml-auto">
        Demo data
      </Badge>
    </div>
  )
}
