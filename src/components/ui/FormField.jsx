// Lightweight styled form primitives shared by the provider signup/login/
// capacity forms. Matches the input styling already used in LocationSearch.jsx
// and TopBar.jsx so the provider portal reads as the same design system.
const inputClass =
  'w-full rounded-xl border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 dark:focus:border-blue-500'

export function Field({ label, error, hint, required, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-red-600 dark:text-red-400 mt-1">{error}</span>}
    </label>
  )
}

export function Input({ error, className = '', ...props }) {
  return <input className={`${inputClass} ${error ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'} ${className}`} {...props} />
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select className={`${inputClass} ${error ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ error, className = '', ...props }) {
  return <textarea className={`${inputClass} ${error ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700'} min-h-[88px] resize-y ${className}`} {...props} />
}

export function Checkbox({ label, checked, onChange, className = '' }) {
  return (
    <label className={`flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 cursor-pointer select-none ${checked ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' : 'bg-white dark:bg-slate-900'} ${className}`}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>
    </label>
  )
}
