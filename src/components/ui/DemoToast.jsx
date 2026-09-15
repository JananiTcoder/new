import { useEffect } from 'react'
import { Info, X } from 'lucide-react'

// Small auto-dismissing banner for "this frontend action succeeded but is
// demo-only" confirmations (alert status changes, resource assignment,
// destination changes, blocker resolution) — never implies a real backend
// call happened. Render conditionally on a `message` string in local state;
// pass `null`/`''` to hide.
export default function DemoToast({ message, onDismiss, duration = 3500 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => onDismiss?.(), duration)
    return () => clearTimeout(t)
  }, [message, duration, onDismiss])

  if (!message) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[calc(100%-2rem)] animate-fade-up">
      <div className="flex items-start gap-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-xl px-4 py-3 text-sm">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <span className="flex-1">{message}</span>
        <button onClick={onDismiss} aria-label="Dismiss notification" className="text-slate-400 hover:text-white shrink-0">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
