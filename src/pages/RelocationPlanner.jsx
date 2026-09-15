import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  AlertTriangle,
  Users,
  ShieldCheck,
  Eye,
  ArrowRight,
  Building2,
  Navigation,
  Phone,
  Activity,
  Layers,
  ChevronRight,
  Info,
  Route as RouteIcon,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import Badge, { riskTone } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import GeoMap from '../components/map/GeoMap'
import { LegendDot, LegendBox } from '../components/map/MapLegend'
import { LAYER_DEFS, SAFE_SITE_COLOR } from '../components/map/mapLayerDefs'
import {
  hazardZones,
  severityLevels,
  PLANNER_SAFE_SITES,
  PLANNER_ROUTES,
  shelters,
  hospitals,
  schools,
  getCandidateRoutesForSite,
  DEFAULT_HABITATION,
} from '../data/relocationPlannerData'
import { usePlannerHabitation } from './relocation-planner/usePlannerContext'

export default function RelocationPlanner() {
  const navigate = useNavigate()
  const {
    habitations = [DEFAULT_HABITATION],
    habitation = DEFAULT_HABITATION,
    selectHabitation,
  } = usePlannerHabitation()

  // Layer toggles matching GeoSentra Overview dashboard
  const [layers, setLayers] = useState({
    hazards: true,
    population: true,
    infrastructure: true,
    safeSites: true,
    routes: true,
  })

  // Selected safe site and active candidate route
  const [selectedSiteId, setSelectedSiteId] = useState('lakeview-shelter-complex')
  const [selectedRouteId, setSelectedRouteId] = useState('route-a')

  const toggleLayer = (id) => setLayers((prev) => ({ ...prev, [id]: !prev[id] }))

  const selectedSite = useMemo(() => {
    return PLANNER_SAFE_SITES.find((s) => s.id === selectedSiteId) || PLANNER_SAFE_SITES[0]
  }, [selectedSiteId])

  // Generate candidate routes (Route A, Route B, Route C) connecting affected habitation to selected safe site
  const candidateRoutes = useMemo(() => {
    return getCandidateRoutesForSite(habitation, selectedSite)
  }, [habitation, selectedSite])

  const activeRoute = useMemo(() => {
    return candidateRoutes.find((r) => r.id === selectedRouteId) || candidateRoutes[0]
  }, [candidateRoutes, selectedRouteId])

  // Markers structured identically to GeoSentra Overview (AuthorityOverview.jsx)
  const safeSiteMarkers = useMemo(() => {
    return PLANNER_SAFE_SITES.map((site) => ({
      id: site.id,
      type: 'site',
      shape: 'box',
      color: site.id === selectedSiteId ? '#2563eb' : SAFE_SITE_COLOR,
      position: site.position,
      label: `${site.name} (${site.availableCapacity} available / ${site.capacity} cap)`,
    }))
  }, [selectedSiteId])

  const infraMarkers = useMemo(() => {
    return [...shelters, ...hospitals, ...schools].map((m) => ({
      id: m.id,
      type: m.type,
      position: m.position,
      label: `${m.name} (${m.type})`,
    }))
  }, [])

  const habitationMarkers = useMemo(() => {
    return habitations.map((h) => ({
      id: h.id,
      type: 'habitation',
      position: h.position,
      label: `${h.name} (${h.risk?.status || h.riskStatus || 'Monitored Habitation'})`,
      priority: h.risk?.status || h.riskStatus,
      color: h.id === habitation.id ? '#dc2626' : '#991b1b',
    }))
  }, [habitations, habitation.id])

  // Combine markers based on layer toggles
  const markers = useMemo(() => {
    return [
      ...(layers.population ? habitationMarkers : []),
      ...(layers.safeSites ? safeSiteMarkers : []),
      ...(layers.infrastructure ? infraMarkers : []),
    ]
  }, [layers, habitationMarkers, safeSiteMarkers, infraMarkers])

  // Formatted routes with selected vs alternative line styling
  const displayedRoutes = useMemo(() => {
    if (!layers.routes) return []
    return candidateRoutes.map((r) => ({
      ...r,
      isAlternative: r.id !== selectedRouteId,
    }))
  }, [layers.routes, candidateRoutes, selectedRouteId])

  const handleMarkerClick = (marker) => {
    if (marker.type === 'site') {
      setSelectedSiteId(marker.id)
    } else if (marker.type === 'habitation' && typeof selectHabitation === 'function') {
      selectHabitation(marker.id)
    }
  }

  const occupancyRate = Math.round((selectedSite.currentOccupancy / selectedSite.capacity) * 100)

  return (
    <div className="flex-1 flex flex-col min-h-0 relative isolate overflow-hidden">
      {/* 1. DOMINANT OPERATIONAL GEOSPATIAL MAP (Same as GeoSentra Overview) */}
      <div className="relative flex-1 min-h-0 w-full h-full">
        <GeoMap
          className="rounded-none w-full h-full"
          markers={markers}
          selectedMarkerId={selectedSiteId}
          onMarkerClick={handleMarkerClick}
          hazardZones={hazardZones}
          showHazards={layers.hazards}
          routes={displayedRoutes}
          selectedRouteId={selectedRouteId}
          onRouteClick={setSelectedRouteId}
          center={[12.92, 80.21]}
          zoom={12}
        />

        {/* TOP-LEFT: Disaster Context & Routing System Header */}
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-md z-[500] pointer-events-none">
          <div className="glass rounded-2xl shadow-xl border border-white/60 dark:border-slate-800/80 p-4 pointer-events-auto backdrop-blur-md space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  GeoSentra Routing Engine · Relocation Planner
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  {habitation.name} Evacuation Zone
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} /> {habitation.district}, {habitation.state || 'Tamil Nadu'}
                </div>
              </div>
              <Badge tone="danger">{habitation.risk?.status || habitation.riskStatus || 'Critical Red Zone'}</Badge>
            </div>

            {/* Affected Habitation Quick Switcher */}
            {habitations.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl px-2.5 py-1.5 border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Origin Habitation:</span>
                <select
                  value={habitation.id}
                  onChange={(e) => selectHabitation?.(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none w-full cursor-pointer"
                >
                  {habitations.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.risk?.status || 'At Risk'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Operational Decision Pipeline Narrative */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold border-t border-slate-200/80 dark:border-slate-700/80 pt-2.5">
              <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-1.5 rounded-lg">
                <span className="block text-red-500">HAZARD ZONE</span>
                Critical Red
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 p-1.5 rounded-lg">
                <span className="block text-amber-500">PEOPLE AT RISK</span>
                {habitation.population?.toLocaleString() || '2,450'}
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-1.5 rounded-lg">
                <span className="block text-emerald-500">SAFE SITE</span>
                {selectedSite.name.split(' ')[0]}
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 p-1.5 rounded-lg">
                <span className="block text-blue-500">CANDIDATE</span>
                3 Routes
              </div>
            </div>
          </div>
        </div>

        {/* TOP-RIGHT: Map Layers Toggle Panel (Identical to GeoSentra Overview) */}
        <div className="absolute top-4 right-4 z-[500] glass rounded-2xl p-3 shadow-lg w-48 border border-white/60 dark:border-slate-800 hidden md:block backdrop-blur-md">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1 flex items-center justify-between">
            <span>Map Layers</span>
            <Layers size={13} className="text-slate-400" />
          </div>
          <div className="space-y-1">
            {LAYER_DEFS.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                aria-pressed={layers[l.id]}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  layers[l.id]
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <l.icon size={13} />
                {l.label}
              </button>
            ))}
            <button
              onClick={() => toggleLayer('routes')}
              aria-pressed={layers.routes}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                layers.routes
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <RouteIcon size={13} />
              Routing Corridors
            </button>
          </div>
        </div>

        {/* BOTTOM-RIGHT: Candidate Routes & Action Panel */}
        <div className="absolute bottom-4 right-4 z-[500] w-full max-w-[420px] max-h-[calc(100%-8rem)] flex flex-col pointer-events-none">
          <div className="glass rounded-2xl shadow-2xl border border-white/70 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 pointer-events-auto backdrop-blur-md overflow-y-auto max-h-full">
            {/* Selected Safe Site Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-200/70 dark:border-slate-700/70 pb-2.5">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={13} /> Selected Safe Relocation Site
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight truncate mt-0.5">
                  {selectedSite.name}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin size={11} className="shrink-0 text-slate-400" />
                  {selectedSite.address} · <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedSite.distanceKm} km away</span>
                </div>
              </div>
              <Badge tone="good" className="shrink-0">{selectedSite.status}</Badge>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Available Capacity</div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedSite.availableCapacity.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ {selectedSite.capacity}</span>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Site Type</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {selectedSite.type}
                </div>
              </div>
            </div>

            {/* Quick Site Switcher Dropdown */}
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                Select Alternative Safe Site:
              </div>
              <select
                value={selectedSite.id}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full bg-white/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                {PLANNER_SAFE_SITES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.availableCapacity} available · {s.distanceKm} km)
                  </option>
                ))}
              </select>
            </div>

            {/* Candidate Routes Comparison (Rendered over the Hazard Map) */}
            <div className="space-y-1.5 border-t border-slate-200/70 dark:border-slate-700/70 pt-2.5">
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                <span>Routing Algorithm Candidates (Overlaid on Map):</span>
                <span className="text-blue-600 dark:text-blue-400">Click to compare</span>
              </div>

              <div className="space-y-1.5">
                {candidateRoutes.map((route) => {
                  const isSelected = route.id === selectedRouteId
                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`cursor-pointer p-2 rounded-xl border transition-all text-xs ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 ring-1 ring-blue-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: route.color }}
                          />
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {route.routeNumber}
                          </span>
                        </div>
                        <Badge
                          tone={route.hazardExposure === 'Low' ? 'good' : route.hazardExposure === 'Moderate' ? 'warning' : 'danger'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {route.hazardExposure} Exposure
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        <span>Distance: <b>{route.distanceKm} km</b></span>
                        <span>ETA: <b>{route.estimatedTimeMin} min</b></span>
                        <span>Status: <b className="text-slate-800 dark:text-slate-200">{route.roadStatus}</b></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 4. TWO PRIMARY ACTION BUTTONS (MANDATORY REQUIREMENT) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              {/* ACTION 1: VIEW DETAILS -> Opens /app/routes/site/:siteId */}
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/app/routes/site/${selectedSite.id}`)}
                className="w-full font-bold shadow-xs text-xs"
              >
                <Eye size={14} className="mr-1" /> View Details
              </Button>

              {/* ACTION 2: CHOOSE SITE -> Opens /app/routes/site/:siteId/assign */}
              <Button
                size="md"
                onClick={() => navigate(`/app/routes/site/${selectedSite.id}/assign`)}
                className="w-full font-bold shadow-md shadow-blue-500/20 text-xs"
              >
                <ShieldCheck size={14} className="mr-1" /> Choose Site
              </Button>
            </div>
          </div>
        </div>

        {/* BOTTOM-LEFT: Complete GeoSentra Map Legend (Matches Overview) */}
        <div className="absolute bottom-4 left-4 z-[500] glass rounded-2xl px-4 py-3 shadow-xl border border-white/60 dark:border-slate-800 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs max-w-[90%] backdrop-blur-md">
          {severityLevels.map((s) => (
            <LegendDot key={s.id} color={s.color} label={s.label} />
          ))}
          <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
          <LegendBox color={SAFE_SITE_COLOR} label="Safe Sites" />
          <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
          <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
            <span className="w-3.5 h-1 bg-blue-600 rounded-xs inline-block" /> Selected Route
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <span className="w-3.5 border-t-2 border-dashed border-slate-400 inline-block" /> Alternative Route
          </div>
        </div>
      </div>
    </div>
  )
}
