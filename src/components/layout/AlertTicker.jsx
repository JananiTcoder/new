import { AlertTriangle } from 'lucide-react'

const FALLBACK_MESSAGE = 'No active alerts — all monitored habitations currently normal.'

// Compact one-line alert/news preview strip for the Authority Overview page.
// Reuses whatever alerts the caller already derived from live app state (see
// utils/alerts.js) — never invents content. The scrolling marquee is CSS-only
// (see .ticker-track / @keyframes ticker-scroll in index.css) with a static,
// non-animated fallback for prefers-reduced-motion.
export default function AlertTicker({ items = [] }) {
  const text = items.length > 0 ? items.join('   •   ') : FALLBACK_MESSAGE

  return (
    <div className="shrink-0 h-9 flex items-center gap-2 px-3 lg:px-4 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/25" role="status" aria-live="off">
      <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />

      <div className="relative flex-1 min-w-0 h-full overflow-hidden">
        {/* Animated marquee — hidden under prefers-reduced-motion */}
        <div className="motion-reduce:hidden absolute inset-y-0 left-0 flex items-center gap-16 whitespace-nowrap ticker-track">
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300">{text}</span>
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300" aria-hidden="true">
            {text}
          </span>
        </div>

        {/* Static fallback — shown only under prefers-reduced-motion */}
        <div className="hidden motion-reduce:flex items-center h-full">
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300 truncate">{text}</span>
        </div>
      </div>
    </div>
  )
}
