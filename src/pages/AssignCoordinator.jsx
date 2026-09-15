import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldAlert,
  MapPin,
  Route as RouteIcon,
  Clock,
  UserCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Navigation,
  Phone,
  Send,
  Building2,
  Check,
  ShieldCheck,
  ChevronRight,
  Info,
  Car,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import GeoMap from '../components/map/GeoMap'
import { LegendDot, LegendBox } from '../components/map/MapLegend'
import { RELIEF_SITE_COLOR } from '../components/map/mapLayerDefs'
import {
  hazardZones,
  PLANNER_SAFE_SITES,
  EMERGENCY_COORDINATORS,
  getCandidateRoutesForSite,
  DEFAULT_HABITATION,
} from '../data/relocationPlannerData'
import { useAppState } from '../state/AppStateContext'
import { assignEmergencyCoordinator } from '../api/coordinatorApi'

export default function AssignCoordinator() {
  const { habitationId } = useParams()
  const navigate = useNavigate()
  const { habitations, assignTeamToOperation, ensurePlanning } = useAppState()

  // Find active habitation or fall back to DEFAULT_HABITATION (Kovalam East)
  const habitation = useMemo(() => {
    if (habitationId) {
      const found = habitations.find((h) => h.id === habitationId)
      if (found) {
        return {
          ...DEFAULT_HABITATION,
          ...found,
          risk: found.risk || DEFAULT_HABITATION.risk,
          vulnerability: found.vulnerability || DEFAULT_HABITATION.vulnerability,
        }
      }
    }
    return DEFAULT_HABITATION
  }, [habitationId, habitations])

  // Selected Relief Site (default to first available site: Tambaram / Lakeview)
  const [selectedSiteId, setSelectedSiteId] = useState(() => PLANNER_SAFE_SITES[0]?.id || 'community-dev-zone')
  const selectedSite = useMemo(() => {
    return PLANNER_SAFE_SITES.find((s) => s.id === selectedSiteId) || PLANNER_SAFE_SITES[0]
  }, [selectedSiteId])

  // Selected Route (default to route-a)
  const [selectedRouteId, setSelectedRouteId] = useState('route-a')

  // Candidate routes connecting habitation to selected relief site
  const candidateRoutes = useMemo(() => {
    return getCandidateRoutesForSite(habitation, selectedSite).map((r) => ({
      ...r,
      isAlternative: r.id !== selectedRouteId,
    }))
  }, [habitation, selectedSite, selectedRouteId])

  const activeRoute = candidateRoutes.find((r) => r.id === selectedRouteId) || candidateRoutes[0]

  // Coordinator selection & modal confirmation states
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('coord-arun')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isDispatching, setIsDispatching] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const candidateCoordinators = EMERGENCY_COORDINATORS

  const targetCoordinator = useMemo(() => {
    return candidateCoordinators.find((c) => c.id === selectedCoordinatorId) || candidateCoordinators[0]
  }, [candidateCoordinators, selectedCoordinatorId])

  // Build map markers
  const mapMarkers = useMemo(() => {
    const markers = [
      {
        id: habitation.id,
        type: 'habitation',
        position: habitation.position,
        label: `${habitation.name} (Affected Habitation - Red Zone)`,
        color: '#dc2626',
        priority: 'Critical Red Zone',
      },
      {
        id: selectedSite.id,
        type: 'site',
        shape: 'shelter',
        position: selectedSite.position,
        label: `${selectedSite.name} (Relief Site)`,
        color: RELIEF_SITE_COLOR,
      },
    ]

    // Add candidate coordinators to map
    candidateCoordinators.forEach((coord) => {
      if (coord.position) {
        markers.push({
          id: coord.id,
          type: 'coordinator',
          shape: 'coordinator',
          position: coord.position,
          label: `Coordinator: ${coord.name} (${coord.location})`,
          color: coord.id === selectedCoordinatorId ? '#2563eb' : '#64748b',
        })
      }
    })

    return markers
  }, [habitation, selectedSite, candidateCoordinators, selectedCoordinatorId])

  const handleOpenAssignModal = (coordinatorId) => {
    setSelectedCoordinatorId(coordinatorId)
    setIsConfirmModalOpen(true)
  }

  const handleConfirmAssignment = async () => {
    setIsDispatching(true)
    try {
      // 1. Call REST API / Push Notification Dispatcher
      const apiResult = await assignEmergencyCoordinator({
        habitationId: habitation.id,
        habitationName: habitation.name,
        reliefSiteId: selectedSite.id,
        reliefSiteName: selectedSite.name,
        coordinatorId: targetCoordinator.id,
        coordinatorName: targetCoordinator.name,
        routeId: activeRoute.id,
        routeName: activeRoute.name,
        populationRequiring: habitation.population,
      })

      // 2. Sync with local AppStateContext
      ensurePlanning(habitation.id)
      assignTeamToOperation(habitation.id, {
        safeSiteId: selectedSite.id,
        routeId: activeRoute.id,
        coordinatorId: targetCoordinator.id,
        volunteerIds: [],
      })

      // 3. Display confirmation toast
      setToastMessage({
        title: 'Coordinator Dispatched',
        message: `Emergency Coordinator ${targetCoordinator.name} assigned! Push notification delivered to mobile app. Operation #${apiResult.operation.id} active.`,
      })

      setIsConfirmModalOpen(false)

      // 4. Navigate to Operations Management after brief notification display
      setTimeout(() => {
        navigate('/app/operations')
      }, 1400)
    } catch (err) {
      console.error('Assignment failed:', err)
      setToastMessage({
        title: 'Dispatch Error',
        message: err.message || 'Failed to dispatch assignment',
        isError: true,
      })
    } finally {
      setIsDispatching(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-start gap-3 max-w-md animate-in fade-in slide-in-from-top-4 duration-300 ${
            toastMessage.isError
              ? 'bg-rose-950 border-rose-800 text-rose-100'
              : 'bg-slate-900 dark:bg-slate-800 border-emerald-500/50 text-slate-100'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-emerald-400">{toastMessage.title}</div>
            <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.message}</div>
          </div>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/app/habitations/${habitation.id}`)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Back to Habitation Detail"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Emergency Response Workflow
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-xs text-slate-500">Coordinator Dispatch</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Assign Emergency Coordinator
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="danger" className="text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
            <ShieldAlert size={14} /> Immediate Action Required
          </Badge>
        </div>
      </div>

      {/* Section 1: Prominent Affected Habitation Context Banner */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-slate-900/60 to-slate-900/40 p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-red-500/5 blur-3xl pointer-events-none" />
        <div className="grid md:grid-cols-4 gap-4 items-center relative z-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {habitation.name}
              </h2>
              <Badge tone="danger" className="uppercase text-[11px] font-bold">
                {habitation.risk?.status || 'Critical Red Zone'}
              </Badge>
            </div>
            <p className="text-sm text-slate-300 flex items-center gap-2">
              <MapPin size={14} className="text-red-400 shrink-0" />
              {habitation.district}, {habitation.state} · Lat {habitation.position.lat.toFixed(4)}, Lng{' '}
              {habitation.position.lng.toFixed(4)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
              Dominant Hazard
            </div>
            <div className="text-sm font-bold text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={15} /> Flood (Coastal Storm Surge)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Severity Score: 94 / 100</div>
          </div>

          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
              Population Requiring Relief
            </div>
            <div className="text-lg font-extrabold text-white flex items-center gap-2">
              <Users size={17} className="text-blue-400" />
              {habitation.population.toLocaleString()} Residents
            </div>
            <div className="text-[11px] text-amber-300">
              Vulnerable: {(habitation.vulnerability?.children || 320) + (habitation.vulnerability?.elderly || 280)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map & Candidate Relief Sites (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Operational GeoMap */}
          <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl relative">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation size={16} className="text-blue-400" />
                <span className="font-semibold text-xs tracking-wide uppercase text-slate-200">
                  Operational Geospatial Deployment Map
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Route: <span className="text-blue-400 font-semibold">{activeRoute.name}</span>
              </span>
            </div>

            <div className="h-[440px] relative">
              <GeoMap
                hazardZones={hazardZones}
                markers={mapMarkers}
                routes={candidateRoutes}
                selectedMarkerId={selectedSite.id}
                center={[12.92, 80.20]}
                zoom={11}
              />
            </div>

            {/* Map Legend Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <LegendDot color="#dc2626" /> Affected Habitation
                </span>
                <span className="flex items-center gap-1.5">
                  <LegendDot color={RELIEF_SITE_COLOR} /> Relief Site
                </span>
                <span className="flex items-center gap-1.5">
                  <LegendDot color="#2563eb" /> Coordinator Station
                </span>
                <span className="flex items-center gap-1.5">
                  <LegendBox color="#ef4444" fill="#ef4444" /> Flood Hazard Polygon
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Live GIS Feeds Active</span>
            </div>
          </Card>

          {/* Candidate Relief Sites Selection */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-500" /> Nearby Relief Sites
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select primary relief center for shelter and supply distribution
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">{PLANNER_SAFE_SITES.length} available</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {PLANNER_SAFE_SITES.slice(0, 4).map((site) => {
                const isSelected = site.id === selectedSite.id
                return (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSiteId(site.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 p-1 rounded-full bg-emerald-500 text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 pr-6 truncate">
                      {site.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin size={12} /> {site.district}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                      <div>
                        <span className="text-slate-400">Available Cap:</span>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {site.availableCapacity.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Road Access:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{site.roadAccess}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Route Details & Coordinator Roster (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Evacuation Route Card */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RouteIcon size={18} className="text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Evacuation Route & Transit Status
                </h3>
              </div>
              <Badge tone={activeRoute.hazardExposure === 'Low' ? 'success' : 'warning'}>
                {activeRoute.hazardExposure} Hazard Exposure
              </Badge>
            </div>

            {/* Route Selector Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg mb-4">
              {candidateRoutes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${
                    selectedRouteId === r.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {r.routeNumber || r.name.split('—')[0].trim()}
                </button>
              ))}
            </div>

            {/* Active Route Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-3 text-center">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center justify-center gap-1 mb-0.5">
                  <MapPin size={11} /> Distance
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeRoute.distanceKm} km
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center justify-center gap-1 mb-0.5">
                  <Clock size={11} /> Est. Time
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeRoute.estimatedTimeMin} min
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center justify-center gap-1 mb-0.5">
                  <Car size={11} /> Road Status
                </div>
                <div className="text-sm font-bold text-emerald-500">{activeRoute.roadStatus}</div>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800 leading-relaxed">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Corridor Status:</div>
              {activeRoute.roadCondition}
            </div>
          </Card>

          {/* Section 6: Nearby Emergency Coordinators Roster */}
          <Card className="p-5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-500" /> Available Emergency Coordinators
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Zonal personnel qualified for high-risk evacuation management
                </p>
              </div>
              <Badge tone="success" className="text-[11px]">
                3 Available
              </Badge>
            </div>

            <div className="space-y-3.5">
              {candidateCoordinators.map((coord) => {
                const isSelected = coord.id === selectedCoordinatorId
                return (
                  <div
                    key={coord.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {coord.name}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            {coord.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {coord.role} · {coord.designation}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleOpenAssignModal(coord.id)}
                        className="shrink-0 text-xs px-3 py-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
                      >
                        <Send size={13} /> Assign
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Location</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {coord.location} ({coord.distanceKm} km)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">VHF Comms</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <Radio size={11} className="text-blue-400" /> {coord.contactChannel.split('·')[0]}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Experience</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {coord.experience.split(' ')[0]} yrs NDRF
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Assignment Summary Confirmation Modal */}
      {isConfirmModalOpen && (
        <Modal
          title="Confirm Emergency Coordinator Assignment"
          onClose={() => !isDispatching && setIsConfirmModalOpen(false)}
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 p-4 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
              <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
              <span>
                Confirming will dispatch an encrypted emergency operational directive to the coordinator&apos;s mobile device, generate the relief ticket, and activate monitoring protocols.
              </span>
            </div>

            {/* Structured Assignment Summary Details */}
            <div className="space-y-3 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs">Affected Area</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {habitation.name} ({habitation.district})
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs">Hazard & Severity</span>
                <span className="font-semibold text-red-500 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Flood · Critical Red Zone
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs">Relief Site</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedSite.name}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs">Assigned Coordinator</span>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{targetCoordinator.name}</div>
                  <div className="text-xs text-slate-500">{targetCoordinator.role} · {targetCoordinator.location}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs">Evacuation Route</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {activeRoute.name} ({activeRoute.distanceKm} km)
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs">Est. Travel Time</span>
                <span className="font-bold text-blue-500">{activeRoute.estimatedTimeMin} Minutes</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs">Priority Level</span>
                <Badge tone="danger" className="text-xs font-bold uppercase">
                  Immediate Rescue
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isDispatching}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAssignment}
                disabled={isDispatching}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {isDispatching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Dispatching Assignment...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirm Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
