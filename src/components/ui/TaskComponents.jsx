import { CheckCircle2, Circle } from 'lucide-react'
import Badge from './Badge'
import ProgressBar from './ProgressBar'
import { PRIORITY_LABEL, priorityTone, taskStatusLabel, taskStatusTone } from '../../pages/volunteer/volunteerLabels'

export function PriorityBadge({ priority, className = '' }) {
  return (
    <Badge tone={priorityTone(priority)} className={className}>
      {PRIORITY_LABEL[priority] || 'PRIORITY UNAVAILABLE'}
    </Badge>
  )
}

export function StatusBadge({ status, className = '' }) {
  return (
    <Badge tone={taskStatusTone(status)} className={className}>
      {taskStatusLabel(status)}
    </Badge>
  )
}

// Simple ordered checklist-style timeline — each entry is either completed
// (has already happened, in chronological order from the task's `timeline`
// array) or still pending. No live tracking, no timestamps beyond what the
// task record already stored.
export function TaskTimeline({ entries = [] }) {
  if (entries.length === 0) return <p className="text-sm text-slate-400 dark:text-slate-500 italic">No workflow steps recorded yet.</p>
  return (
    <div className="space-y-2.5">
      {entries.map((e, i) => (
        <div key={e.id || i} className="flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{e.label}</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">{new Date(e.timestamp).toLocaleString('en-GB')}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Upcoming (not-yet-reached) workflow steps, shown greyed out below TaskTimeline
// so the volunteer sees the whole guided path, not just what already happened.
export function UpcomingSteps({ steps = [] }) {
  if (steps.length === 0) return null
  return (
    <div className="space-y-2.5 opacity-50">
      {steps.map((label, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <Circle size={16} className="text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-500 dark:text-slate-400 leading-snug">{label}</div>
        </div>
      ))}
    </div>
  )
}

// Evacuated / In transit / Remaining / Unverified — a progress bar plus
// grouped counts, reused by the task card, task detail and People page.
export function ProgressSummary({ progress, total, className = '' }) {
  const { evacuated = 0, inTransit = 0, remaining = 0, unverified = 0 } = progress || {}
  const pct = total > 0 ? Math.round((evacuated / total) * 100) : 0
  return (
    <div className={className}>
      <ProgressBar value={pct} label={`${evacuated} / ${total} evacuated`} tone="good" />
      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        <StatChip label="Evacuated" value={evacuated} tone="good" />
        <StatChip label="In transit" value={inTransit} tone="warning" />
        <StatChip label="Remaining" value={remaining} tone="danger" />
        <StatChip label="Unverified" value={unverified} tone="default" />
      </div>
    </div>
  )
}

function StatChip({ label, value, tone }) {
  const toneClass = { good: 'text-emerald-600 dark:text-emerald-400', warning: 'text-amber-600 dark:text-amber-400', danger: 'text-red-600 dark:text-red-400', default: 'text-slate-600 dark:text-slate-300' }[tone]
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 py-2.5">
      <div className={`text-lg font-bold ${toneClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{label}</div>
    </div>
  )
}

// Explicit, always-visible demo-data disclosure — used on every Volunteer
// portal screen that shows simulated readiness/progress/assignment data.
export function DemoDataBadge({ className = '' }) {
  return (
    <Badge tone="default" className={className}>
      Demo data
    </Badge>
  )
}
