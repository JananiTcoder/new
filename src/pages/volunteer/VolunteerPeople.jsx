import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ShieldCheck } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/DataStates'
import { useAppState } from '../../state/AppStateContext'
import { derivePeopleForTasks, summarizePeopleStatus } from '../../utils/volunteerPeople'

const STATUS_TONE = { Critical: 'danger', High: 'warning', Evacuated: 'good', 'In Transit': 'blue', Unverified: 'default' }

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'in-transit', label: 'In transit' },
  { id: 'unverified', label: 'Unverified' },
  { id: 'assistance', label: 'Needs assistance' },
]

export default function VolunteerPeople() {
  const navigate = useNavigate()
  const { habitations, volunteerTasks, createVerificationTask } = useAppState()
  const [filter, setFilter] = useState('all')

  const summary = useMemo(() => summarizePeopleStatus(volunteerTasks), [volunteerTasks])
  const totalTracked = summary.critical + summary.high + summary.evacuated + summary.inTransit + summary.unverified
  const people = useMemo(() => derivePeopleForTasks(volunteerTasks, habitations), [volunteerTasks, habitations])

  const filtered = people.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'critical') return p.status === 'Critical'
    if (filter === 'high') return p.priority === 'High'
    if (filter === 'in-transit') return p.status === 'In Transit'
    if (filter === 'unverified') return p.status === 'Unverified'
    if (filter === 'assistance') return !!p.assistance
    return true
  })

  const habitationsWithUnverified = habitations.filter((h) => volunteerTasks.some((t) => t.habitationId === h.id && (t.progress?.unverified || 0) > 0))

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users size={22} className="text-blue-600 dark:text-blue-400" /> People You Are Supporting
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{totalTracked > 0 ? `${totalTracked.toLocaleString()} people tracked across your tasks.` : 'No people are currently tracked for your tasks.'}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <SummaryChip label="Critical" value={summary.critical} tone="danger" />
        <SummaryChip label="High" value={summary.high} tone="warning" />
        <SummaryChip label="Evacuated" value={summary.evacuated} tone="good" />
        <SummaryChip label="In Transit" value={summary.inTransit} tone="blue" />
        <SummaryChip label="Unverified" value={summary.unverified} tone="default" />
      </div>

      {habitationsWithUnverified.length > 0 && (
        <Card className="p-4 flex items-center justify-between gap-3 flex-wrap border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {summary.unverified} people unverified across {habitationsWithUnverified.length} area{habitationsWithUnverified.length === 1 ? '' : 's'}.
          </p>
          <Button
            size="sm"
            onClick={() => {
              const task = createVerificationTask(habitationsWithUnverified[0].id, `Verify ${summary.unverified} unverified residents.`)
              navigate(`/app/tasks/${task.id}`)
            }}
          >
            Create verification task
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              filter === f.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8">
          <EmptyState message="No people match this filter right now." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{p.label}</span>
                <Badge tone={STATUS_TONE[p.status] || 'default'}>{p.status}</Badge>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{p.area}</div>
              {p.assistance && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-1">
                  <ShieldCheck size={12} /> {p.assistance}
                </div>
              )}
              <div className="text-[11px] text-slate-400 dark:text-slate-500">Verification: {p.verification}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryChip({ label, value, tone }) {
  const toneClass = { danger: 'text-red-600 dark:text-red-400', warning: 'text-amber-600 dark:text-amber-400', good: 'text-emerald-600 dark:text-emerald-400', blue: 'text-blue-600 dark:text-blue-400', default: 'text-slate-600 dark:text-slate-300' }[tone]
  return (
    <Card className="p-3.5 text-center">
      <div className={`text-xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{label}</div>
    </Card>
  )
}
