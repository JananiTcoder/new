import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Route as RouteIcon,
  Clock,
  UserCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Navigation,
  Sparkles,
  Phone,
  Check,
  Send,
  Building2,
  HeartHandshake,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import GeoMap from '../../components/map/GeoMap'
import { LegendDot, LegendBox } from '../../components/map/MapLegend'
import { SAFE_SITE_COLOR } from '../../components/map/mapLayerDefs'
import {
  hazardZones,
  severityLevels,
  PLANNER_SAFE_SITES,
  EMERGENCY_COORDINATORS,
  NEARBY_VOLUNTEERS,
  getCandidateRoutesForSite,
  DEFAULT_HABITATION,
} from '../../data/relocationPlannerData'
import { usePlannerHabitation } from './usePlannerContext'

export default function ChooseSite() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const { habitation = DEFAULT_HABITATION, assignTeamToOperation } = usePlannerHabitation()

  // Match safe site by parameter or default to Lakeview Shelter Complex
  const selectedSite = useMemo(() => {
    return PLANNER_SAFE_SITES.find((s) => s.id === siteId) || PLANNER_SAFE_SITES[0]
  }, [siteId])

  // Operational selections
  const [selectedRouteId, setSelectedRouteId] = useState('route-a')
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('coord-arun') // Default Arun Kumar as per prompt
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('vol-priya') // Default Priya S. as per prompt
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isDispatching, setIsDispatching] = useState(false)

  // Candidate routes connecting origin to selected site
  const candidateRoutes = useMemo(() => {
    return getCandidateRoutesForSite(habitation, selectedSite).map((r) => ({
      ...r,
      isAlternative: r.id !== selectedRouteId,
    }))
  }, [habitation, selectedSite, selectedRouteId])

  const activeRoute = candidateRoutes.find((r) => r.id === selectedRouteId) || candidateRoutes[0]
  const assignedCoordinator = EMERGENCY_COORDINATORS.find((c) => c.id === selectedCoordinatorId) || EMERGENCY_COORDINATORS[0]
  const assignedVolunteer = NEARBY_VOLUNTEERS.find((v) => v.id === selectedVolunteerId) || NEARBY_VOLUNTEERS[0]

  // Map markers: Origin, Safe Site, and the candidate coordinators / volunteers
  const mapMarkers = [
    {
      id: habitation.id,
      type: 'habitation',
      position: habitation.position,
      label: `${habitation.name} (Origin - Critical Red Zone)`,
      color: '#dc2626',
    },
    {
      id: selectedSite.id,
      type: 'site',
      shape: 'shelter',
      position: selectedSite.position,
      label: `${selectedSite.name} (Destination)`,
      color: '#059669',
    },
    // Plot coordinator location
    {
      id: assignedCoordinator.id,
      type: 'coordinator',
      shape: 'coordinator',
      position: assignedCoordinator.position,
      label: `Coordinator: ${assignedCoordinator.name} (${assignedCoordinator.location})`,
      color: '#2563eb',
    },
    // Plot volunteer location
    {
      id: assignedVolunteer.id,
      type: 'volunteer',
      shape: 'volunteer',
      position: assignedVolunteer.position,
      label: `Volunteer: ${assignedVolunteer.name} (${assignedVolunteer.location})`,
      color: '#9333ea',
    },
  ]

  const handleAssignTeam = () => {
    setIsConfirmModalOpen(true)
  }

  const handleConfirmAndDispatch = () => {
    setIsDispatching(true)

    const operationId = `OP-${habitation.id.toUpperCase().slice(0, 3)}-01`
    const operationPayload = {
      operationId,
      operationName: `${habitation.name} Evacuation & Relocation Operation`,
      habitationId: habitation.id,
      habitationName: habitation.name,
      safeSiteId: selectedSite.id,
      safeSite: selectedSite,
      routeId: activeRoute.id,
      route: activeRoute,
      coordinatorId: assignedCoordinator.id,
      coordinator: assignedCoordinator,
      volunteerId: assignedVolunteer.id,
      volunteer: assignedVolunteer,
      status: 'Dispatched',
      timelineStep: 'dispatched',
      hazardLevel: 'High / Critical',
      teamDistance: `${assignedCoordinator.distanceText} from operation zone`,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST (Live Dispatch)',
      createdAt: new Date().toISOString(),
    }

    // Persist to localStorage for demo persistence across nested pages
    try {
      localStorage.setItem('geosentra_active_operation', JSON.stringify(operationPayload))
      localStorage.setItem(`geosentra_op_${operationId}`, JSON.stringify(operationPayload))
    } catch (e) {
      console.warn('Could not store operation in local storage', e)
    }

    // Also update central AppStateContext if connected
    if (typeof assignTeamToOperation === 'function') {
      assignTeamToOperation(habitation.id, {
        safeSiteId: selectedSite.id,
        routeId: activeRoute.id,
        coordinatorId: assignedCoordinator.id,
        volunteerIds: [assignedVolunteer.id],
      })
    }

    // Brief realistic dispatch latency before auto-navigating to Current Operation Status page
    setTimeout(() => {
      setIsConfirmModalOpen(false)
      setIsDispatching(false)
      navigate(`/app/routes/operation/${operationId}`, {
        state: { operation: operationPayload, justDispatched: true },
      })
    }, 1200)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1440px] mx-auto space-y-6 animate-fade-up">
      {/* Explicit parent back navigation - NEVER navigate(-1) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => navigate('/app/routes')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs"
        >
          <ArrowLeft size={16} /> Back to Relocation Planner
        </button>

        <div className="flex items-center gap-2">
          <Badge tone="blue">Step 2 of 2: Operational Dispatch</Badge>
          <Badge tone="warning">Critical Evacuation Mandate</Badge>
        </div>
      </div>

      {/* 5. TOP SECTION: SELECTED SAFE SITE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={15} /> Selected Relocation Safe Site
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Building2 size={24} className="text-blue-600 dark:text-blue-400" />
              {selectedSite.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin size={13} className="text-slate-400 shrink-0" />
              {selectedSite.address} · <span className="font-medium text-slate-700 dark:text-slate-300">{selectedSite.district}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Available Capacity</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {selectedSite.availableCapacity.toLocaleString()} <span className="text-xs font-medium text-slate-400">/ {selectedSite.capacity}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Current Status</div>
              <Badge tone="good" className="mt-0.5">{selectedSite.status}</Badge>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Road Access</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {selectedSite.roadAccess.split(' ')[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. LARGE ROUTE SELECTION MAP (Shows hazard zones, safe site, origin, ALL routes) */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base lg:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Navigation size={18} className="text-blue-600 dark:text-blue-400" />
              Evacuation Route Selection Map
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All candidate corridors are mapped simultaneously. Solid line denotes currently selected route.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            Selected: {activeRoute.name} ({activeRoute.distanceKm} km)
          </div>
        </div>

        <div className="relative h-[440px] w-full">
          <GeoMap
            markers={mapMarkers}
            routes={candidateRoutes}
            selectedRouteId={selectedRouteId}
            onRouteClick={setSelectedRouteId}
            hazardZones={hazardZones}
            showHazards
            className="rounded-none"
            fitToContent
          />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-[500] glass rounded-xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs max-w-[95%]">
            {severityLevels.map((s) => (
              <LegendDot key={s.id} color={s.color} label={s.label} />
            ))}
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
            <LegendBox color={SAFE_SITE_COLOR} label="Safe Sites" />
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" /> Coordinator
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-white" /> Volunteer
            </div>
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
            <div className="flex items-center gap-1 font-bold text-blue-600">
              <span className="w-3.5 h-1 bg-blue-600 rounded-xs inline-block" /> Selected Route
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-3.5 border-t-2 border-dashed border-slate-400 inline-block" /> Alternative Route
            </div>
          </div>
        </div>

        {/* 5. ALL POSSIBLE ROUTE OPTIONS CARDS */}
        <div className="p-5 lg:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Select Evacuation Route Option:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {candidateRoutes.map((route) => {
              const isSelected = route.id === selectedRouteId
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`cursor-pointer rounded-xl border p-4.5 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/25 ring-2 ring-blue-500/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        {route.routeNumber}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {route.name}
                      </h4>
                    </div>
                    <Badge tone={route.riskLevel === 'Low' ? 'good' : route.riskLevel === 'Moderate' ? 'warning' : 'danger'}>
                      {route.riskLevel} Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-2.5 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Distance</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {route.distanceKm} km
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. Travel Time</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {route.estimatedTimeMin} min
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Road Status: </span>
                      <span className="font-medium">{route.roadStatus}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Accessibility: </span>
                      <span className="font-medium">{route.currentAccessibility}</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span>{isSelected ? 'Route Selected' : 'Choose Route'}</span>
                    </div>
                    <Badge tone={isSelected ? 'blue' : 'default'} className="text-[10px]">
                      {isSelected ? 'Active' : 'Alternative'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 6 & 7. NEARBY EMERGENCY COORDINATORS & NEARBY VOLUNTEERS (STRICTLY SEPARATE SECTIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6. DEDICATED SECTION: NEARBY EMERGENCY COORDINATORS */}
        <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
                <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
                Nearby Emergency Coordinators
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Qualified government response leads stationed near the disaster zone.
              </p>
            </div>
            <Badge tone="blue">{EMERGENCY_COORDINATORS.length} Available</Badge>
          </div>

          <div className="space-y-3">
            {EMERGENCY_COORDINATORS.map((coord) => {
              const isAssigned = coord.id === selectedCoordinatorId
              return (
                <div
                  key={coord.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isAssigned
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {coord.name}
                        </h4>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                          {coord.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin size={12} className="text-slate-400" /> {coord.location}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {coord.distanceText} from operation
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isAssigned ? 'primary' : 'secondary'}
                      onClick={() => setSelectedCoordinatorId(coord.id)}
                      className="shrink-0"
                    >
                      {isAssigned ? (
                        <>
                          <Check size={14} className="mr-1" /> Assigned
                        </>
                      ) : (
                        'Assign'
                      )}
                    </Button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Radio size={12} className="text-slate-400" />
                      <span>{coord.contactChannel}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Status: </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{coord.status}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* 7. DEDICATED SECTION: NEARBY VOLUNTEERS */}
        <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
                <HeartHandshake size={18} className="text-purple-600 dark:text-purple-400" />
                Nearby Volunteers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Certified civil defense and volunteer responders ready for immediate deployment.
              </p>
            </div>
            <Badge tone="purple">{NEARBY_VOLUNTEERS.length} Available</Badge>
          </div>

          <div className="space-y-3">
            {NEARBY_VOLUNTEERS.map((vol) => {
              const isAssigned = vol.id === selectedVolunteerId
              return (
                <div
                  key={vol.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isAssigned
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 ring-1 ring-purple-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {vol.name}
                        </h4>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded">
                          {vol.capability}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin size={12} className="text-slate-400" /> {vol.location}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {vol.distanceText} away
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isAssigned ? 'primary' : 'secondary'}
                      onClick={() => setSelectedVolunteerId(vol.id)}
                      className={isAssigned ? 'bg-purple-600 hover:bg-purple-700 text-white shrink-0' : 'shrink-0'}
                    >
                      {isAssigned ? (
                        <>
                          <Check size={14} className="mr-1" /> Assigned
                        </>
                      ) : (
                        'Assign'
                      )}
                    </Button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      <span>{vol.phone}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Status: </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{vol.status}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* 8. PRIMARY ASSIGNMENT ACTION BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Ready to Dispatch Team</div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Selected Safe Site: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedSite.name}</span> · Route: <span className="font-bold text-blue-600 dark:text-blue-400">{activeRoute.routeNumber} ({activeRoute.distanceKm} km)</span>
          </div>
          <div className="text-xs text-slate-500">
            Assigned: {assignedCoordinator.name} (Coordinator) & {assignedVolunteer.name} (Volunteer)
          </div>
        </div>

        <Button
          size="lg"
          onClick={handleAssignTeam}
          className="w-full sm:w-auto px-8 shadow-md shadow-blue-500/20"
        >
          <Send size={18} className="mr-2" /> Assign Team & Dispatch
        </Button>
      </div>

      {/* 9. ASSIGNMENT CONFIRMATION MODAL (Professional Government EOC Notification) */}
      <Modal
        open={isConfirmModalOpen}
        onClose={() => !isDispatching && setIsConfirmModalOpen(false)}
        title="ASSIGNMENT CONFIRMED — DISASTER AUTHORITY DISPATCH"
        wide
      >
        <div className="space-y-5">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Team Assigned Successfully</div>
              <div className="text-xs mt-0.5">
                Emergency Coordinator <span className="font-bold">{assignedCoordinator.name}</span> and Volunteer <span className="font-bold">{assignedVolunteer.name}</span> have been assigned to the relocation operation.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-bold uppercase text-slate-400 block text-[10px]">Safe Site</span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedSite.name}</span>
              <span className="text-slate-500 block">{selectedSite.address}</span>
            </div>
            <div>
              <span className="font-bold uppercase text-slate-400 block text-[10px]">Selected Route</span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{activeRoute.name}</span>
              <span className="text-slate-500 block">{activeRoute.distanceKm} km · Est. {activeRoute.estimatedTimeMin} mins</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700/60 pt-2.5">
              <span className="font-bold uppercase text-slate-400 block text-[10px]">Emergency Coordinator</span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{assignedCoordinator.name}</span>
              <span className="text-slate-500 block">{assignedCoordinator.role} · {assignedCoordinator.location}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700/60 pt-2.5">
              <span className="font-bold uppercase text-slate-400 block text-[10px]">Assigned Volunteer</span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{assignedVolunteer.name}</span>
              <span className="text-slate-500 block">{assignedVolunteer.capability} · {assignedVolunteer.location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Initial Dispatch Status:</span>
            <Badge tone="good">Dispatched</Badge>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              disabled={isDispatching}
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Modify Assignment
            </Button>
            <Button
              onClick={handleConfirmAndDispatch}
              disabled={isDispatching}
              className="px-6"
            >
              {isDispatching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Dispatching Teams...
                </>
              ) : (
                'Confirm & Proceed to Live Operation Status'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
