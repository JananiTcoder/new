import { Loader2, ShieldCheck, BellOff, WifiOff, HelpCircle, Inbox } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

// Reusable empty/loading/unavailable states for the Citizen Portal — replaces
// placeholder values like 0, "0 km", "Unknown score" with an honest message
// about what's actually happening, per the "never turn missing data into
// zero" rule. Default messages are translated (Citizen Portal only reuses
// these), but an explicit `message` prop always wins.

export function LoadingState({ message = 'Checking current safety information...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 gap-3 ${className}`}>
      <Loader2 size={22} className="text-blue-500 animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  )
}

export function NoRiskState({ message = 'No active risk detected in your area', className = '' }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 ${className}`}>
      <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
      <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{message}</p>
    </div>
  )
}

export function NoAlertsState({ message, className = '' }) {
  const { t } = useLanguage()
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 gap-3 ${className}`}>
      <BellOff size={22} className="text-slate-300 dark:text-slate-600" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message || t('noActiveAlerts')}</p>
    </div>
  )
}

export function UnavailableState({ title, hint = 'Please use the latest available instructions and stay alert.', className = '' }) {
  const { t } = useLanguage()
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 ${className}`}>
      <WifiOff size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{title || t('liveDataUnavailable')}</p>
        {hint && <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}

// Generic reusable empty state — "No tasks are currently assigned to you.",
// "No incidents reported.", etc. Distinct from NoAlertsState/NoRiskState
// (which carry their own icon/tone) since an empty list can mean many
// different things across the Volunteer portal.
export function EmptyState({ message = 'Nothing to show right now.', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 gap-3 ${className}`}>
      <Inbox size={22} className="text-slate-300 dark:text-slate-600" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  )
}

export function InfoUnavailable({ message, className = '' }) {
  const { t } = useLanguage()
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 italic ${className}`}>
      <HelpCircle size={12} /> {message || t('informationUnavailable')}
    </span>
  )
}
