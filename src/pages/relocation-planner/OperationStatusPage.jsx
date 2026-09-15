import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Activity,
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
  Phone,
  Check,
  Building2,
  HeartHandshake,
  ChevronDown,
  RefreshCw,
  Eye,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import GeoMap from '../../components/map/GeoMap'
import { LegendDot, LegendBox } from '../../components/map/MapLegend'
import { SAFE_SITE_COLOR } from '../../components/map/mapLayerDefs'
import {
  hazardZones,
  severityLevels,
  PLANNER_SAFE_SITES,
  PLANNER_ROUTES,
  EMERGENCY_COORDINATORS,
  NEARBY_VOLUNTEERS,
  DEFAULT_HABITATION,
  OPERATION_STATUS_OPTIONS,
} from '../../data/relocationPlannerData'
import { shelters, hospitals, schools } from '../../data/dashboard'

export default function OperationStatusPage() {
  const { operationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Load operation data from navigation state, localStorage, or realistic default
  const [operation, setOperation] = useState(() => {
    if (location.state?.operation) {
      return location.state.operation
    }
    try {
      const saved = localStorage.getItem('geosentra_active_operation')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn(e)
    }
    // Authored fallback matching prompt's exact demonstration example
    return {
      operationId: operationId || 'OP-KOV-01',
      operationName: 'Kovalam Coastal Relocation Operation',
      habitationId: DEFAULT_HABITATION.id,
      habitationName: DEFAULT_HABITATION.name,
      safeSite: PLANNER_SAFE_SITES[0], // Lakeview Shelter Complex
      route: PLANNER_ROUTES[0], // Route A — 8.4 km
      coordinator: EMERGENCY_COORDINATORS[0], // Arun Kumar
      volunteer: NEARBY_VOLUNTEERS[0], // Priya S.
      status: 'Dispatched',
      hazardLevel: 'High / Critical',
      teamDistance: '3.2 km from safe site',
      lastUpdated: 'Today, 19:15 IST (Live Dispatch Feed)',
      createdAt: new Date().toISOString(),
    }
  })

  const [currentStatus, setCurrentStatus] = useState(operation?.status || 'Dispatched')

  // Timeline steps
  const timelineSteps = useMemo(() => [
    { id: 'step-1', label: 'Site Selected', status: 'completed' },
    { id: 'step-2', label: 'Route Selected', status: 'completed' },
    { id: 'step-3', label: 'Team Assigned', status: 'completed' },
    {
      id: 'step-4',
      label: 'Team Dispatched',
      status: currentStatus === 'Dispatched' ? 'current' : ['En Route', 'Arrived', 'In Progress', 'Completed'].includes(currentStatus) ? 'completed' : 'pending',
    },
    {
      id: 'step-5',
      label: 'Team En Route',
      status: currentStatus === 'En Route' ? 'current' : ['Arrived', 'In Progress', 'Completed'].includes(currentStatus) ? 'completed' : 'pending',
    },
    {
      id: 'step-6',
      label: 'Team Arrived',
      status: currentStatus === 'Arrived' ? 'current' : ['In Progress', 'Completed'].includes(currentStatus) ? 'completed' : 'pending',
    },
    {
      id: 'step-7',
      label: 'Operation Completed',
      status: currentStatus === 'Completed' ? 'completed' : 'pending',
    },
  ], [currentStatus])

  // Map markers: Hazard origin, Safe site, Coordinator, Volunteer, and Infrastructure
  const safeSite = operation.safeSite || PLANNER_SAFE_SITES[0]
  const coordinator = operation.coordinator || EMERGENCY_COORDINATORS[0]
  const volunteer = operation.volunteer || NEARBY_VOLUNTEERS[0]
  const activeRoute = operation.route || PLANNER_ROUTES[0]

  const infraMarkers = [...shelters, ...hospitals, ...schools].slice(0, 4).map((m) => ({
    id: m.id,
    type: m.type,
    position: m.position,
    label: `${m.name} (${m.type})`,
  }))

  const mapMarkers = [
    {
      id: 'origin-affected',
      type: 'habitation',
      position: DEFAULT_HABITATION.position,
      label: `${operation.habitationName || DEFAULT_HABITATION.name} (Origin — Critical Red Zone)`,
      color: '#dc2626',
    },
    {
      id: safeSite.id,
      type: 'site',
      shape: 'shelter',
      position: safeSite.position,
      label: `${safeSite.name} (Safe Site)`,
      color: '#059669',
    },
    {
      id: coordinator.id,
      type: 'coordinator',
      shape: 'coordinator',
      position: coordinator.position,
      label: `Emergency Coordinator: ${coordinator.name} (${coordinator.location})`,
      color: '#2563eb',
    },
    {
      id: volunteer.id,
      type: 'volunteer',
      shape: 'volunteer',
      position: volunteer.position,
      label: `Volunteer: ${volunteer.name} (${volunteer.location})`,
      color: '#9333ea',
    },
    ...infraMarkers,
  ]

  // Prepare routes for map: selected route solid, candidate alternatives available
  const displayRoutes = useMemo(() => {
    return PLANNER_ROUTES.map((r) => {
      const isSelected = r.id === activeRoute.id
      const origin = [DEFAULT_HABITATION.position.lat, DEFAULT_HABITATION.position.lng]
      const dest = [safeSite.position.lat, safeSite.position.lng]
      let positions = r.positions
      if (r.positions.length > 2) {
        positions = [origin, ...r.positions.slice(1, -1), dest]
      } else {
        positions = [origin, dest]
      }
      return {
        ...r,
        positions,
        isAlternative: !isSelected,
      }
    })
  }, [activeRoute, safeSite])

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
          <Badge tone="good">● LIVE OPERATION</Badge>
          <Badge tone="blue">Disaster Authority Command Active</Badge>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Activity size={16} /> Current Operation Status & Real-Time Monitoring
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Operation {operation.operationId}: {operation.operationName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Target Area:</span> {operation.habitationName} · <span className="font-semibold text-slate-700 dark:text-slate-300">Safe Site:</span> {safeSite.name} · <span className="font-semibold text-slate-700 dark:text-slate-300">Assigned Team:</span> {coordinator.name} & {volunteer.name}
          </p>
        </div>

        {/* Live Status Selector */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-slate-400">Current Phase</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentStatus}</div>
          </div>
          <select
            value={currentStatus}
            onChange={(e) => setCurrentStatus(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            {OPERATION_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 14. OPERATION TIMELINE */}
      <Card className="p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock size={14} className="text-blue-500" /> Operation Lifecycle Progress
          </div>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Phase: {currentStatus}</span>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
          {timelineSteps.map((step, idx) => {
            const isCompleted = step.status === 'completed'
            const isCurrent = step.status === 'current'
            return (
              <div key={step.id} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isCompleted && <Check size={12} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />}
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  {!isCompleted && !isCurrent && <span className="w-2 h-2 rounded-full border border-slate-400" />}
                  <span>{step.label}</span>
                </div>
                {idx < timelineSteps.length - 1 && (
                  <span className="text-slate-300 dark:text-slate-700 font-bold">→</span>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* 11. LARGE OPERATION MAP (Hazard Zone + Safe Site + Team Pins + Selected Route + Infrastructure) */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base lg:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Navigation size={18} className="text-blue-600 dark:text-blue-400" />
              Live Tactical Operations Map
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live tracking showing assigned teams, active route corridor, hazard polygons, and shelter hub.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" /> Live Telemetry
          </div>
        </div>

        <div className="relative h-[480px] w-full">
          <GeoMap
            markers={mapMarkers}
            routes={displayRoutes}
            selectedRouteId={activeRoute.id}
            hazardZones={hazardZones}
            showHazards
            className="rounded-none"
            fitToContent
          />

          {/* 15. MAP LEGEND */}
          <div className="absolute bottom-4 left-4 z-[500] glass rounded-xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs max-w-[95%]">
            {severityLevels.map((s) => (
              <LegendDot key={s.id} color={s.color} label={s.label} />
            ))}
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
            <LegendBox color={SAFE_SITE_COLOR} label="Safe Sites" />
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white" /> Emergency Coordinator
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
      </Card>

      {/* 12. OPERATION INFORMATION PANEL */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
            <Activity size={18} className="text-blue-600 dark:text-blue-400" />
            Operation Command Information Panel
          </h3>
          <Badge tone="blue">Disaster Authority ID: {operation.operationId}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <InfoItem label="Operation ID" value={operation.operationId} />
          <InfoItem label="Operation Name" value={operation.operationName} />
          <InfoItem label="Current Status" value={currentStatus} highlight />
          <InfoItem label="Hazard Level" value="High / Critical" />
          <InfoItem label="Safe Site" value={safeSite.name} />
          <InfoItem label="Selected Route" value={`${activeRoute.routeNumber} — ${activeRoute.distanceKm} km`} />
          <InfoItem label="Est. Travel Time" value={`${activeRoute.estimatedTimeMin} min`} />
          <InfoItem label="Team Location" value="3.2 km from safe site" />
          <InfoItem label="Assigned Coordinator" value={coordinator.name} />
          <InfoItem label="Assigned Volunteer" value={volunteer.name} />
          <InfoItem label="Affected Population" value="2,450 residents" />
          <InfoItem label="Last Updated" value={operation.lastUpdated || 'Today, 19:15 IST'} />
        </div>
      </Card>

      {/* 13. TEAM STATUS (SEPARATE CARDS FOR ASSIGNED PERSONNEL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EMERGENCY COORDINATOR CARD */}
        <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                EC
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Emergency Coordinator
                </span>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {coordinator.name}
                </h4>
              </div>
            </div>
            <Badge tone="good">{currentStatus === 'Dispatched' ? 'Dispatched' : coordinator.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Role</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{coordinator.role}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Current Location</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{coordinator.location}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Distance</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{coordinator.distanceText}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Assigned Route</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{activeRoute.routeNumber}</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5"><Radio size={13} /> {coordinator.contactChannel}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{coordinator.phone}</span>
          </div>
        </Card>

        {/* VOLUNTEER CARD */}
        <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                VO
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  Volunteer Responder
                </span>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {volunteer.name}
                </h4>
              </div>
            </div>
            <Badge tone="purple">{currentStatus === 'Dispatched' ? 'Dispatched' : volunteer.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Capability / Skill</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{volunteer.capability}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Current Location</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{volunteer.location}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Distance</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{volunteer.distanceText}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Assigned Route</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{activeRoute.routeNumber}</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5"><Phone size={13} /> {volunteer.phone}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Standby / Rapid Responder</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoItem({ label, value, highlight }) {
  return (
    <div className={`p-3 rounded-xl border ${highlight ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
        {label}
      </div>
      <div className={`font-bold text-sm truncate ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
        {value}
      </div>
    </div>
  )
}
