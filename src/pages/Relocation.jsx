import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, MapPin, Users, Sparkles, Navigation2, TrendingUp, AlertTriangle, CheckCircle2, Gauge, Search, X, SearchX, ShieldCheck, XCircle } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import SelectedHabitationBar from '../components/ui/SelectedHabitationBar'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import AssignmentBreadcrumb from '../components/ui/AssignmentBreadcrumb'
import { getSafeSite, safeSites } from '../data/safeSites'
import { getRelocationMatches } from '../data/relocationMatches'
import { planAllocation } from '../utils/relocationCalculations'
import { computeEffectiveCapacity, computeCurrentLoadPct } from '../utils/capacityCalculations'
import { hazardZones } from '../data/hazards'
import { pointInPolygon } from '../utils/geo'
import { getInfrastructureForSafeSite } from '../provider/capacityService'
import { useAppState } from '../state/AppStateContext'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'
import { useProviderData } from '../provider/providerStore'
import { OPERATION_STATUS } from '../types/geosentra'

const RECOMMENDATION_STYLE = { 'BEST MATCH': 'good', 'PARTIAL MATCH': 'warning', 'ALTERNATE OPTION': 'blue' }

// Illustrative travel-time estimate from real distance (avg 30 km/h) — same
// "deterministic function of real data, clearly not a live routing engine"
// convention as utils/routeCalculations.js.
const estimateTravelMin = (distanceKm) => Math.max(4, Math.round((distanceKm / 30) * 60))

function isOutsideHazardZone(site, habitation) {
  const relevantZones = hazardZones.filter((z) => habitation.hazards.includes(z.type))
  return !relevantZones.some((z) => pointInPolygon(site.position, z.polygon))
}

function buildSuitabilityReasons({ site, match, outsideHazard, infraCount, loadPct, bottleneckLabel }) {
  const positives = []
  const warnings = []
  if (outsideHazard) positives.push('Outside the habitation’s current hazard zone')
  else warnings.push('Site falls within an active hazard zone for this habitation’s hazard type')
  if (match.sufficient) positives.push('Enough available capacity for this habitation')
  else warnings.push(match.whyNot)
  if (site.roadAccess === 'Excellent' || site.roadAccess === 'Good') positives.push(`Accessible route (road access: ${site.roadAccess})`)
  else warnings.push(`Road access reported ${site.roadAccess.toLowerCase()}`)
  if (site.capacity.medicalCapacity !== computeEffectiveCapacity(site).effectiveCapacity) positives.push('Medical support available')
  if (infraCount > 0) positives.push(`${infraCount} registered infrastructure provider${infraCount === 1 ? '' : 's'} at this site`)
  else warnings.push('No infrastructure providers registered at this site yet')
  if (loadPct > 80) warnings.push('Capacity approaching limit')
  if (bottleneckLabel) warnings.push(`${bottleneckLabel} is this site's limiting factor`)
  return { positives, warnings }
}

export default function Relocation() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const canEditAllocation = role === ROLES.DISASTER_AUTHORITY
  const { habitations, selectedHabitationId, selectSite, getAllocationsFor, setAllocation, getOperationForHabitation, updateOperationField } = useAppState()
  const { providers, capacitiesById } = useProviderData()
  const habitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const operation = getOperationForHabitation(habitation.id)
  const inFlow = !!operation && operation.status === OPERATION_STATUS.PLANNING
  const [whyMatch, setWhyMatch] = useState(null)
  const [overrides, setOverrides] = useState({})
  const [destinationQuery, setDestinationQuery] = useState('')

  const matches = useMemo(() => getRelocationMatches(habitation), [habitation])
  const allocationMap = getAllocationsFor(habitation.id)
  const plan = useMemo(
    () => planAllocation(habitation, Object.entries(allocationMap).map(([siteId, amount]) => ({ siteId, amount })), safeSites),
    [habitation, allocationMap]
  )

  const selectSiteForOperation = (siteId) => {
    selectSite(siteId)
    if (operation) updateOperationField(habitation.id, { safeSiteId: siteId })
    navigate('/app/infrastructure')
  }

  const filteredMatches = useMemo(() => {
    const q = destinationQuery.trim().toLowerCase()
    if (!q) return matches
    return matches.filter((m) => {
      const site = getSafeSite(m.siteId)
      return (
        site.name.toLowerCase().includes(q) ||
        (site.district || '').toLowerCase().includes(q) ||
        (site.type || '').toLowerCase().includes(q)
      )
    })
  }, [matches, destinationQuery])

  const handleAllocationChange = (siteId, value, cap) => {
    const amount = Math.max(0, Number(value) || 0)
    const clamped = overrides[siteId] ? amount : Math.min(amount, Math.max(cap, 0))
    setAllocation(habitation.id, siteId, clamped)
  }

  const openRoutes = (siteId) => {
    selectSite(siteId)
    navigate('/app/routes')
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relocation Planner</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {canEditAllocation
              ? 'Match a habitation to feasible, capacity-checked safe sites and allocate people to a phased plan.'
              : 'Operational view of relocation matching and allocation progress — allocation editing is reserved for Disaster Authority.'}
          </p>
        </div>
        {canEditAllocation && (
          <Link to="/app/what-if" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0">
            Advanced: What-If Scenario Tool →
          </Link>
        )}
      </div>

      {inFlow && <AssignmentBreadcrumb operation={operation} />}

      <SelectedHabitationBar />

      {/* Allocation summary */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gauge size={17} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Allocation Plan — {habitation.name}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Metric icon={Users} label="Population Requiring Relocation" value={plan.populationNeeding.toLocaleString()} />
          <Metric icon={CheckCircle2} label="Allocated" value={plan.allocatedTotal.toLocaleString()} />
          <Metric icon={AlertTriangle} label="Unallocated" value={plan.unallocated.toLocaleString()} warn={plan.unallocated > 0} />
          <Metric icon={TrendingUp} label="Timeframe" value={habitation.risk.relocationTimeframe} />
        </div>
        <ProgressBar value={Math.min(100, (plan.allocatedTotal / plan.populationNeeding) * 100)} label="Allocated of population requiring relocation" tone={plan.isComplete ? 'good' : 'blue'} />
        {plan.hasOvercapacity && (
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2.5">
            <AlertTriangle size={15} /> One or more sites are allocated beyond available capacity. Enable "Allow override" on that site only if this is intentional.
          </div>
        )}
        {plan.isPartial && !plan.hasOvercapacity && (
          <div className="mt-4 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2.5">
            Partial relocation status — {plan.unallocated.toLocaleString()} residents are not yet assigned to a safe site.
          </div>
        )}
      </Card>

      {/* Relocation destination search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={destinationQuery}
          onChange={(e) => setDestinationQuery(e.target.value)}
          placeholder="Search relocation destination..."
          aria-label="Search relocation destination"
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-300 dark:focus:border-blue-500 focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
        {destinationQuery && (
          <button
            onClick={() => setDestinationQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Ranked matches + allocation controls */}
      <div className="space-y-4">
        {filteredMatches.length === 0 && (
          <Card className="p-10 flex flex-col items-center text-center text-slate-400 dark:text-slate-500">
            <SearchX size={28} className="mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No relocation destinations match "{destinationQuery}".</p>
            <p className="text-xs mt-1 mb-4">Try a different destination name, district or site type.</p>
            <Button variant="secondary" size="sm" onClick={() => setDestinationQuery('')}>
              Clear search
            </Button>
          </Card>
        )}
        {filteredMatches.map((match, i) => {
          const site = getSafeSite(match.siteId)
          const allocated = allocationMap[site.id] || 0
          const perSite = plan.perSite.find((p) => p.siteId === site.id)
          const override = !!overrides[site.id]
          const outsideHazard = isOutsideHazardZone(site, habitation)
          const loadPct = computeCurrentLoadPct(site)
          const infraCount = getInfrastructureForSafeSite(site, providers, capacitiesById).length
          const { positives, warnings } = buildSuitabilityReasons({ site, match, outsideHazard, infraCount, loadPct, bottleneckLabel: match.bottleneckLabel })
          return (
            <Card key={match.siteId} className="p-6 animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-sm">#{i + 1}</div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{site.name}</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Suitability {match.matchScore}%</span>
                  </div>
                </div>
                <Badge tone={RECOMMENDATION_STYLE[match.recommendation] || 'blue'}>{match.recommendation}</Badge>
              </div>

              <ProgressBar value={match.matchScore} tone={match.matchScore >= 85 ? 'good' : match.matchScore >= 65 ? 'blue' : 'warning'} className="mb-5" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                <Metric icon={TrendingUp} label="Safety Score" value={match.safetyScore} />
                <Metric icon={Users} label="Available Capacity" value={match.availableCapacity.toLocaleString()} />
                <Metric icon={Navigation2} label="Distance" value={`${match.distanceKm} km`} />
                <Metric icon={Gauge} label="Bottleneck" value={match.bottleneckLabel} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                <Metric icon={Navigation2} label="Est. Travel Time" value={`${estimateTravelMin(match.distanceKm)} min`} />
                <Metric icon={ShieldCheck} label="Operational Status" value={loadPct >= 100 ? 'At Capacity' : 'Operational'} warn={loadPct >= 100} />
                <Metric icon={Users} label="Current Occupancy" value={site.currentOccupancy.toLocaleString()} />
                <Metric icon={Gauge} label="Reserved Capacity" value={site.reservedCapacity.toLocaleString()} />
              </div>

              <div className="flex flex-wrap gap-2 mb-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Infrastructure: <b className="text-slate-700 dark:text-slate-300">{match.infrastructure}</b></span>
                <span>·</span>
                <span>Livelihood continuity: <b className="text-slate-700 dark:text-slate-300">{match.livelihoodContinuity}</b></span>
                <span>·</span>
                <span>Hazard exposure: <b className={outsideHazard ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{outsideHazard ? 'Outside current hazard zone' : 'Within hazard zone'}</b></span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3.5">
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1.5">Suitable because</div>
                  <ul className="space-y-1">
                    {positives.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                        <ShieldCheck size={12} className="mt-0.5 shrink-0" /> {p}
                      </li>
                    ))}
                    {positives.length === 0 && <li className="text-xs text-emerald-800 dark:text-emerald-300">No strong positive factors identified.</li>}
                  </ul>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3.5">
                  <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">Warning</div>
                  <ul className="space-y-1">
                    {warnings.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                        <XCircle size={12} className="mt-0.5 shrink-0" /> {w}
                      </li>
                    ))}
                    {warnings.length === 0 && <li className="text-xs text-amber-800 dark:text-amber-300">No warnings for this site.</li>}
                  </ul>
                </div>
              </div>

              {/* Allocation control — editing reserved for Disaster Authority; other roles get a read-only view. */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-5">
                {canEditAllocation ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide" htmlFor={`alloc-${site.id}`}>
                        Allocate to this site
                      </label>
                      <input
                        id={`alloc-${site.id}`}
                        type="number"
                        min={0}
                        value={allocated}
                        onChange={(e) => handleAllocationChange(site.id, e.target.value, match.availableCapacity)}
                        className="w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-auto">
                        <input type="checkbox" checked={override} onChange={(e) => setOverrides((p) => ({ ...p, [site.id]: e.target.checked }))} />
                        Allow override beyond capacity
                      </label>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(match.availableCapacity, allocated, 1)}
                      step={10}
                      value={allocated}
                      onChange={(e) => handleAllocationChange(site.id, e.target.value, match.availableCapacity)}
                      className="w-full accent-blue-600"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Allocated to this site</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{allocated.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={allocated} max={Math.max(match.availableCapacity, allocated, 1)} tone="blue" showValue={false} />
                  </>
                )}
                {perSite?.overCapacity && (
                  <div className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                    Over capacity by {perSite.overCapacityBy.toLocaleString()} — bottleneck is {perSite.bottleneckLabel.toLowerCase()}.
                  </div>
                )}
                {!perSite?.overCapacity && allocated > 0 && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{perSite?.remainingAfter.toLocaleString()} spaces remaining after this allocation.</div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="secondary" size="sm" onClick={() => setWhyMatch({ match, site })}>
                  <Sparkles size={14} /> Why this site?
                </Button>
                {inFlow ? (
                  <Button size="sm" onClick={() => selectSiteForOperation(site.id)}>
                    <ShieldCheck size={14} /> Select This Safe Site
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => openRoutes(site.id)}>
                    View Safe Routes <ArrowRight size={14} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate('/app/safe-sites')}>
                  <MapPin size={14} /> View Site Details
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <DataStatusPanel />

      <Modal open={!!whyMatch} onClose={() => setWhyMatch(null)} title={`Why ${whyMatch?.site.name}?`} side>
        {whyMatch && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric icon={TrendingUp} label="Safety Score" value={whyMatch.match.safetyScore} />
              <Metric icon={Gauge} label="Suitability Score" value={`${whyMatch.match.matchScore}%`} />
              <Metric icon={Users} label="Available Capacity" value={whyMatch.match.availableCapacity.toLocaleString()} />
              <Metric icon={Navigation2} label="Distance" value={`${whyMatch.match.distanceKm} km`} />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Suitability is a distinct concept from safety: it blends this site's safety score with how much capacity headroom, road access and livelihood
              continuity it offers for <b>this specific habitation</b> right now. A safer site can still be a worse match if it can't hold everyone.
            </p>
            <div className="h-px bg-slate-100 dark:bg-slate-800" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-sm">Compared to other options</h4>
              <div className="space-y-3">
                {matches
                  .filter((m) => m.siteId !== whyMatch.match.siteId)
                  .map((m) => {
                    const s = getSafeSite(m.siteId)
                    return (
                      <div key={m.siteId} className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Why not {s.name}?</div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                          {m.whyNot || `${s.name} scores lower overall (${m.matchScore}% suitability) due to reduced infrastructure or livelihood continuity relative to the top match.`}
                        </p>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Metric({ icon: Icon, label, value, warn }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium mb-1">
        <Icon size={13} /> {label}
      </div>
      <div className={`font-bold ${warn ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>{value}</div>
    </div>
  )
}
