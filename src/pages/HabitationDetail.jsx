import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Baby,
  Accessibility,
  ArrowRight,
  GitCompareArrows,
  ListChecks,
  Eye,
  RefreshCw,
  History,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge, { riskTone } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import OperationSummary from '../components/ui/OperationSummary'
import AssignmentBreadcrumb from '../components/ui/AssignmentBreadcrumb'
import GeoMap from '../components/map/GeoMap'
import { hazardZones } from '../data/hazards'
import { haversineKm } from '../utils/geo'
import { planningStepIndex } from '../utils/assignmentCalculations'
import { useAppState } from '../state/AppStateContext'
import { getHazardType, OPERATION_STATUS } from '../types/geosentra'

const STATUS_ACTION = {
  [OPERATION_STATUS.YET_TO_PLAN_RESCUE]: { label: 'Assign Emergency Coordinator', icon: ListChecks },
  [OPERATION_STATUS.PLANNING]: { label: 'Assign Emergency Coordinator', icon: ListChecks },
  [OPERATION_STATUS.ASSIGNED]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.DISPATCHED]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.EN_ROUTE]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.ARRIVED]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.IN_PROGRESS]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.COMPLETED]: { label: 'View Completed Operation', icon: CheckCircle2 },
  [OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING]: { label: 'View Assignment', icon: Eye },
  [OPERATION_STATUS.TEAM_ASSIGNED]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.OPERATION_ACTIVE]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.PARTIALLY_RELOCATED]: { label: 'Continue Operation', icon: Eye },
  [OPERATION_STATUS.RELOCATION_COMPLETED]: { label: 'View Completed Operation', icon: CheckCircle2 },
  [OPERATION_STATUS.OPERATION_CLOSED]: { label: 'View History', icon: History },
  [OPERATION_STATUS.ASSIGNMENT_REJECTED]: { label: 'Reassign Coordinator', icon: RefreshCw },
  [OPERATION_STATUS.TEAM_UNAVAILABLE]: { label: 'Reassign Coordinator', icon: RefreshCw },
  [OPERATION_STATUS.OPERATION_CANCELLED]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.OPERATION_FAILED]: { label: 'View Operation', icon: Eye },
  [OPERATION_STATUS.REASSIGNMENT]: { label: 'View Operation', icon: Eye },
}

const RESUME_STEP_PATH = { 0: '/app/assign-coordinator', 1: '/app/assign-coordinator', 2: '/app/relief-sites', 3: '/app/assign-coordinator', 4: '/app/routes', 5: '/app/operations' }

function nearestHazardZone(habitation) {
  const candidates = hazardZones.filter((z) => habitation.hazards.includes(z.type))
  if (candidates.length === 0) return null
  return candidates
    .map((z) => ({ zone: z, distanceKm: haversineKm(habitation.position, { lat: z.polygon[0][0], lng: z.polygon[0][1] }) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0].zone
}

export default function HabitationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { habitations, selectHabitation, computeStatusChangeFor, getOperationForHabitation, ensurePlanning } = useAppState()

  useEffect(() => {
    if (id) selectHabitation(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const habitation = habitations.find((h) => h.id === id) || habitations[0]
  const risk = habitation.risk
  const statusChange = computeStatusChangeFor(habitation)
  const operation = getOperationForHabitation(habitation.id)
  const status = operation?.status || OPERATION_STATUS.YET_TO_PLAN_RESCUE
  const action = STATUS_ACTION[status] || { label: 'Assign Emergency Coordinator', icon: ListChecks }
  const zone = nearestHazardZone(habitation)
  const vulnerablePopulation = habitation.vulnerability.elderly + habitation.vulnerability.children + habitation.vulnerability.disabled

  const handlePrimaryAction = () => {
    if (status === OPERATION_STATUS.YET_TO_PLAN_RESCUE || status === OPERATION_STATUS.PLANNING || !operation) {
      ensurePlanning(habitation.id)
      navigate(`/app/assign-coordinator/${habitation.id}`)
    } else {
      navigate(`/app/operations/${habitation.id}`)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <button onClick={() => navigate('/app/habitations')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> All habitations
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">{habitation.name}</h1>
            <Badge tone={riskTone(risk.status)}>{risk.status}</Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {habitation.district}, {habitation.state} · {habitation.population.toLocaleString()} residents · Dominant hazard: {getHazardType(habitation.primaryHazard)?.label}
          </p>
        </div>
        <Button onClick={handlePrimaryAction}>
          <action.icon size={16} /> {action.label}
        </Button>
      </div>

      {operation && (
        <div className="space-y-4">
          <AssignmentBreadcrumb operation={operation} />
          <OperationSummary habitation={habitation} operation={operation} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[300px] lg:h-[380px] p-0 overflow-hidden relative">
            <GeoMap
              hazardZones={hazardZones}
              markers={[{ id: habitation.id, type: 'habitation', position: habitation.position, label: habitation.name, priority: risk.status }]}
              selectedMarkerId={habitation.id}
              center={[habitation.position.lat, habitation.position.lng]}
              zoom={13}
            />
          </Card>

          {statusChange.changed && (
            <Card className="p-6 border-amber-300 dark:border-amber-500/40">
              <div className="flex items-center gap-2 mb-3">
                <GitCompareArrows size={17} className="text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">What changed?</h3>
              </div>
              <div className="flex items-center gap-3 text-lg font-bold mb-3">
                <Badge tone={riskTone(statusChange.previousStatus)}>{statusChange.previousStatus}</Badge>
                <ArrowRight size={16} className="text-slate-400" />
                <Badge tone={riskTone(statusChange.currentStatus)}>{statusChange.currentStatus}</Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Risk score moved from <b className="text-slate-800 dark:text-slate-200">{statusChange.previousRiskScore}</b> to{' '}
                <b className="text-slate-800 dark:text-slate-200">{statusChange.currentRiskScore}</b> under the current What-If scenario.
              </p>
            </Card>
          )}

          {/* HAZARD INFORMATION */}
          <Card className="p-6">
            <SectionHeader icon={AlertTriangle} title="Hazard Information" />
            <div className="grid grid-cols-2 gap-3 mb-5">
              <DetailStat label="Hazard Type" value={getHazardType(habitation.primaryHazard)?.label} />
              <DetailStat label="Hazard Status" value={risk.status} />
              <DetailStat label="Assessed" value={habitation.lastUpdated} />
              <DetailStat label="Affected Area" value={zone ? `${zone.affectedAreaKm2} km²` : 'Not available for this habitation'} />
            </div>
            <ProgressBar value={risk.riskScore} label="Risk Score" tone="danger" />
          </Card>
        </div>

        <div className="space-y-4">
          {/* LOCATION */}
          <Card className="p-5">
            <SectionHeader icon={MapPin} title="Location" />
            <div className="space-y-3">
              <StatRow label="Name" value={habitation.name} />
              <StatRow label="State" value={habitation.state} />
              <StatRow label="District" value={habitation.district} />
              <StatRow label="Coordinates" value={`${habitation.position.lat.toFixed(4)}, ${habitation.position.lng.toFixed(4)}`} />
              <StatRow label="Administrative Location" value={`${habitation.district}, ${habitation.state}`} />
            </div>
          </Card>

          {/* POPULATION */}
          <Card className="p-5 space-y-3.5">
            <SectionHeader icon={Users} title="Population" />
            <StatRow label="Vulnerable Population" value={vulnerablePopulation.toLocaleString()} />
            <StatRow icon={Baby} label="Children" value={habitation.vulnerability.children.toLocaleString()} />
            <StatRow icon={Users} label="Elderly" value={habitation.vulnerability.elderly.toLocaleString()} />
            <StatRow icon={Accessibility} label="Persons with Disabilities" value={habitation.vulnerability.disabled.toLocaleString()} />
          </Card>

          {/* EMERGENCY RESPONSE */}
          <Card className="p-5 space-y-3">
            <SectionHeader icon={ListChecks} title="Emergency Response" />
            <StatRow label="Emergency Coordinator" value={operation?.coordinatorName || (operation ? 'Assigned' : 'Yet to assign')} />
            <StatRow label="Relief Operation Required" value={risk.status !== 'Normal' ? 'Yes' : 'No'} />
            <StatRow label="Response Priority" value={risk.relocationTimeframe} />
            <StatRow label="People Requiring Relief" value={(operation?.populationRequiring ?? (risk.redZone ? habitation.population : 0)).toLocaleString()} />
            <StatRow label="Current Operation Status" value={status} />
            <StatRow label="Existing Operation ID" value={operation?.id || 'None'} />
          </Card>

          <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300 leading-relaxed flex gap-2.5">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            {habitation.missingData}
          </div>

          <DataStatusPanel />
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-blue-600 dark:text-blue-400" />
      <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-xs">{title}</h3>
    </div>
  )
}

function DetailStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">{label}</div>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  )
}

function StatRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        {Icon && <Icon size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />}
        {label}
      </span>
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 text-right">{value}</span>
    </div>
  )
}
