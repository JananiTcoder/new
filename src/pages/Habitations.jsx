import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowUpDown, History, Search, X, SearchX } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge, { riskTone } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import MetricCard from '../components/ui/MetricCard'
import { useAppState } from '../state/AppStateContext'
import { getHazardType, REDZONE_STATUS, RELOCATION_TIMEFRAME, OPERATION_STATUS, statusColor } from '../types/geosentra'
import { operationsList } from '../utils/assignmentCalculations'

const RISK_LEVELS = Object.values(REDZONE_STATUS)
const PRIORITIES = Object.values(RELOCATION_TIMEFRAME)

// "Under Rescue" = a team is actively assigned and moving people; every other
// state (not yet started, still planning, awaiting acceptance, rejected, etc.)
// reads as "Rescue Pending" — the two rescue-progress buckets shown in the
// Habitation table's Status column.
const UNDER_RESCUE_STATUSES = [OPERATION_STATUS.TEAM_ASSIGNED, OPERATION_STATUS.OPERATION_ACTIVE, OPERATION_STATUS.PARTIALLY_RELOCATED]

const VULNERABILITY_TIERS = [
  { key: 'Critical', status: REDZONE_STATUS.CRITICAL },
  { key: 'High', status: REDZONE_STATUS.HIGH_RISK },
  { key: 'Medium', status: REDZONE_STATUS.WATCH },
  { key: 'Low', status: REDZONE_STATUS.NORMAL },
]

export default function Habitations() {
  const navigate = useNavigate()
  const { habitations, selectHabitation, safeSites, getOperationForHabitation, operations } = useAppState()
  const [sortKey, setSortKey] = useState('riskScore')
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [destinationFilter, setDestinationFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const districts = useMemo(() => [...new Set(habitations.map((h) => h.district))].sort(), [habitations])
  const destinationOptions = useMemo(() => [...safeSites].sort((a, b) => a.name.localeCompare(b.name)), [safeSites])

  const evacStatusFor = (h) => getOperationForHabitation(h.id)?.status || 'Not Started'
  const rescueStatusFor = (h) => (UNDER_RESCUE_STATUSES.includes(getOperationForHabitation(h.id)?.status) ? 'Under Rescue' : 'Rescue Pending')
  const destinationFor = (h) => {
    const op = getOperationForHabitation(h.id)
    return op?.safeSiteId ? safeSites.find((s) => s.id === op.safeSiteId)?.name : null
  }

  const filtered = habitations.filter((h) => {
    const q = query.trim().toLowerCase()
    if (q && !h.name.toLowerCase().includes(q) && !h.district.toLowerCase().includes(q)) return false
    if (riskFilter !== 'all' && h.risk.status !== riskFilter) return false
    if (statusFilter !== 'all' && evacStatusFor(h) !== statusFilter) return false
    if (districtFilter !== 'all' && h.district !== districtFilter) return false
    if (priorityFilter !== 'all' && h.risk.relocationTimeframe !== priorityFilter) return false
    if (destinationFilter !== 'all') {
      const dest = destinationFor(h)
      if (destinationFilter === 'none' ? !!dest : dest !== destinationFilter) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'riskScore') return b.risk.riskScore - a.risk.riskScore
    if (sortKey === 'population') return b.population - a.population
    return a.name.localeCompare(b.name)
  })

  const statusOptions = useMemo(() => {
    const set = new Set(habitations.map(evacStatusFor))
    return [...set]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitations])

  const clearFilters = () => {
    setQuery('')
    setRiskFilter('all')
    setStatusFilter('all')
    setDistrictFilter('all')
    setDestinationFilter('all')
    setPriorityFilter('all')
  }
  const hasActiveFilters = query || riskFilter !== 'all' || statusFilter !== 'all' || districtFilter !== 'all' || destinationFilter !== 'all' || priorityFilter !== 'all'

  const open = (id) => {
    selectHabitation(id)
    navigate(`/app/habitations/${id}`)
  }

  const vulnerabilityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    habitations.forEach((h) => {
      const tier = VULNERABILITY_TIERS.find((t) => t.status === h.risk.status)
      counts[tier ? tier.key : 'Low']++
    })
    return counts
  }, [habitations])

  const awaitingRelocationCount = useMemo(
    () => habitations.filter((h) => (h.risk.status === REDZONE_STATUS.CRITICAL || h.risk.status === REDZONE_STATUS.HIGH_RISK) && !getOperationForHabitation(h.id)).length,
    [habitations, getOperationForHabitation]
  )

  const activeRelocationsCount = useMemo(
    () => operationsList(operations).filter((o) => o.status === OPERATION_STATUS.OPERATION_ACTIVE || o.status === OPERATION_STATUS.PARTIALLY_RELOCATED).length,
    [operations]
  )

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vulnerable Habitations</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{habitations.length} habitations tracked across landslide, flood, coastal erosion and cloudburst zones.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 dark:text-slate-500">Sort by</span>
          {['riskScore', 'population', 'name'].map((k) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`px-3 py-1.5 rounded-lg font-medium ${sortKey === k ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              {k === 'riskScore' ? 'Risk' : k === 'population' ? 'Population' : 'Name'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Vulnerable Habitations</h3>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{habitations.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {VULNERABILITY_TIERS.map((t) => (
              <div key={t.key} className="rounded-xl bg-slate-50 dark:bg-white/5 py-2.5 text-center">
                <div className="text-lg font-bold" style={{ color: statusColor(t.status) }}>
                  {vulnerabilityCounts[t.key]}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{t.key}</div>
              </div>
            ))}
          </div>
        </Card>
        <MetricCard
          label="Awaiting Relocation"
          value={awaitingRelocationCount}
          icon="Clock"
          tone={awaitingRelocationCount > 0 ? 'warning' : 'good'}
          trend="High risk or above, no operation started"
          onClick={() => navigate('/app/relocation')}
        />
        <MetricCard
          label="Active Relocations"
          value={activeRelocationsCount}
          icon="Activity"
          tone="good"
          trend="Operations currently in progress"
          onClick={() => navigate('/app/operations')}
        />
      </div>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by habitation or district..."
            aria-label="Search habitations"
            className="w-full h-10 pl-9 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-300 dark:focus:border-blue-500 focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Risk level" value={riskFilter} onChange={setRiskFilter} options={RISK_LEVELS} />
          <FilterSelect label="Evacuation status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterSelect label="District" value={districtFilter} onChange={setDistrictFilter} options={districts} />
          <FilterSelect
            label="Destination"
            value={destinationFilter}
            onChange={setDestinationFilter}
            options={destinationOptions.map((s) => s.name)}
            extraOption={{ value: 'none', label: 'Not yet assigned' }}
          />
          <FilterSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={PRIORITIES} />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={13} /> Clear filters
            </Button>
          )}
        </div>
      </div>

      {sorted.length === 0 && (
        <Card className="p-10 flex flex-col items-center text-center text-slate-400 dark:text-slate-500">
          <SearchX size={28} className="mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No habitations match the current filters.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
            Clear filters
          </Button>
        </Card>
      )}

      {/* Desktop table */}
      {sorted.length > 0 && (
      <Card className="hidden md:block overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <th className="px-5 py-3.5 font-semibold">Habitation</th>
              <th className="px-5 py-3.5 font-semibold">District</th>
              <th className="px-5 py-3.5 font-semibold">Population</th>
              <th className="px-5 py-3.5 font-semibold">Dominant Hazard</th>
              <th className="px-5 py-3.5 font-semibold">
                <span className="inline-flex items-center gap-1">Risk Score <ArrowUpDown size={12} /></span>
              </th>
              <th className="px-5 py-3.5 font-semibold">Vulnerability</th>
              <th className="px-5 py-3.5 font-semibold">History</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => (
              <tr key={h.id} onClick={() => open(h.id)} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 cursor-pointer transition-colors">
                <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{h.name}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{h.district}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{h.population.toLocaleString()}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{getHazardType(h.primaryHazard)?.label}</td>
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100">{h.risk.riskScore}</td>
                <td className="px-5 py-4">
                  <Badge tone={riskTone(h.risk.vulnerabilityTier)}>{h.risk.vulnerabilityTier}</Badge>
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1"><History size={12} /> {h.disasterHistory.incidentCount}</span>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={rescueStatusFor(h) === 'Under Rescue' ? 'blue' : 'warning'}>{rescueStatusFor(h)}</Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      )}

      {/* Mobile cards */}
      {sorted.length > 0 && (
      <div className="md:hidden space-y-3">
        {sorted.map((h) => (
          <Card key={h.id} hover onClick={() => open(h.id)} className="p-4 cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{h.name}</span>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {h.district} · {h.population.toLocaleString()} people · {getHazardType(h.primaryHazard)?.label}
                </div>
              </div>
              <Badge tone={rescueStatusFor(h) === 'Under Rescue' ? 'blue' : 'warning'}>{rescueStatusFor(h)}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-3">
              <span>Risk <b className="text-slate-900 dark:text-slate-100">{h.risk.riskScore}</b></span>
              <span>Vulnerability <b className="text-slate-900 dark:text-slate-100">{h.risk.vulnerabilityTier}</b></span>
              <span className="ml-auto text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                {h.risk.recommendedAction} <ChevronRight size={14} />
              </span>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, extraOption }) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-300 dark:focus:border-blue-500"
      >
        <option value="all">All</option>
        {extraOption && <option value={extraOption.value}>{extraOption.label}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
