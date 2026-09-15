import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Globe2, Users, MapPinned, Home, ShieldCheck, Info, Route as RouteIcon } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge, { riskTone } from '../components/ui/Badge'
import MetricCard from '../components/ui/MetricCard'
import GeoMap from '../components/map/GeoMap'
import { nationalRelocations, RELOCATION_ACTIVITY_TYPES, RELOCATION_STATUSES, RELOCATION_PRIORITIES, computeNationalSummary } from '../data/nationalRelocations'
import { HAZARD_TYPES, getHazardType } from '../types/geosentra'
import { useAppState } from '../state/AppStateContext'

const STATUS_TONE = { Planned: 'blue', 'In Progress': 'warning', Completed: 'good', Delayed: 'danger' }
const TYPE_TONE = { Immediate: 'danger', 'Short-Term': 'warning', 'Medium-Term': 'blue', Permanent: 'good' }

const FILTER_DEFAULTS = { state: 'all', relocationType: 'all', status: 'all', hazardType: 'all', priority: 'all' }

export default function NationalRelocations() {
  const navigate = useNavigate()
  const { setCustomRoute } = useAppState()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(FILTER_DEFAULTS)

  const states = useMemo(() => [...new Set(nationalRelocations.map((r) => r.state))].sort(), [])
  const summary = useMemo(() => computeNationalSummary(nationalRelocations), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return nationalRelocations.filter((r) => {
      if (filters.state !== 'all' && r.state !== filters.state) return false
      if (filters.relocationType !== 'all' && r.relocationType !== filters.relocationType) return false
      if (filters.status !== 'all' && r.status !== filters.status) return false
      if (filters.hazardType !== 'all' && r.hazardType !== filters.hazardType) return false
      if (filters.priority !== 'all' && r.priority !== filters.priority) return false
      if (!q) return true
      return (
        r.habitation.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q)
      )
    })
  }, [query, filters])

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const clearFilters = () => {
    setQuery('')
    setFilters(FILTER_DEFAULTS)
  }
  const hasActiveFilters = query.trim() !== '' || Object.values(filters).some((v) => v !== 'all')

  // Hands this record's exact source/destination to Route Intelligence via
  // AppStateContext (the app's existing mechanism for pre-seeding Route
  // Intelligence's origin/destination — see Institution.jsx's
  // setRouteOriginOverride and Dashboard/SafeSites/Relocation's selectSite),
  // then navigates there. Every relocation record gets its own route because
  // the origin/destination come straight from that record, not a shared default.
  const openRoute = (record) => {
    setCustomRoute({
      origin: { id: `nr-source-${record.id}`, name: record.habitation, lat: record.source.lat, lng: record.source.lng },
      destination: { id: `nr-dest-${record.id}`, name: record.destination, lat: record.destinationPos.lat, lng: record.destinationPos.lng },
    })
    navigate('/app/routes/lookup')
  }

  const markers = filtered.map((r) => ({
    id: r.id,
    type: 'habitation',
    position: r.source,
    label: `${r.habitation} (${r.state})`,
    color: getHazardType(r.hazardType)?.color,
  }))

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe2 size={22} className="text-blue-600 dark:text-blue-400" /> All Relocations Across India
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">National monitoring view of relocation activity across states — Disaster Authority only.</p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2 text-xs text-amber-800 dark:text-amber-400 flex items-center gap-2 max-w-sm">
          <Info size={14} className="shrink-0" /> Mock / prototype data — no live government or backend feed connected.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Active Relocations" value={summary.activeCount} icon="Activity" tone="warning" trend={`of ${nationalRelocations.length} tracked`} />
        <MetricCard label="People Being Relocated" value={summary.totalPeople} icon="UsersRound" tone="danger" trend="across all records" />
        <MetricCard label="States Involved" value={summary.stateCount} icon="MapPinned" tone="default" trend="states currently active" />
        <MetricCard label="Temporary Relocations" value={summary.temporaryCount} icon="Tent" tone="default" trend="Immediate / Short / Medium-Term" />
        <MetricCard label="Permanent Relocations" value={summary.permanentCount} icon="Home" tone="good" trend="fully resettled destinations" />
      </div>

      <Card className="relative h-[360px] lg:h-[440px] p-0 overflow-hidden">
        <GeoMap
          center={[22.9734, 78.6569]}
          zoom={4.3}
          markers={markers}
          showHazards={false}
          fitToContent={filtered.length > 0}
          onMarkerClick={(m) => {
            const record = filtered.find((r) => r.id === m.id)
            if (record) openRoute(record)
          }}
        />
        <div className="absolute top-4 left-4 z-[500] glass rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <MapPinned size={12} /> {filtered.length} relocation source{filtered.length === 1 ? '' : 's'} shown, colored by hazard type — click a marker for its route
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search habitation, destination, district or state..."
            className="w-full h-10 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700 focus:border-blue-300 dark:focus:border-blue-500 focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <FilterSelect label="State" value={filters.state} onChange={(v) => setFilter('state', v)} options={states} />
          <FilterSelect label="Type" value={filters.relocationType} onChange={(v) => setFilter('relocationType', v)} options={RELOCATION_ACTIVITY_TYPES} />
          <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilter('status', v)} options={RELOCATION_STATUSES} />
          <FilterSelect label="Hazard" value={filters.hazardType} onChange={(v) => setFilter('hazardType', v)} options={HAZARD_TYPES.map((h) => h.id)} labels={Object.fromEntries(HAZARD_TYPES.map((h) => [h.id, h.label]))} />
          <FilterSelect label="Priority" value={filters.priority} onChange={(v) => setFilter('priority', v)} options={RELOCATION_PRIORITIES} />
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 self-center">
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      </Card>

      {filtered.length === 0 && (
        <Card className="p-10 flex flex-col items-center text-center text-slate-400 dark:text-slate-500">
          <ShieldCheck size={28} className="mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No relocation activity matches your filters.</p>
          <button onClick={clearFilters} className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-3">
            Clear all filters
          </button>
        </Card>
      )}

      {filtered.length > 0 && (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  <th className="px-5 py-3.5 font-semibold">Habitation</th>
                  <th className="px-5 py-3.5 font-semibold">Destination</th>
                  <th className="px-5 py-3.5 font-semibold">District / State</th>
                  <th className="px-5 py-3.5 font-semibold">Hazard</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">People</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Authority</th>
                  <th className="px-5 py-3.5 font-semibold">Route</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => openRoute(r)}
                    title={`View route: ${r.habitation} → ${r.destination}`}
                    className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{r.habitation}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{r.destination}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {r.district}, {r.state}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{getHazardType(r.hazardType)?.label}</td>
                    <td className="px-5 py-4">
                      <Badge tone={TYPE_TONE[r.relocationType]}>{r.relocationType}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{r.peopleCount.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={riskTone(r.priority)}>{r.priority}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {r.authority}
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Since {r.startDate}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openRoute(r)
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:gap-1.5 transition-all"
                      >
                        <RouteIcon size={13} /> View route
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <Card key={r.id} hover onClick={() => openRoute(r)} className="p-4 cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{r.habitation}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {r.district}, {r.state}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <Home size={12} /> To {r.destination}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                  <Badge tone={TYPE_TONE[r.relocationType]}>{r.relocationType}</Badge>
                  <Badge tone={riskTone(r.priority)}>{r.priority} priority</Badge>
                  <span className="text-slate-400 dark:text-slate-500">{getHazardType(r.hazardType)?.label}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {r.peopleCount.toLocaleString()} people
                  </span>
                  <span>Since {r.startDate}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">{r.authority}</div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                    <RouteIcon size={13} /> View route
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, labels }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-300 dark:focus:border-blue-500"
    >
      <option value="all">All {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {labels?.[opt] || opt}
        </option>
      ))}
    </select>
  )
}
