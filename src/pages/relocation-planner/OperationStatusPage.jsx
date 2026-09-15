import { useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Check, Info, Clock, Route as RouteIcon, ExternalLink } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge, { riskTone } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import DemoToast from '../../components/ui/DemoToast'
import OperationSummary from '../../components/ui/OperationSummary'
import GeoMap from '../../components/map/GeoMap'
import { LegendDot, LegendBox } from '../../components/map/MapLegend'
import { SAFE_SITE_COLOR } from '../../components/map/mapLayerDefs'
import { useAppState } from '../../state/AppStateContext'
import { hazardZones } from '../../data/hazards'
import { getHazardType } from '../../types/geosentra'
import { safeSites } from '../../data/safeSites'
import { resolveOperationRoute } from '../../utils/routing'
import { STATUS_DISPLAY_LABEL, STATUS_STEPS, currentStepIndex, isOffPathStatus } from './plannerStatus'

// /app/routes/operation-status/:habitationId — the operation ID and the
// habitation ID are 1:1 in this data model (operation.id === `op-${habitationId}`,
// same as the existing /app/operations/:habitationId route), so the
// habitationId path param IS the routing/state handle for "which operation".
export default function OperationStatusPage() {
  const { habitationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { habitations, getOperationForHabitation } = useAppState()
  const [toast, setToast] = useState(location.state?.justAssigned ? 'Team assigned successfully. The assigned coordinator and volunteers have been notified.' : '')

  const habitation = habitations.find((h) => h.id === habitationId)

  if (!habitation) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">No habitation found for this operation.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">The link may be out of date or the habitation ID is invalid.</p>
          <Button size="sm" className="mt-4" onClick={() => navigate('/app/routes')}>
            Back to Relocation Planner
          </Button>
        </Card>
      </div>
    )
  }

  const operation = getOperationForHabitation(habitation.id)

  if (!operation) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">No operation exists yet for {habitation.name}.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Choose a safe site and assign a rescue team to create one.</p>
          <Button size="sm" className="mt-4" onClick={() => navigate('/app/routes/choose-site')}>
            Choose Site
          </Button>
        </Card>
      </div>
    )
  }

  const relevantHazardZones = hazardZones.filter((z) => habitation.hazards.includes(z.type))
  const site = operation.safeSiteId ? safeSites.find((s) => s.id === operation.safeSiteId) : null
  const route = resolveOperationRoute(habitation, site, operation.routeId)
  const stepIndex = currentStepIndex(operation.status)
  const offPath = isOffPathStatus(operation.status)

  const markers = [
    { id: habitation.id, type: 'habitation', position: habitation.position, label: habitation.name, priority: habitation.risk.status },
    ...(site ? [{ id: site.id, type: 'site', shape: 'box', color: SAFE_SITE_COLOR, position: site.position, label: site.name }] : []),
  ]

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <button onClick={() => navigate('/app/routes')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> Relocation Planner
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Operation {operation.id}</h1>
            <Badge tone={riskTone(habitation.risk.status)}>{habitation.risk.status}</Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {habitation.name} · {getHazardType(habitation.primaryHazard)?.label} · Assigned {new Date(operation.updatedAt || operation.createdAt).toLocaleString()}
          </p>
        </div>
        <Link to={`/app/operations/${habitation.id}`} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-1.5 transition-all">
          Manage Operation <ExternalLink size={13} />
        </Link>
      </div>

      {/* Status stepper */}
      <Card className="p-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold mb-1 flex-wrap">
          {STATUS_STEPS.map((step, i) => {
            const done = !offPath && stepIndex > i
            const active = !offPath && stepIndex === i
            return (
              <span key={step.id} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300 dark:text-slate-700">→</span>}
                <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg ${active ? 'bg-blue-600 text-white' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {done && <Check size={11} strokeWidth={3} />}
                  {step.label}
                </span>
              </span>
            )
          })}
        </div>
        {offPath && (
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3.5 py-2.5">
            <Info size={15} /> Current status: {STATUS_DISPLAY_LABEL[operation.status]}
          </div>
        )}
        {!offPath && (operation.relocatedCount || 0) > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            <Check size={12} className="text-emerald-500" /> Team has reached the site — {operation.relocatedCount.toLocaleString()} of {operation.populationRequiring.toLocaleString()} relocated so far.
          </p>
        )}
      </Card>

      <OperationSummary habitation={habitation} operation={operation} />

      {/* Map */}
      <Card className="relative h-[380px] p-0 overflow-hidden">
        <GeoMap
          markers={markers}
          routes={route ? [route] : []}
          hazardZones={relevantHazardZones}
          showHazards
          center={[habitation.position.lat, habitation.position.lng]}
          zoom={12}
        />
        <div className="absolute bottom-3 left-3 z-[500] glass rounded-xl px-3 py-2 shadow-lg flex flex-wrap items-center gap-3 text-[11px] max-w-[90%]">
          <LegendDot color="#dc2626" label="Habitation" />
          <LegendBox color={SAFE_SITE_COLOR} label="Safe Site" />
          {route && <LegendDot color={route.color} label="Selected Route" />}
        </div>
        <div className="absolute top-3 right-3 z-[500] glass rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 max-w-[260px]">
          <Info size={12} className="shrink-0" /> Live rescue-team location tracking is not available — this dataset has no coordinator/volunteer position feed.
        </div>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={RouteIcon} label="Route Distance" value={route ? `${route.distanceKm} km` : 'Not generated'} />
        <StatCard icon={Clock} label="Notification Status" value={operation.notificationState || 'Not yet sent'} />
        <StatCard icon={Info} label="Current Status" value={STATUS_DISPLAY_LABEL[operation.status]} />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">
        <Icon size={12} /> {label}
      </div>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </Card>
  )
}
