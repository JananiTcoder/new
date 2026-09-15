import { useEffect, useRef, useState } from 'react'
import * as Icons from 'lucide-react'
import { searchLocations } from '../../data/locations'

const TYPE_ICON = {
  habitation: 'Home',
  site: 'ShieldCheck',
  shelter: 'Building2',
  hospital: 'Cross',
  school: 'School',
  landmark: 'MapPin',
}

export default function LocationSearch({ icon: Icon, label, value, onChange }) {
  const [query, setQuery] = useState(value?.name || '')
  const [open, setOpen] = useState(false)
  const blurTimeout = useRef(null)

  useEffect(() => {
    setQuery(value?.name || '')
  }, [value])

  const results = searchLocations(query)

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
        <Icon size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</div>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimeout.current = setTimeout(() => setOpen(false), 120)
            }}
            className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 outline-none truncate"
            placeholder="Search location..."
          />
        </div>
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-[600] mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1.5">
          {results.map((loc) => {
            const LIcon = Icons[TYPE_ICON[loc.type]] || Icons.MapPin
            return (
              <button
                key={loc.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(loc)
                  setQuery(loc.name)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-white/5 text-left"
              >
                <LIcon size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{loc.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
