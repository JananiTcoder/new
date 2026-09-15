import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { currentEvent } from '../../data/dashboard'

/**
 * Real browser connectivity (navigator.onLine + online/offline events) —
 * not simulated. Paired with the app's static demo "last updated" string so
 * this never claims a live push feed the app doesn't have; it only tells the
 * truth about (a) whether the browser currently has a network path and (b)
 * how stale the mock safety data is labeled as being.
 */
export default function ConnectionStatus({ className = '' }) {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <div className={`flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      {online ? (
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <Wifi size={13} /> Using last available information
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
          <WifiOff size={13} /> Low-network mode — using last available information
        </span>
      )}
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span>Updated {currentEvent.updated}</span>
    </div>
  )
}
