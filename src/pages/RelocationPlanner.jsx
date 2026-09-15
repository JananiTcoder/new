import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, MapPin, AlertTriangle, Gauge, Users, ShieldCheck, ClipboardList, Eye, Route as RouteIcon } from 'lucide-react'
import Badge, { riskTone } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import GeoMap from '../components/map/GeoMap'
import { LegendDot, LegendBox } from '../components/map/MapLegend'
import { SAFE_SITE_COLOR } from '../components/map/mapLayerDefs'
import { severityLevels } from '../data/hazards'
import { safeSites, getSafeSite } from '../data/safeSites'
import { shelters, hospitals, schools } from '../data/dashboard'
import { getHazardType, OPERATION_STATUS } from '../types/geosentra'
import { usePlannerHabitation } from './relocation-planner/usePlannerContext'
import { STATUS_DISPLAY_LABEL } from './relocation-planner/plannerStatus'

// Redesigned Relocation Planner — a full-page background map (habitation,
// hazard zone, safe sites, infrastructure, the operation's existing route if
// any) with a floating info panel that hands off into the two nested planner
// pages (View Details / Choose Site). Only reachable by Disaster Authority
// and Emergency Coordinator (see roleConfig.js 'routes-plan'); Citizen and
// Volunteer keep their own dedicated /app/routes experience unchanged.
export default function RelocationPlanner() {
  const navigate = useNavigate()
  const { habitations, selectHabitation, habitation, operation, relevantHazardZones } = usePlannerHabitation()

  const selectedSite = operation?.safeSiteId ? getSafeSite(operation.safeSiteId) : null
  const status = operation?.status || OPERATION_STATUS.YET_TO_PLAN_RESCUE

  const safeSiteMarkers = safeSites.map((s) => ({ id: s.id, type: 'site', shape: 'box', color: SAFE_SITE_COLOR, position: s.position, label: s.name }))
  const infraMarkers = [...shelters, ...hospitals, ...schools].map((m) => ({ id: m.id, type: m.type, position: m.position, label: m.name }))
  const markers = [
    { id: habitation.id, type: 'habitation', position: habitation.position, label: habitation.name, priority: habitation.risk.status },
    ...safeSiteMarkers,
    ...infraMarkers,
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <GeoMap className="rounded-none" markers={markers} hazardZones={relevantHazardZones} showHazards center={[habitation.position.lat, habitation.position.lng]} zoom={12} />

        {/* Info panel */}
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-[380px] z-[500] glass rounded-2xl shadow-lg p-4 space-y-3.5 max-h-[calc(100%-2rem)] overflow-y-auto">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Relocation Planner</div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight truncate">{habitation.name}</h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="shrink-0" /> {habitation.district}, {habitation.state}
              </div>
            </div>
            <Badge tone={riskTone(habitation.risk.status)}>{habitation.risk.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InfoStat icon={AlertTriangle} label="Hazard" value={getHazardType(habitation.primaryHazard)?.label} />
            <InfoStat icon={Gauge} label="Risk Score" value={`${habitation.risk.riskScore}/100`} />
            <InfoStat icon={Users} label="Affected Population" value={habitation.population.toLocaleString()} />
            <InfoStat icon={ClipboardList} label="Status" value={STATUS_DISPLAY_LABEL[status]} />
            <InfoStat icon={RouteIcon} label="Operation ID" value={operation?.id || 'None'} />
            <InfoStat icon={ShieldCheck} label="Safe Site" value={selectedSite?.name || 'Not yet selected'} />
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 px-2.5 py-1.5">
            <ArrowRightLeft size={13} className="text-slate-400 shrink-0" />
            <select
              value={habitation.id}
              onChange={(e) => selectHabitation(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 outline-none w-full"
              aria-label="Change habitation"
            >
              {habitations.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/routes/details')}>
              <Eye size={14} /> View Details
            </Button>
            <Button size="sm" onClick={() => navigate('/app/routes/choose-site')}>
              <ShieldCheck size={14} /> Choose Site
            </Button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-[500] glass rounded-2xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-4 text-xs max-w-[90%]">
          {severityLevels.map((s) => (
            <LegendDot key={s.id} color={s.color} label={s.label} />
          ))}
          <span className="h-3.5 w-px bg-slate-300 dark:bg-slate-600" />
          <LegendBox color={SAFE_SITE_COLOR} label="Safe Sites" />
        </div>
      </div>
    </div>
  )
}

function InfoStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/70 dark:bg-white/5 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">
        <Icon size={11} /> {label}
      </div>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{value}</div>
    </div>
  )
}
