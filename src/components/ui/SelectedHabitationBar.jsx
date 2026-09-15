import { Home, Users, ArrowRightLeft } from 'lucide-react'
import Card from './Card'
import Badge, { riskTone } from './Badge'
import { useAppState } from '../../state/AppStateContext'
import { getHazardType } from '../../types/geosentra'

/**
 * Shared context header shown on every page that needs to know "which
 * habitation are we currently talking about" (Hazard Intelligence, Relocation,
 * Safe Sites, Route Intelligence, What-If, Audit Trail). Changing the
 * selection here updates AppStateContext, so every other page that reads
 * `selectedHabitationId` stays in sync instead of losing context.
 */
export default function SelectedHabitationBar({ className = '' }) {
  const { habitations, selectedHabitationId, selectHabitation } = useAppState()
  const habitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  if (!habitation) return null

  return (
    <Card className={`p-4 flex flex-wrap items-center gap-4 ${className}`}>
      <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
        <Home size={18} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Selected habitation</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 dark:text-slate-100">{habitation.name}</span>
          <Badge tone={riskTone(habitation.risk.status)}>{habitation.risk.status}</Badge>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <Users size={14} /> {habitation.population.toLocaleString()}
      </div>
      <div className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">{getHazardType(habitation.primaryHazard)?.label}</div>
      <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">
        Risk <b className="text-slate-900 dark:text-slate-100">{habitation.risk.riskScore}/100</b>
      </div>
      <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">{habitation.risk.relocationTimeframe}</div>

      <div className="ml-auto relative">
        <label className="sr-only" htmlFor="change-habitation">
          Change habitation
        </label>
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5">
          <ArrowRightLeft size={13} className="text-slate-400" />
          <select
            id="change-habitation"
            value={habitation.id}
            onChange={(e) => selectHabitation(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 outline-none"
            aria-label="Change habitation"
          >
            {habitations.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  )
}
