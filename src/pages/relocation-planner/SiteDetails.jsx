import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Users,
  Phone,
  Radio,
  Clock,
  Route as RouteIcon,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Navigation,
  ArrowRight,
  Sparkles,
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
  getCandidateRoutesForSite,
  DEFAULT_HABITATION,
} from '../../data/relocationPlannerData'
import { usePlannerHabitation } from './usePlannerContext'

export default function SiteDetails() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const { habitation = DEFAULT_HABITATION } = usePlannerHabitation()

  // Resolve safe site from parameter, or fallback to first site (Lakeview Shelter Complex)
  const site = useMemo(() => {
    return PLANNER_SAFE_SITES.find((s) => s.id === siteId) || PLANNER_SAFE_SITES[0]
  }, [siteId])

  const [selectedRouteId, setSelectedRouteId] = useState('route-a')

  // Generate candidate routes connecting current habitation to this safe site
  const routesToSite = useMemo(() => {
    return getCandidateRoutesForSite(habitation, site).map((r) => ({
      ...r,
      isAlternative: r.id !== selectedRouteId,
    }))
  }, [habitation, site, selectedRouteId])

  const activeRoute = routesToSite.find((r) => r.id === selectedRouteId) || routesToSite[0]

  const mapMarkers = [
    {
      id: habitation.id,
      type: 'habitation',
      position: habitation.position,
      label: `${habitation.name} (Affected Origin - Critical Red Zone)`,
      color: '#dc2626',
    },
    {
      id: site.id,
      type: 'site',
      shape: 'shelter',
      position: site.position,
      label: `${site.name} (${site.type})`,
      color: '#059669',
    },
  ]

  const occupancyPct = Math.round((site.currentOccupancy / site.capacity) * 100)

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
          <Badge tone="good">Operational Facility</Badge>
          <Badge tone="blue">Disaster Authority Verified</Badge>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <ShieldCheck size={16} /> Safe Site Inspection & Route Analysis
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {site.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
            <MapPin size={14} className="text-slate-400 shrink-0" /> {site.address} · <span className="font-semibold text-slate-700 dark:text-slate-300">{site.distanceKm} km from {habitation.name}</span>
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => navigate(`/app/routes/site/${site.id}/assign`)}
          className="shadow-md shadow-blue-500/20"
        >
          Choose Site & Assign Team <ArrowRight size={18} className="ml-1" />
        </Button>
      </div>

      {/* Top Details Grid: Site Metrics & Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Key Metrics */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
              <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
              Capacity & Status
            </h3>
            <span className="text-xs font-semibold text-slate-400">Live Sync</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <MetricBlock
              label="Total Capacity"
              value={site.capacity.toLocaleString()}
              subtext="Registered beds"
            />
            <MetricBlock
              label="Available Capacity"
              value={site.availableCapacity.toLocaleString()}
              subtext="Vacant immediately"
              highlight
            />
            <MetricBlock
              label="Current Occupancy"
              value={site.currentOccupancy.toLocaleString()}
              subtext={`${occupancyPct}% utilized`}
            />
            <MetricBlock
              label="Site Type"
              value={site.type.split(' ')[0]}
              subtext={site.type}
            />
          </div>

          <div className="pt-2 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Occupancy Load</span>
              <span className="font-bold text-slate-900 dark:text-slate-200">{occupancyPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyPct > 85 ? 'bg-red-500' : occupancyPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Facilities Checklist */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
              <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
              On-Site Infrastructure
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Ready
            </span>
          </div>

          <ul className="space-y-2.5">
            {site.facilities.map((facility, index) => (
              <li key={index} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{facility}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Road Access:</span> {site.roadAccess}
          </div>
        </Card>

        {/* Contact & EOC Liaison */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
              <Radio size={18} className="text-blue-600 dark:text-blue-400" />
              EOC Contact & Communication
            </h3>
            <span className="text-xs font-semibold text-slate-400">Direct Link</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Facility In-Charge
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {site.contactPerson}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <Phone size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Emergency Telephone</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{site.phone}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <Radio size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">VHF Radio Protocol</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{site.vhfChannel}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Possible Routes Map & Comparison Section */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-5 lg:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RouteIcon size={20} className="text-blue-600 dark:text-blue-400" />
              Possible Routes Comparison — Origin to Safe Site
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visual comparison of candidate evacuation corridors from <span className="font-semibold text-slate-700 dark:text-slate-300">{habitation.name}</span> to <span className="font-semibold text-slate-700 dark:text-slate-300">{site.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Click a route below to highlight</span>
          </div>
        </div>

        {/* Map View */}
        <div className="relative h-[440px] w-full">
          <GeoMap
            markers={mapMarkers}
            routes={routesToSite}
            selectedRouteId={selectedRouteId}
            onRouteClick={setSelectedRouteId}
            hazardZones={hazardZones}
            showHazards
            className="rounded-none"
            fitToContent
          />

          {/* Map Floating Legend (Complete GeoSentra Legend) */}
          <div className="absolute bottom-4 left-4 z-[500] glass rounded-xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs max-w-[95%]">
            {severityLevels.map((s) => (
              <LegendDot key={s.id} color={s.color} label={s.label} />
            ))}
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
            <LegendBox color={SAFE_SITE_COLOR} label="Safe Sites" />
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 hidden sm:inline-block" />
            <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
              <span className="inline-block w-3.5 h-1 rounded-sm bg-blue-600" /> Selected Route
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="inline-block w-3.5 border-t-2 border-dashed border-slate-400" /> Alternative
            </div>
          </div>
        </div>

        {/* Route Cards Comparison Matrix */}
        <div className="p-5 lg:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routesToSite.map((route) => {
              const isSelected = route.id === selectedRouteId
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
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

                  <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Distance</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                        <Navigation size={13} className="text-blue-500" /> {route.distanceKm} km
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Travel Time</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                        <Clock size={13} className="text-blue-500" /> {route.estimatedTimeMin} min
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Condition: </span>
                      {route.roadCondition}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Hazards: </span>
                      {route.majorHazards}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Status: </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{route.roadStatus}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isSelected ? '● Currently Active on Map' : 'Click to preview on map'}
                    </span>
                    <Button
                      size="xs"
                      variant={isSelected ? 'primary' : 'secondary'}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRouteId(route.id)
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Selected Route for Operation: <span className="font-bold text-slate-900 dark:text-slate-100">{activeRoute.name} ({activeRoute.distanceKm} km · {activeRoute.estimatedTimeMin} mins)</span>
            </div>

            <Button
              size="md"
              onClick={() => navigate(`/app/routes/site/${site.id}/assign`)}
              className="w-full sm:w-auto"
            >
              Proceed with this Site & Route <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MetricBlock({ label, value, subtext, highlight }) {
  return (
    <div className={`p-3 rounded-xl border ${highlight ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
        {label}
      </div>
      <div className={`text-xl font-black ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </div>
      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
        {subtext}
      </div>
    </div>
  )
}
