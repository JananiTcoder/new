import { useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function BottomSheet({ children, peek, expanded, onToggle, title }) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = expanded !== undefined ? expanded : internalExpanded
  const toggle = onToggle || (() => setInternalExpanded((v) => !v))

  return (
    <div
      className={`fixed left-0 right-0 bottom-16 z-30 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-8px_30px_rgba(15,23,42,0.12)] transition-[height] duration-300 ease-out flex flex-col lg:hidden`}
      style={{ height: isExpanded ? '72vh' : peek || '30vh' }}
    >
      <button onClick={toggle} className="flex flex-col items-center pt-2.5 pb-1.5 shrink-0 w-full">
        <div className="h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        {title && (
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            {title}
            <ChevronUp size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        )}
      </button>
      <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
    </div>
  )
}
