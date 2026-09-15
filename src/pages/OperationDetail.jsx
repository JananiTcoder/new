import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Flag,
  RefreshCw,
  History,
  Users,
  MapPin,
  Building2,
  UserCog,
  Route as RouteIcon,
  Bell,
  AlertTriangle,
  Ban,
  ArrowRightLeft,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import DemoToast from '../components/ui/DemoToast'
import GeoMap from '../components/map/GeoMap'
import OperationSummary from '../components/ui/OperationSummary'
import { getSafeSite, safeSites } from '../data/safeSites'
import { hazardZones } from '../data/hazards'
import { routeGeometry } from '../data/routes'
import { computeAvailableCapacity } from '../utils/capacityCalculations'
import { useAppState } from '../state/AppStateContext'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'
import { useProviderData } from '../provider/providerStore'
import { isCoordinatorAvailable } from '../utils/assignmentCalculations'
import { OPERATION_STATUS, ROUTE_STATUS } from '../types/geosentra'

export default function OperationDetail() {
  const { habitationId } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const {
    habitations,
    coordinators,
    volunteers,
    operations,
    auditEvents,
    getOperationForHabitation,
    acceptAssignment,
    startOperation,
    rejectAssignment,
    reassignOperation,
    markTeamUnavailable,
    updateRelocatedCount,
    verifyCompletion,
    closeOperation,
    setRouteStatus,
    cancelOperation,
    failOperation,
    changeOperationDestination,
  } = useAppState()
  const { getProvider } = useProviderData()
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showReassign, setShowReassign] = useState(false)
  const [relocatedInput, setRelocatedInput] = useState('')
  const [showChangeDestination, setShowChangeDestination] = useState(false)
  const [pendingSiteId, setPendingSiteId] = useState(null)
  const [toast, setToast] = useState('')

  const habitation = habitations.find((h) => h.id === habitationId)
  const operation = habitation ? getOperationForHabitation(habitation.id) : null

  if (!habitation || !operation) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">No operation exists for this habitation.</p>
          <Button size="sm" className="mt-4" onClick={() => navigate('/app/habitations')}>
            Return to Risk Habitations
          </Button>
        </Card>
      </div>
    )
  }

  const site = operation.safeSiteId ? getSafeSite(operation.safeSiteId) : null
  const infrastructure = operation.infrastructureId ? getProvider(operation.infrastructureId) : null
  const coordinator = coordinators.find((c) => c.id === operation.coordinatorId)
  const remaining = Math.max(0, operation.populationRequiring - operation.relocatedCount)
  const relatedAudit = auditEvents.filter((a) => a.relatedId === habitation.id)
  const availableForReassign = coordinators.filter((c) => isCoordinatorAvailable(c, operations))
  const canAcceptReject = role === ROLES.EMERGENCY_COORDINATOR

  const canChangeDestination = (role === ROLES.EMERGENCY_COORDINATOR || role === ROLES.DISASTER_AUTHORITY) && [OPERATION_STATUS.TEAM_ASSIGNED, OPERATION_STATUS.OPERATION_ACTIVE, OPERATION_STATUS.PARTIALLY_RELOCATED].includes(operation.status)
  const candidateSites = safeSites.filter((s) => s.id !== operation.safeSiteId).map((s) => ({ site: s, available: computeAvailableCapacity(s) }))
  const pendingSite = pendingSiteId ? safeSites.find((s) => s.id === pendingSiteId) : null
  const pendingAvailable = pendingSite ? computeAvailableCapacity(pendingSite) : 0
  const pendingInsufficient = !!pendingSite && pendingAvailable < remaining

  const openChangeDestination = () => {
    setPendingSiteId(null)
    setShowChangeDestination(true)
  }
  const confirmChangeDestination = () => {
    if (!pendingSite || pendingAvailable <= 0) return
    changeOperationDestination(habitation.id, pendingSite.id, pendingSite.name, site?.name)
    setShowChangeDestination(false)
    setPendingSiteId(null)
    setToast('Destination changed in demo mode.')
  }

  const routeGeom = operation.routeId && routeGeometry[operation.routeId] ? routeGeometry[operation.routeId] : null
  const markers = [
    { id: 'habitation', type: 'habitation', position: habitation.position, label: habitation.name, priority: habitation.risk.status },
    ...(site ? [{ id: 'site', type: 'site', shape: 'box', position: site.position, label: site.name }] : []),
    ...(infrastructure ? [{ id: 'infra', type: 'destination', position: { lat: infrastructure.latitude, lng: infrastructure.longitude }, label: infrastructure.providerName }] : []),
  ]
  const relevantHazardZones = hazardZones.filter((z) => habitation.hazards.includes(z.type))

  const submitReject = () => {
    rejectAssignment(habitation.id, rejectReason || 'No reason provided.')
    setShowReject(false)
    setRejectReason('')
  }

  const submitReassign = (coordinatorId) => {
    reassignOperation(habitation.id, coordinatorId)
    setShowReassign(false)
  }

  const submitRelocatedCount = () => {
    const n = Number(relocatedInput)
    if (!Number.isNaN(n)) updateRelocatedCount(habitation.id, n)
    setRelocatedInput('')
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <button onClick={() => navigate('/app/operations')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> Operation Management
      </button>

      <OperationSummary habitation={habitation} operation={operation} />

      {/* Status-driven action area */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Actions</h3>

        {operation.status === OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Bell size={14} /> Notification {operation.notificationState} to {coordinator?.name || 'the assigned coordinator'} — prototype notification state only, no real SMS/email/push.
            </p>
            {canAcceptReject ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => acceptAssignment(habitation.id)}>
                  <CheckCircle2 size={14} /> Accept Assignment
                </Button>
                <Button size="sm" variant="danger" onClick={() => setShowReject(true)}>
                  <XCircle size={14} /> Reject Assignment
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">Waiting for the Emergency Coordinator to accept or reject this assignment.</p>
            )}
          </div>
        )}

        {operation.status === OPERATION_STATUS.TEAM_ASSIGNED && (
          <div className="flex flex-wrap gap-2 items-center">
            <Button size="sm" onClick={() => startOperation(habitation.id)}>
              <PlayCircle size={14} /> Start Operation
            </Button>
            {canChangeDestination && (
              <Button size="sm" variant="secondary" onClick={openChangeDestination}>
                <ArrowRightLeft size={14} /> Change Destination
              </Button>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">Team assigned and accepted — mark the operation active once relocation begins.</span>
          </div>
        )}

        {(operation.status === OPERATION_STATUS.OPERATION_ACTIVE || operation.status === OPERATION_STATUS.PARTIALLY_RELOCATED) && (
          <div className="space-y-5">
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Update People Relocated</div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={operation.populationRequiring}
                  value={relocatedInput}
                  onChange={(e) => setRelocatedInput(e.target.value)}
                  placeholder={`${operation.relocatedCount}`}
                  className="w-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
                />
                <Button size="sm" variant="secondary" onClick={submitRelocatedCount}>
                  Update Count
                </Button>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Required {operation.populationRequiring.toLocaleString()} · Remaining {remaining.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={operation.relocatedCount < operation.populationRequiring} onClick={() => verifyCompletion(habitation.id)}>
                <CheckCircle2 size={14} /> Verify Completion
              </Button>
              <Button size="sm" variant="secondary" onClick={() => markTeamUnavailable(habitation.id)}>
                <Ban size={14} /> Mark Team Unavailable
              </Button>
              {canChangeDestination && (
                <Button size="sm" variant="secondary" onClick={openChangeDestination}>
                  <ArrowRightLeft size={14} /> Change Destination
                </Button>
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Route Status — simulated, no live routing engine</div>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge tone={operation.routeStatus === ROUTE_STATUS.BLOCKED ? 'danger' : operation.routeStatus === ROUTE_STATUS.WARNING ? 'warning' : 'good'}>{operation.routeStatus || ROUTE_STATUS.ACTIVE}</Badge>
                <Button size="sm" variant="ghost" onClick={() => setRouteStatus(habitation.id, ROUTE_STATUS.BLOCKED, 'Route reported blocked (simulated).')}>
                  <AlertTriangle size={13} /> Report Blocked
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRouteStatus(habitation.id, ROUTE_STATUS.ACTIVE, 'Route recalculated (simulated).')}>
                  <RefreshCw size={13} /> Recalculate Route
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRouteStatus(habitation.id, ROUTE_STATUS.ALTERNATIVE_AVAILABLE, 'Alternative route selected (simulated).')}>
                  <RouteIcon size={13} /> View Alternative Route
                </Button>
              </div>
            </div>
          </div>
        )}

        {operation.status === OPERATION_STATUS.RELOCATION_COMPLETED && (
          <Button size="sm" onClick={() => closeOperation(habitation.id)}>
            <Flag size={14} /> Close Operation
          </Button>
        )}

        {operation.status === OPERATION_STATUS.OPERATION_CLOSED && <p className="text-sm text-slate-500 dark:text-slate-400">This operation is closed. History is preserved below.</p>}

        {(operation.status === OPERATION_STATUS.ASSIGNMENT_REJECTED || operation.status === OPERATION_STATUS.TEAM_UNAVAILABLE) && (
          <div className="space-y-2">
            {operation.rejectionReason && <p className="text-sm text-red-600 dark:text-red-400">Reason: {operation.rejectionReason}</p>}
            <Button size="sm" onClick={() => setShowReassign(true)}>
              <RefreshCw size={14} /> Reassign Team
            </Button>
          </div>
        )}

        {(operation.status === OPERATION_STATUS.PLANNING || operation.status === OPERATION_STATUS.YET_TO_PLAN_RESCUE) && (
          <Button size="sm" onClick={() => navigate('/app/relocation')}>
            Continue Planning
          </Button>
        )}

        {(operation.status === OPERATION_STATUS.OPERATION_CANCELLED || operation.status === OPERATION_STATUS.OPERATION_FAILED) && (
          <p className="text-sm text-slate-500 dark:text-slate-400">This operation did not complete. See Audit History below for details.</p>
        )}

        {[OPERATION_STATUS.TEAM_ASSIGNED, OPERATION_STATUS.OPERATION_ACTIVE, OPERATION_STATUS.PARTIALLY_RELOCATED].includes(operation.status) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" variant="ghost" onClick={() => cancelOperation(habitation.id, 'Cancelled by Disaster Authority.')}>
              Cancel Operation
            </Button>
            <Button size="sm" variant="ghost" onClick={() => failOperation(habitation.id, 'Marked failed by Disaster Authority.')}>
              Mark Failed
            </Button>
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card className="relative h-[420px] p-0 overflow-hidden">
          <GeoMap markers={markers} routes={routeGeom ? [routeGeom] : []} hazardZones={relevantHazardZones} />
          <div className="absolute top-4 left-4 z-[500] glass rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Live location unavailable — prototype data
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Route</h3>
          {operation.routeId ? (
            <>
              <div className="text-sm text-slate-600 dark:text-slate-300">Selected route: <b>{routeGeom?.name || operation.routeId}</b></div>
              <Badge tone={operation.routeStatus === ROUTE_STATUS.BLOCKED ? 'danger' : 'good'}>{operation.routeStatus || ROUTE_STATUS.ACTIVE}</Badge>
              {routeGeom && <div className="text-xs text-slate-400 dark:text-slate-500">{routeGeom.distanceKm} km · illustrative route, not a live routing engine</div>}
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">No route generated yet.</p>
          )}
          <div className="h-px bg-slate-100 dark:bg-slate-800" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Safe-Site Available Capacity</h3>
          {site ? <div className="text-sm text-slate-600 dark:text-slate-300">{site.name} — see Relocation for full capacity breakdown.</div> : <p className="text-sm text-slate-400 dark:text-slate-500">Not selected.</p>}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-1.5">
          <History size={16} className="text-blue-600 dark:text-blue-400" /> Audit History
        </h3>
        {relatedAudit.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">No audit events for this operation yet.</p>
        ) : (
          <div className="space-y-3">
            {relatedAudit.map((a) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${a.severity === 'critical' ? 'bg-red-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div>
                  <div className="text-slate-700 dark:text-slate-300">{a.type}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{a.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showReject} onClose={() => setShowReject(false)} title="Reject Assignment">
        <div className="space-y-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejecting this assignment..."
            className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-800 dark:text-slate-100"
          />
          <Button className="w-full" variant="danger" onClick={submitReject}>
            Confirm Rejection
          </Button>
        </div>
      </Modal>

      <Modal open={showChangeDestination} onClose={() => setShowChangeDestination(false)} title="Change Evacuation Destination">
        <div className="space-y-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">Simulated permission-controlled change — this frontend action does not update a real transport or shelter-management system.</p>
          {candidateSites.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No other safe sites are available to switch to.</p>}
          {candidateSites.map(({ site: s, available }) => {
            const full = available <= 0
            return (
              <button
                key={s.id}
                disabled={full}
                onClick={() => setPendingSiteId(s.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                  pendingSiteId === s.id ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'
                } ${full ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300 dark:hover:border-blue-500'}`}
              >
                <div>
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{s.name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{s.district}</div>
                </div>
                <Badge tone={full ? 'danger' : 'good'}>{full ? 'Full / Unavailable' : `${available.toLocaleString()} available`}</Badge>
              </button>
            )
          })}
          {pendingSite && pendingInsufficient && (
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2.5">
              <AlertTriangle size={15} /> {pendingSite.name} has only {pendingAvailable.toLocaleString()} available — fewer than the {remaining.toLocaleString()} people still remaining. You can still proceed, but consider splitting the operation.
            </div>
          )}
          <Button className="w-full" disabled={!pendingSite || pendingAvailable <= 0} onClick={confirmChangeDestination}>
            Confirm Destination Change
          </Button>
        </div>
      </Modal>

      <Modal open={showReassign} onClose={() => setShowReassign(false)} title="Reassign Rescue Team">
        <div className="space-y-3">
          {availableForReassign.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No Emergency Coordinator is currently available.</p>
          ) : (
            availableForReassign.map((c) => (
              <button
                key={c.id}
                onClick={() => submitReassign(c.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-left"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{c.name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{c.region}</div>
                </div>
                <Badge tone="good">Available</Badge>
              </button>
            ))
          )}
        </div>
      </Modal>

      <DemoToast message={toast} onDismiss={() => setToast('')} />
    </div>
  )
}
