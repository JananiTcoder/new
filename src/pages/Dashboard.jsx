import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, ShieldCheck, Navigation, Radio, Info, ClipboardList, ArrowRight, AlertTriangle } from 'lucide-react'
import MetricCard from '../components/ui/MetricCard'
import Card from '../components/ui/Card'
import Badge, { riskTone } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import GeoMap from '../components/map/GeoMap'
import { LegendDot, LegendBox } from '../components/map/MapLegend'
import { LAYER_DEFS, SAFE_SITE_COLOR } from '../components/map/mapLayerDefs'
import { computeCoordinatorKPIs, computeHazardOverview, currentEvent, shelters, hospitals, schools } from '../data/dashboard'
import { safeSites } from '../data/safeSites'
import { hazardZones, severityLevels } from '../data/hazards'
import { useAppState } from '../state/AppStateContext'
import { REDZONE_STATUS, getHazardType } from '../types/geosentra'
import { STATUS_TONE } from '../components/ui/OperationSummary'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'
import { useProviderData } from '../provider/providerStore'
import { aggregateCapacity } from '../provider/capacityService'
import { deriveAlerts, filterAlertsForRole } from '../utils/alerts'
import { operationsList } from '../utils/assignmentCalculations'
import { Warehouse } from 'lucide-react'
import AuthorityOverview from './AuthorityOverview'

const ACTION_RECOMMENDATION = {
  'Route blocked': 'Find an alternate route or reassign the operation.',
  'Safe-site capacity shortage': 'Reassign incoming evacuees to a site with available capacity.',
  'Institution evacuation required': 'Assign transport and confirm evacuation readiness.',
  'Coordinator unavailable': 'Reassign the operation to another available coordinator.',
  'Volunteer unavailable': 'Reassign support tasks once a volunteer becomes available.',
  'Assignment rejected': 'Reassign a rescue team to this operation.',
  'Operation delayed': "Confirm the assigned team has begun relocation and update the operation's progress.",
  'Red Zone status increased': 'Review the updated risk assessment and start relocation planning if not already underway.',
}

// The Disaster Authority gets a dedicated full-page map overview (see
// AuthorityOverview.jsx); every other role keeps the existing card-based
// dashboard below unchanged.
export default function Dashboard() {
  const { role } = useAuth()
  if (role === ROLES.DISASTER_AUTHORITY) return <AuthorityOverview />
  return <StandardDashboard />
}

function StandardDashboard() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { habitations, institutions, selectedHabitationId, selectedInstitutionId, scenario, selectHabitation, operations, coordinators, volunteers } = useAppState()
  const [layers, setLayers] = useState({ hazards: true, population: true, infrastructure: true, safeSites: true })

  const isCoordinator = role === ROLES.EMERGENCY_COORDINATOR
  const isVolunteer = role === ROLES.VOLUNTEERS
  const isCitizen = role === ROLES.CITIZEN

  const toggleLayer = (id) => setLayers((prev) => ({ ...prev, [id]: !prev[id] }))

  const myHabitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const myInstitution = institutions.find((i) => i.id === selectedInstitutionId) || institutions[0]
  const nearestSite = [...safeSites].sort((a, b) => a.safetyScoreBase - b.safetyScoreBase).slice(-1)[0]

  const { providers, capacitiesById } = useProviderData()
  const providerTotals = aggregateCapacity(providers, capacitiesById)
  const coordinatorAlerts = filterAlertsForRole(deriveAlerts({ habitations, safeSites, institutions, scenario, operations, coordinators, volunteers }), ROLES.EMERGENCY_COORDINATOR)
  const coordinatorKPIs = computeCoordinatorKPIs({ scenario, operations, alerts: coordinatorAlerts })
  const hazardOverview = computeHazardOverview(scenario)
  const activeHazardTypeCount = hazardOverview.filter((h) => h.affectedCount > 0).length
  const myAssignedOperations = Object.values(operations)
    .filter((o) => (o.volunteerIds || []).length > 0)
    .map((o) => ({ operation: o, habitation: habitations.find((h) => h.id === o.habitationId) }))
    .filter((row) => row.habitation)

  // Relief sites render as green box markers everywhere on the Overview map so
  // they read as clearly distinct from habitation/hazard/infrastructure pins.
  const reliefSiteMarkers = safeSites.map((s) => ({ id: s.id, type: 'site', shape: 'box', color: SAFE_SITE_COLOR, position: s.position, label: `${s.name} (Relief Site)` }))

  const markers = isCoordinator
    ? [
        ...(layers.population ? habitations.map((h) => ({ id: h.id, type: 'habitation', position: h.position, label: h.name, priority: h.risk.status })) : []),
        ...(layers.safeSites ? reliefSiteMarkers : []),
        ...(layers.infrastructure ? [...shelters, ...hospitals, ...schools].map((m) => ({ id: m.id, type: m.type, position: m.position, label: m.name })) : []),
      ]
    : isVolunteer
    ? [{ id: myInstitution.id, type: 'institution', position: myInstitution.position, label: myInstitution.name }, ...reliefSiteMarkers]
    : [{ id: myHabitation.id, type: 'habitation', position: myHabitation.position, label: 'Your area', priority: myHabitation.risk.status }, ...reliefSiteMarkers]

  const priorityHabitations = [...habitations]
    .filter((h) => h.risk.status === REDZONE_STATUS.CRITICAL || h.risk.status === REDZONE_STATUS.HIGH_RISK)
    .sort((a, b) => b.risk.riskScore - a.risk.riskScore)

  // "Active Operations" for the Coordinator Overview — every started operation
  // plus every still-unassigned High Risk/Critical habitation shown as "Not
  // Started", so this table always reflects everything that needs a decision,
  // not just operations that already exist.
  const startedOperationRows = operationsList(operations)
    .map((o) => ({ operation: o, habitation: habitations.find((h) => h.id === o.habitationId) }))
    .filter((row) => row.habitation)
    .map(({ operation, habitation }) => {
      const site = safeSites.find((s) => s.id === operation.safeSiteId)
      const progressPct = operation.populationRequiring > 0 ? Math.round((operation.relocatedCount / operation.populationRequiring) * 100) : 0
      return {
        id: habitation.id,
        name: habitation.name,
        population: operation.populationRequiring,
        progressPct,
        remaining: Math.max(0, operation.populationRequiring - operation.relocatedCount),
        destination: site?.name || 'Not yet selected',
        status: operation.status,
        priority: habitation.risk.status,
      }
    })
  const notStartedRows = priorityHabitations
    .filter((h) => !operations[h.id])
    .map((h) => ({ id: h.id, name: h.name, population: h.population, progressPct: 0, remaining: h.population, destination: 'Not yet selected', status: 'Not Started', priority: h.risk.status }))
  const coordinatorOperationRows = [...startedOperationRows, ...notStartedRows].sort((a, b) => b.population - a.population)

  const coordinateRow = (row) => {
    selectHabitation(row.id)
    navigate(operations[row.id] ? `/app/operations/${row.id}` : `/app/habitations/${row.id}`)
  }

  // "Actions Required" reuses the same derived-alerts engine the Alerts page
  // uses (filtered to warning/critical) so this list and the Alerts page never
  // disagree about what still needs attention.
  const actionsRequired = coordinatorAlerts.filter((a) => a.severity !== 'info')

  const openHabitation = (id) => {
    selectHabitation(id)
    navigate(`/app/habitations/${id}`)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isCoordinator && 'Emergency Coordination Overview'}
            {isVolunteer && 'Volunteer Coordination Overview'}
            {isCitizen && 'Your Safety Overview'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {currentEvent.name} — {currentEvent.region} · Updated {currentEvent.updated}
          </p>
        </div>
        <Badge tone="danger" icon={AlertTriangle}>
          {currentEvent.severity} SEVERITY
        </Badge>
      </div>

      {isCoordinator && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coordinatorKPIs.map((m) => (
            <MetricCard
              key={m.id}
              {...m}
              onClick={() => navigate(m.id === 'evacuate' ? '/app/habitations' : m.id === 'progress' ? '/app/operations' : m.id === 'safecapacity' ? '/app/safe-sites' : '/app/alerts')}
            />
          ))}
        </div>
      )}

      {isVolunteer && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Evacuation Readiness" value={myInstitution.evacuationReadiness} icon="ShieldCheck" tone="good" trend={`Supporting ${myInstitution.name}`} onClick={() => navigate('/app/institution')} />
          <MetricCard label="Current Hazard Exposure" value={0} icon="AlertTriangle" tone="warning" trend={getHazardType(myInstitution.currentHazard)?.label || myInstitution.currentHazard} onClick={() => navigate('/app/hazard-intelligence')} />
          <MetricCard label="People You're Supporting" value={myInstitution.groupSize + myInstitution.staff} icon="Users" trend={`${myInstitution.groupSize.toLocaleString()} + ${myInstitution.staff} staff`} onClick={() => navigate('/app/institution')} />
          <MetricCard label="Evacuation Priority" value={0} icon="Radio" tone="danger" trend={myInstitution.evacuationPriority} onClick={() => navigate('/app/institution')} />
        </div>
      )}

      {isCitizen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Your Area Status" value={0} icon="ShieldCheck" tone={myHabitation.risk.redZone ? 'danger' : 'good'} trend={myHabitation.risk.status} onClick={() => navigate('/app/safe-sites')} />
          <MetricCard label="Nearest Hazard" value={0} icon="AlertTriangle" tone="warning" trend={getHazardType(myHabitation.primaryHazard)?.label} onClick={() => navigate('/app/routes')} />
          <MetricCard label="Nearest Safe Site" value={0} icon="Layers" trend={nearestSite?.name} onClick={() => navigate('/app/safe-sites')} />
          <MetricCard label="Safest Route" value={0} icon="Route" trend="View route to safety" onClick={() => navigate('/app/routes')} />
        </div>
      )}

      {isCoordinator && (
        <Card hover className="p-4 flex items-center justify-between cursor-pointer" onClick={() => navigate('/app/hazard-intelligence')}>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            <b className="text-slate-900 dark:text-slate-100">{activeHazardTypeCount}</b> of {hazardOverview.length} hazard types currently affecting tracked habitations
          </span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 shrink-0">
            Open Hazard Intelligence <ChevronRight size={14} />
          </span>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <Card className="relative h-[460px] lg:h-[600px] p-0 overflow-hidden">
          <GeoMap
            markers={markers}
            hazardZones={hazardZones}
            showHazards={isCoordinator ? layers.hazards : true}
            onMarkerClick={(m) => {
              if (m.type === 'habitation') openHabitation(m.id)
              if (m.type === 'site') navigate('/app/safe-sites')
              if (m.type === 'institution') navigate('/app/institution')
            }}
          />

          {isCoordinator && (
            <div className="absolute top-4 right-4 z-[500] glass rounded-2xl p-3 shadow-lg w-52">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">Map Layers</div>
              <div className="space-y-1">
                {LAYER_DEFS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => toggleLayer(l.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      layers[l.id] ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <l.icon size={15} />
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 z-[500] glass rounded-2xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-4 text-xs max-w-[90%]">
            {severityLevels.map((s) => (
              <LegendDot key={s.id} color={s.color} label={s.label} />
            ))}
            <span className="h-3.5 w-px bg-slate-300 dark:bg-slate-600" />
            <LegendBox color={SAFE_SITE_COLOR} label="Relief Sites" />
          </div>
        </Card>

        <div className="space-y-4">
          {isCoordinator && (
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-4">
                <Radio size={15} /> Coordinate
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Full Active Operations and Actions Required lists are below the map.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate('/app/routes')}>
                  <Navigation size={14} /> Routes
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/app/institution')}>
                  <Building2 size={14} /> Evacuation
                </Button>
              </div>
            </Card>
          )}

          {isVolunteer && (
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Supporting {myInstitution.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Help with logistics, supplies and shelter support for this evacuation.</p>
              <ProgressBar value={myInstitution.evacuationReadiness} label="Evacuation Readiness" tone="good" className="mb-4" />
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Current hazard: <b className="text-slate-700 dark:text-slate-300">{getHazardType(myInstitution.currentHazard)?.label}</b>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={() => navigate('/app/institution')}>
                  Evacuation Plan
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/app/routes')}>
                  <Navigation size={14} /> Safe Route
                </Button>
              </div>
            </Card>
          )}

          {isVolunteer && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ClipboardList size={15} /> My Assigned Operations
                </h3>
                <button onClick={() => navigate('/app/operations')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:gap-1.5 transition-all">
                  All operations <ChevronRight size={14} />
                </button>
              </div>
              {myAssignedOperations.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No operation has volunteers assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {myAssignedOperations.map(({ operation, habitation }) => (
                    <button
                      key={operation.id}
                      onClick={() => {
                        selectHabitation(habitation.id)
                        navigate(`/app/operations/${habitation.id}`)
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{habitation.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{(operation.volunteerIds || []).length} volunteer(s) assigned</div>
                      </div>
                      <Badge tone={STATUS_TONE[operation.status] || 'default'}>{operation.status}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {isCitizen && (
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600 dark:text-blue-400" /> Need Help Moving?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Find the safest verified path to a relief shelter or safe destination.</p>
              <div className="grid grid-cols-1 gap-2">
                <Button size="sm" onClick={() => navigate('/app/routes')}>
                  <Navigation size={14} /> Find Safest Route
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/app/relief-sites')}>
                  Nearby Relief Sites
                </Button>
              </div>
            </Card>
          )}

          {(isVolunteer || isCitizen) && (
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Alerts</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{isVolunteer ? 'Relocation and evacuation alerts relevant to the people you are supporting.' : 'Public safety alerts for your area.'}</p>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/app/alerts')}>
                View Alerts
              </Button>
            </Card>
          )}

          {isCitizen && (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4 flex gap-3">
              <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">This is a demonstration prototype. In a real emergency, always follow official local authority instructions.</p>
            </div>
          )}

          <Card hover className="p-5 cursor-pointer" onClick={() => navigate('/app/resource-network')}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Warehouse size={15} className="text-emerald-600 dark:text-emerald-400" /> Resource Network
              </h3>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{providerTotals.availableCapacity.toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Available Capacity</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{providers.length}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Registered Providers</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">From provider-submitted capacity — self-reported/demo until verified.</p>
          </Card>

          <DataStatusPanel />
        </div>
      </div>

      {isCoordinator && <ActiveOperationsSection rows={coordinatorOperationRows} onCoordinate={coordinateRow} />}
      {isCoordinator && <ActionsRequiredSection actions={actionsRequired} onOpen={(a) => navigate('/app/alerts')} />}
    </div>
  )
}

function ActiveOperationsSection({ rows, onCoordinate }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <ClipboardList size={16} className="text-blue-600 dark:text-blue-400" /> Active Operations
        </h3>
      </div>

      {rows.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">No active relocation operations right now.</p>}

      {rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">Habitation</th>
                  <th className="py-2.5 pr-3 font-semibold">Population</th>
                  <th className="py-2.5 pr-3 font-semibold">Progress</th>
                  <th className="py-2.5 pr-3 font-semibold">Remaining</th>
                  <th className="py-2.5 pr-3 font-semibold">Destination</th>
                  <th className="py-2.5 pr-3 font-semibold">Status</th>
                  <th className="py-2.5 pr-3 font-semibold">Priority</th>
                  <th className="py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                    <td className="py-3 pr-3 font-semibold text-slate-800 dark:text-slate-200">{r.name}</td>
                    <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{r.population.toLocaleString()}</td>
                    <td className="py-3 pr-3 w-40">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.progressPct} tone={r.progressPct >= 100 ? 'good' : 'blue'} className="flex-1" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-9 text-right shrink-0">{r.progressPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{r.remaining.toLocaleString()}</td>
                    <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{r.destination}</td>
                    <td className="py-3 pr-3">
                      <Badge tone={STATUS_TONE[r.status] || 'default'}>{r.status}</Badge>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={riskTone(r.priority)}>{r.priority}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => onCoordinate(r)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 ml-auto hover:gap-1.5 transition-all">
                        Coordinate <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3.5">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{r.name}</span>
                  <Badge tone={STATUS_TONE[r.status] || 'default'}>{r.status}</Badge>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                  {r.population.toLocaleString()} people · {r.remaining.toLocaleString()} remaining · Destination: {r.destination}
                </div>
                <div className="flex items-center gap-2 mb-2.5">
                  <ProgressBar value={r.progressPct} tone={r.progressPct >= 100 ? 'good' : 'blue'} className="flex-1" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-9 text-right shrink-0">{r.progressPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge tone={riskTone(r.priority)}>{r.priority}</Badge>
                  <button onClick={() => onCoordinate(r)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                    Coordinate <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

const ACTIONS_SEVERITY_BADGE = { critical: 'danger', warning: 'warning', info: 'blue' }

function ActionsRequiredSection({ actions, onOpen }) {
  return (
    <Card className="p-5">
      <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-4">
        <AlertTriangle size={16} className="text-amber-500" /> Actions Required
      </h3>

      {actions.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">No active alerts — nothing needs action right now.</p>}

      <div className="space-y-2.5">
        {actions.map((a) => (
          <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{a.type}</span>
                <Badge tone={ACTIONS_SEVERITY_BADGE[a.severity]}>{a.severity}</Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{a.message}</p>
              {ACTION_RECOMMENDATION[a.type] && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1.5">Recommended: {ACTION_RECOMMENDATION[a.type]}</p>}
            </div>
            <button onClick={() => onOpen(a)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
              View / Resolve
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
