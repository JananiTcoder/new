export function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-slate-600 dark:text-slate-300 font-medium">{label}</span>
    </div>
  )
}

export function LegendBox({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[3px] border border-white" style={{ background: color }} />
      <span className="text-slate-600 dark:text-slate-300 font-medium">{label}</span>
    </div>
  )
}
