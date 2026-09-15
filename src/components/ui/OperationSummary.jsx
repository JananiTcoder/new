import { useState } from 'react'
import { ShieldCheck, MapPin, Building2, UserCog, Users } from 'lucide-react'
import Card from './Card'
import Badge from './Badge'
import Button from './Button'
import Modal from './Modal'
import { OPERATION_STATUS } from '../../types/geosentra'
import { getSafeSite } from '../../data/safeSites'
import { getCoordinator } from '../../data/coordinators'
import { getVolunteer } from '../../data/volunteers'
import { useProviderData } from '../../provider/providerStore'

export const STATUS_TONE = {
  [OPERATION_STATUS.YET_TO_PLAN_RESCUE]: 'default',
  [OPERATION_STATUS.PLANNING]: 'blue',
  [OPERATION_STATUS.ASSIGNED]: 'blue',
  [OPERATION_STATUS.DISPATCHED]: 'blue',
  [OPERATION_STATUS.EN_ROUTE]: 'warning',
  [OPERATION_STATUS.ARRIVED]: 'blue',
  [OPERATION_STATUS.IN_PROGRESS]: 'blue',
  [OPERATION_STATUS.COMPLETED]: 'good',
  [OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING]: 'warning',
  [OPERATION_STATUS.TEAM_ASSIGNED]: 'warning',
  [OPERATION_STATUS.OPERATION_ACTIVE]: 'blue',
  [OPERATION_STATUS.PARTIALLY_RELOCATED]: 'warning',
  [OPERATION_STATUS.RELOCATION_COMPLETED]: 'good',
  [OPERATION_STATUS.OPERATION_CLOSED]: 'good',
  [OPERATION_STATUS.ASSIGNMENT_REJECTED]: 'danger',
  [OPERATION_STATUS.OPERATION_CANCELLED]: 'default',
  [OPERATION_STATUS.OPERATION_FAILED]: 'danger',
  [OPERATION_STATUS.TEAM_UNAVAILABLE]: 'danger',
  [OPERATION_STATUS.REASSIGNMENT]: 'warning',
}

/**
 * Read-only operation summary — used wherever the assigned coordinator /
 * volunteers / status need to show up: habitation details, the route page,
 * and as the top block of OperationDetail.jsx. No assignment actions live
 * here, only View — status-specific actions belong to the caller.
 */
export default function OperationSummary({ habitation, operation, className = '' }) {
  const [showCoordinator, setShowCoordinator] = useState(false)
  const [showVolunteers, setShowVolunteers] = useState(false)
  const { getProvider } = useProviderData()
  if (!operation) return null

  const site = operation.safeSiteId ? getSafeSite(operation.safeSiteId) : null
  const infrastructure = operation.infrastructureId ? getProvider(operation.infrastructureId) : null
  const coordinator = operation.coordinatorId ? getCoordinator(operation.coordinatorId) : null
  const assignedVolunteers = (operation.volunteerIds || []).map(getVolunteer).filter(Boolean)
  const remaining = Math.max(0, (operation.populationRequiring || 0) - (operation.relocatedCount || 0))

  return (
    <Card className={`p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck size={17} className="text-blue-600 dark:text-blue-400" /> Operation {operation.id} — {habitation.name}
        </h3>
        <Badge tone={STATUS_TONE[operation.status] || 'default'}>{operation.status}</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5 text-sm">
        <InfoRow icon={MapPin} label="Assigned safe site" value={site?.name || 'Not yet selected'} />
        <InfoRow icon={Building2} label="Selected infrastructure" value={infrastructure?.providerName || 'Not yet selected'} />
        <InfoRow icon={UserCog} label="Emergency Coordinator / rescue team" value={coordinator?.name || 'Not yet assigned'} />
        <InfoRow icon={Users} label="Required / relocated / remaining" value={`${(operation.populationRequiring || 0).toLocaleString()} / ${(operation.relocatedCount || 0).toLocaleString()} / ${remaining.toLocaleString()}`} />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant="secondary" size="sm" disabled={!coordinator} onClick={() => setShowCoordinator(true)}>
          <UserCog size={14} /> View coordinator
        </Button>
        <Button variant="secondary" size="sm" disabled={assignedVolunteers.length === 0} onClick={() => setShowVolunteers(true)}>
          <Users size={14} /> View volunteers ({assignedVolunteers.length})
        </Button>
      </div>

      <Modal open={showCoordinator} onClose={() => setShowCoordinator(false)} title="Emergency Coordinator">
        {coordinator && (
          <div className="space-y-2 text-sm">
            <div className="font-bold text-slate-900 dark:text-slate-100">{coordinator.name}</div>
            <div className="text-slate-500 dark:text-slate-400">Region: {coordinator.region}</div>
            <div className="text-slate-500 dark:text-slate-400">Roster status: {coordinator.status}</div>
          </div>
        )}
      </Modal>

      <Modal open={showVolunteers} onClose={() => setShowVolunteers(false)} title="Assigned Volunteers">
        <div className="space-y-3 text-sm">
          {assignedVolunteers.length === 0 && <p className="text-slate-400 dark:text-slate-500">No volunteers assigned yet.</p>}
          {assignedVolunteers.map((v) => (
            <div key={v.id} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/60 pb-2 last:border-0 last:pb-0">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{v.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {v.skill} · {v.region}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </Card>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{label}</div>
        <div className="text-slate-800 dark:text-slate-200 font-semibold">{value}</div>
      </div>
    </div>
  )
}
