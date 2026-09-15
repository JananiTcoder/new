import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Clock, Route as RouteIcon, UserCog, Info } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge, { riskTone } from '../../components/ui/Badge'
import GeoMap from '../../components/map/GeoMap'
import { getHazardType, OPERATION_STATUS } from '../../types/geosentra'
import { safeSites } from '../../data/safeSites'
import { generateRoutes, isAuthoredPair } from '../../utils/routing'
import { routeGeometry } from '../../data/routes'
import { computeRouteRisk } from '../../utils/routeCalculations'
import { getCoordinator } from '../../data/coordinators'
import { usePlannerHabitation } from './usePlannerContext'
import { STATUS_DISPLAY_LABEL } from './plannerStatus'

const DEFAULT_PROFILE = 'young-adult'
const ROUTE_ORDER = ['A', 'B', 'C']

// One representative (fastest/"safest") illustrative route per candidate safe
// site — reuses the exact same route-generation + hazard-exposure engine as
// the Choose Site page (utils/routing.js + utils/routeCalculations.js), just
// picking a single variant per site instead of 3 variants to one site.
function routeToSite(habitation, site, scenario) {
  const origin = { lat: habitation.position.lat, lng: habitation.position.lng }
  const destination = { lat: site.position.lat, lng: site.position.lng }
  const authored = isAuthoredPair(origin, destination)
  const variants = authored ? ROUTE_ORDER.map((id) => ({ ...routeGeometry[id] })) : generateRoutes(origin, destination)
  const route = variants[0]
  const stats = computeRouteRisk(route, DEFAULT_PROFILE, scenario)
  return { site, route, stats }
}

export default function PlannerDetails() {
  const navigate = useNavigate()
  const { habitation, operation, relevantHazardZones, scenario, volunteers } = usePlannerHabitation()

  const status = operation?.status || OPERATION_STATUS.YET_TO_PLAN_RESCUE
  const selectedSite = operation?.safeSiteId ? safeSites.find((s) => s.id === operation.safeSiteId) : null
  const coordinator = operation?.coordinatorId ? getCoordinator(operation.coordinatorId) : null
  const assignedVolunteers = (operation?.volunteerIds || []).map((id) => volunteers.find((v) => v.id === id)).filter(Boolean)

  const siteRoutes = useMemo(() => safeSites.map((site) => routeToSite(habitation, site, scenario)).sort((a, b) => a.route.distanceKm - b.route.distanceKm), [habitation, scenario])

  const routeMarkers = [
    { id: habitation.id, type: 'habitation', position: habitation.position, label: habitation.name, priority: habitation.risk.status },
    ...safeSites.map((s) => ({ id: s.id, type: 'site', shape: 'box', position: s.position, label: s.name })),
  ]
  const routeLines = siteRoutes.map(({ site, route }) => ({ ...route, id: site.id, positions: route.positions.map((p) => (Array.isArray(p) ? p : [p.lat, p.lng])) }))

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <button onClick={() => navigate('/app/routes')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> Relocation Planner
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{habitation.name}</h1>
            <Badge tone={riskTone(habitation.risk.status)}>{habitation.risk.status}</Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {habitation.district}, {habitation.state} · {habitation.population.toLocaleString()} residents
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionTitle icon={AlertTriangle} title="Site Details" />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Hazard Type" value={getHazardType(habitation.primaryHazard)?.label} />
            <Stat label="Hazard Zone Status" value={habitation.risk.status} />
            <Stat label="Risk Score" value={`${habitation.risk.riskScore}/100`} />
            <Stat label="Affected Population" value={habitation.population.toLocaleString()} />
            <Stat label="Current Relocation Status" value={STATUS_DISPLAY_LABEL[status]} />
            <Stat label="Existing Operation ID" value={operation?.id || 'None'} />
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle icon={UserCog} title="Assigned Team & Safe Site" />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Assigned Coordinator" value={coordinator?.name || 'Not yet assigned'} />
            <Stat label="Assigned Volunteers" value={assignedVolunteers.length > 0 ? assignedVolunteers.map((v) => v.name).join(', ') : 'None assigned'} />
            <Stat label="Selected Safe Site" value={selectedSite?.name || 'Not yet selected'} />
            <Stat label="Safe Site Type" value={selectedSite?.type || '—'} />
          </div>
          {!coordinator && (
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2">
              <Info size={13} className="shrink-0 mt-0.5" /> No team assigned yet — use Choose Site to select a safe site, route and rescue team.
            </div>
          )}
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-5 pb-0 flex items-center justify-between flex-wrap gap-2">
          <SectionTitle icon={RouteIcon} title="Possible Routes to Safe Sites" className="mb-0" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Illustrative route for frontend demonstration — not a real routing engine.</span>
        </div>
        <div className="h-[320px] mt-4 relative">
          <GeoMap markers={routeMarkers} routes={routeLines} hazardZones={relevantHazardZones} showHazards className="rounded-none" fitToContent />
        </div>
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {siteRoutes.map(({ site, route, stats }) => (
            <div key={site.id} className={`rounded-xl border p-3.5 ${site.id === operation?.safeSiteId ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{site.name}</span>
                {site.id === operation?.safeSiteId && <Badge tone="blue">Selected</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <RouteIcon size={11} /> {route.distanceKm} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {stats.timeMin} min
                </span>
                <span>{stats.dominantHazardLabel ? `${stats.dominantHazardLabel} exposure` : 'No hazard exposure detected'}</span>
              </div>
              <div className="mt-1.5">
                <Badge tone={stats.tag === 'not-recommended' ? 'danger' : stats.tag === 'balanced' ? 'warning' : 'good'}>{stats.label}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SectionTitle({ icon: Icon, title, className = '' }) {
  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`}>
      <Icon size={16} className="text-blue-600 dark:text-blue-400" />
      <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">{label}</div>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{value}</div>
    </div>
  )
}
