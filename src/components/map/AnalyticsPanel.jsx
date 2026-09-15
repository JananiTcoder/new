import { X, BarChart3 } from 'lucide-react'
import MetricCard from '../ui/MetricCard'

// Slide-out analytics drawer shown inside the map area when "View Analytics"
// is clicked. Stays mounted (translated off-screen) so it can transition in
// and out, keeps the map underneath untouched, and never permanently occupies
// map space. Cards are the reusable MetricCard component — no bespoke markup
// duplicated per card.
export default function AnalyticsPanel({ open, onClose, metrics = [] }) {
  return (
    <>
      {open && <div className="absolute inset-0 z-[590] bg-slate-900/30 dark:bg-black/50" onClick={onClose} aria-hidden="true" />}

      <div
        id="authority-analytics-panel"
        role="dialog"
        aria-modal="false"
        aria-label="Overview analytics"
        className={`absolute top-0 right-0 z-[600] h-full w-full sm:w-[26rem] max-w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 truncate">Overview Analytics</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close analytics panel"
            className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {metrics.map((m) => (
            <MetricCard key={m.id} {...m} />
          ))}
        </div>
      </div>
    </>
  )
}
