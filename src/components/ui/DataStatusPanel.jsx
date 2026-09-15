import { Database } from 'lucide-react'

export default function DataStatusPanel({ className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-white/5 p-4 flex gap-3 ${className}`}>
      <Database size={18} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
      <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Frontend data status:</span> Mock data · No live backend connected · No live
        sensor feed connected · No trained ML model connected. All figures are an <b>illustrative frontend prototype calculation</b>.
      </div>
    </div>
  )
}
