import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldCheck,
  Users,
  Navigation2,
  Route as RouteIcon,
  Clock,
  UserCog,
  CheckSquare,
  Square,
  Info,
  AlertTriangle,
  MapPin,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge, { riskTone } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import DemoToast from '../../components/ui/DemoToast'
import GeoMap from '../../components/map/GeoMap'
import { LegendDot, LegendBox } from '../../components/map/MapLegend'
import { SAFE_SITE_COLOR } from '../../components/map/mapLayerDefs'
import { safeSites } from '../../data/safeSites'
import { getRelocationMatches } from '../../data/relocationMatches'
import { routeGeometry } from '../../data/routes'
import { generateRoutes, isAuthoredPair } from '../../utils/routing'
import { rankRoutesForProfile, getRouteHazardSegments } from '../../utils/routeCalculations'
import { isCoordinatorAvailable, openOperationsForCoordinator, isVolunteerAvailable } from '../../utils/assignmentCalculations'
import { usePlannerHabitation } from './usePlannerContext'

const DEFAULT_PROFILE = 'young-adult'
const ROUTE_ORDER = ['A', 'B', 'C']
const TAG_BADGE = { safest: 'good', balanced: 'warning', 'not-recommended': 'danger' }

export default function ChooseSite() {
  const navigate = useNavigate()
  const { habitation, operation, relevantHazardZones, scenario, coordinators, volunteers, operations, ensurePlanning, assignTeamToOperation, selectSite, selectedSiteId: globalSelectedSiteId } = usePlannerHabitation()

  useEffect(() => {
    if (!operation) ensurePlanning(habitation.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitation.id])

  // Pre-select whichever site the operation already has, falling back to
  // the shared selectedSiteId set by Relocation.jsx's "View Safe Routes"
  // hand-off (the existing cross-page selection pattern) when a Choose Site
  // visit isn't yet tied to a formal operation.
  const [selectedSiteId, setSelectedSiteId] = useState(operation?.safeSiteId || globalSelectedSiteId || null)
  const [selectedRouteId, setSelectedRouteId] = useState('A')
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState(operation?.coordinatorId || null)
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState(operation?.volunteerIds || [])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState('')

  const matches = useMemo(() => getRelocationMatches(habitation), [habitation])
  const selectedMatch = matches.find((m) => m.siteId === selectedSiteId)
  const selectedSite = selectedSiteId ? safeSites.find((s) => s.id === selectedSiteId) : null

  const routes = useMemo(() => {
    if (!selectedSite) return []
    const origin = { lat: habitation.position.lat, lng: habitation.position.lng }
    const destination = { lat: selectedSite.position.lat, lng: selectedSite.position.lng }
    const authored = isAuthoredPair(origin, destination)
    const base = authored ? ROUTE_ORDER.map((id) => ({ ...routeGeometry[id] })) : generateRoutes(origin, destination)
    return base.map((r) => ({ ...r, hazardSegments: getRouteHazardSegments(r, scenario) }))
  }, [selectedSite, habitation, scenario])
  const rankedRoutes = useMemo(() => rankRoutesForProfile(routes, DEFAULT_PROFILE, scenario), [routes, scenario])
  const selectedRoute = routes.find((r) => r.id === selectedRouteId)

  const availableCoordinators = coordinators.filter((c) => isCoordinatorAvailable(c, operations) || c.id === selectedCoordinatorId)
  const availableVolunteers = volunteers.filter((v) => isVolunteerAvailable(v, operations) || selectedVolunteerIds.includes(v.id))
  const selectedCoordinator = coordinators.find((c) => c.id === selectedCoordinatorId)
  const selectedVolunteers = volunteers.filter((v) => selectedVolunteerIds.includes(v.id))

  const pickSite = (siteId) => {
    setSelectedSiteId(siteId)
    setSelectedRouteId('A')
    selectSite(siteId)
  }
  const toggleVolunteer = (id) => setSelectedVolunteerIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))

  const capacityOk = !!selectedMatch && selectedMatch.availableCapacity > 0
  const canAssign = !!selectedSiteId && !!selectedRouteId && !!selectedCoordinatorId && capacityOk

  const handleConfirm = () => {
    const ok = assignTeamToOperation(habitation.id, {
      safeSiteId: selectedSiteId,
      routeId: selectedRouteId,
      coordinatorId: selectedCoordinatorId,
      volunteerIds: selectedVolunteerIds,
    })
    setConfirmOpen(false)
    if (ok) {
      navigate(`/app/routes/operation-status/${habitation.id}`, { state: { justAssigned: true } })
    } else {
      setToast('Assignment could not be created — please try again.')
    }
  }

  const markers = [
    { id: habitation.id, type: 'habitation', position: habitation.position, label: habitation.name, priority: habitation.risk.status },
    ...safeSites.map((s) => ({ id: s.id, type: 'site', shape: 'box', color: s.id === selectedSiteId ? '#2563eb' : SAFE_SITE_COLOR, position: s.position, label: s.name })),
  ]

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <button onClick={() => navigate('/app/routes')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> Relocation Planner
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck size={22} className="text-blue-600 dark:text-blue-400" /> Choose Site — {habitation.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select a safe site, route and rescue team, then assign.</p>
      </div>

      {/* Map */}
      <Card className="relative h-[380px] p-0 overflow-hidden">
        <GeoMap markers={markers} routes={rankedRoutes.map(({ route }) => route)} selectedRouteId={selectedRouteId} onRouteClick={setSelectedRouteId} hazardZones={relevantHazardZones} showHazards />
        <div className="absolute bottom-3 left-3 z-[500] glass rounded-xl px-3 py-2 shadow-lg flex flex-wrap items-center gap-3 text-[11px] max-w-[90%]">
          <LegendDot color="#dc2626" label="Habitation" />
          <LegendBox color={SAFE_SITE_COLOR} label="Safe Sites" />
          <LegendBox color="#2563eb" label="Selected Site" />
        </div>
        <div className="absolute top-3 right-3 z-[500] glass rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 max-w-[220px]">
          <Info size={12} className="shrink-0" /> Coordinator/volunteer positions aren't tracked in this dataset — see the lists below.
        </div>
      </Card>

      {/* Safe sites */}
      <Card className="p-5">
        <SectionTitle icon={ShieldCheck} title="Available Safe Sites" />
        <div className="grid sm:grid-cols-2 gap-3">
          {matches.map((m) => {
            const site = safeSites.find((s) => s.id === m.siteId)
            const full = m.availableCapacity <= 0
            const selected = selectedSiteId === m.siteId
            return (
              <div key={m.siteId} className={`rounded-xl border p-4 ${selected ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'} ${full ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{site.name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <MapPin size={10} /> {site.district} · {m.distanceKm} km
                    </div>
                  </div>
                  <Badge tone={full ? 'danger' : 'good'}>{full ? 'Full' : 'Available'}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 my-2.5">
                  <span>Available capacity: <b className="text-slate-800 dark:text-slate-200">{m.availableCapacity.toLocaleString()}</b></span>
                  <span>Occupied: <b className="text-slate-800 dark:text-slate-200">{site.currentOccupancy.toLocaleString()}</b></span>
                  <span>Site type: <b className="text-slate-800 dark:text-slate-200">{site.type}</b></span>
                  <span>Road access: <b className="text-slate-800 dark:text-slate-200">{site.roadAccess}</b></span>
                </div>
                <Button size="sm" variant={selected ? 'primary' : 'secondary'} className="w-full" disabled={full} onClick={() => pickSite(m.siteId)}>
                  {selected ? 'Selected' : full ? 'Unavailable' : 'Select This Site'}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Routes */}
      {selectedSite && (
        <Card className="p-5">
          <SectionTitle icon={RouteIcon} title={`Possible Routes to ${selectedSite.name}`} />
          <div className="grid sm:grid-cols-3 gap-3">
            {rankedRoutes.map(({ route, stats }) => {
              const selected = selectedRouteId === route.id
              return (
                <button key={route.id} onClick={() => setSelectedRouteId(route.id)} className={`text-left rounded-xl border p-3.5 transition-colors ${selected ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{route.name}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Clock size={11} /> {stats.timeMin} min
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{route.distanceKm} km · {stats.dominantHazardLabel ? `${stats.dominantHazardLabel} exposure` : 'No hazard exposure detected'}</div>
                  <Badge tone={TAG_BADGE[stats.tag]}>{stats.label}</Badge>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Coordinators */}
        <Card className="p-5">
          <SectionTitle icon={UserCog} title="Available Emergency Coordinators" />
          {availableCoordinators.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No Emergency Coordinator is currently available.</p>
          ) : (
            <div className="space-y-2">
              {availableCoordinators.map((c) => {
                const openCount = openOperationsForCoordinator(operations, c.id).length
                const selected = selectedCoordinatorId === c.id
                const sameDistrict = c.region === habitation.district
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCoordinatorId(c.id)}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-colors ${selected ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {c.name}
                        {sameDistrict && <Badge tone="blue">Same district</Badge>}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {c.region} · Open cases {openCount}/{c.maxConcurrentCases}
                      </div>
                    </div>
                    <Badge tone={selected ? 'good' : 'default'}>{selected ? 'Selected' : c.status}</Badge>
                  </button>
                )
              })}
            </div>
          )}
        </Card>

        {/* Volunteers */}
        <Card className="p-5">
          <SectionTitle icon={Users} title="Available Volunteers" />
          {availableVolunteers.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No volunteers are currently available.</p>
          ) : (
            <div className="space-y-2">
              {availableVolunteers.map((v) => {
                const checked = selectedVolunteerIds.includes(v.id)
                const sameDistrict = v.region === habitation.district
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVolunteer(v.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${checked ? 'border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    {checked ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400 shrink-0" /> : <Square size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {v.name}
                        {sameDistrict && <Badge tone="blue">Same district</Badge>}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{v.skill} · {v.region}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {!capacityOk && selectedSiteId && (
        <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3.5 py-2.5">
          <AlertTriangle size={15} /> {selectedSite?.name} has no available capacity — choose a different safe site.
        </div>
      )}

      <div className="flex justify-end">
        <Button size="lg" disabled={!canAssign} onClick={() => setConfirmOpen(true)}>
          <ShieldCheck size={16} /> Assign Team
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Assignment" wide>
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-3.5 text-sm">
            <SummaryRow icon={Navigation2} label="Habitation / Site" value={habitation.name} />
            <SummaryRow icon={AlertTriangle} label="Hazard Zone" value={habitation.risk.status} />
            <SummaryRow icon={ShieldCheck} label="Selected Safe Site" value={selectedSite?.name || '—'} />
            <SummaryRow icon={RouteIcon} label="Selected Route" value={selectedRoute ? `${selectedRoute.name} (${selectedRoute.distanceKm} km)` : '—'} />
            <SummaryRow icon={UserCog} label="Coordinator" value={selectedCoordinator?.name || '—'} />
            <SummaryRow icon={Users} label="Volunteers" value={selectedVolunteers.length > 0 ? selectedVolunteers.map((v) => v.name).join(', ') : 'None selected'} />
            <SummaryRow icon={Navigation2} label="Route Distance" value={selectedRoute ? `${selectedRoute.distanceKm} km` : '—'} />
            <SummaryRow icon={Clock} label="Estimated Time" value={rankedRoutes.find((r) => r.route.id === selectedRouteId)?.stats.timeMin != null ? `${rankedRoutes.find((r) => r.route.id === selectedRouteId).stats.timeMin} min` : '—'} />
          </div>

          {selectedMatch && selectedMatch.availableCapacity < habitation.population && (
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3.5 py-2.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {selectedSite?.name} can currently accept {selectedMatch.availableCapacity.toLocaleString()} of the {habitation.population.toLocaleString()} residents who need to move — consider a phased or split relocation.
            </div>
          )}
          {rankedRoutes.find((r) => r.route.id === selectedRouteId)?.stats.tag === 'not-recommended' && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3.5 py-2.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" /> The selected route has elevated hazard exposure — review before confirming.
            </div>
          )}

          <Button className="w-full" onClick={handleConfirm}>
            Confirm Assignment
          </Button>
        </div>
      </Modal>

      <DemoToast message={toast} onDismiss={() => setToast('')} />
    </div>
  )
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-blue-600 dark:text-blue-400" />
      <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
  )
}

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{label}</div>
        <div className="text-slate-800 dark:text-slate-200 font-semibold">{value}</div>
      </div>
    </div>
  )
}
