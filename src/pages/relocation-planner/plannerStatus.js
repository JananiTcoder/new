import { OPERATION_STATUS } from '../../types/geosentra'

// User-friendly display labels for the real OPERATION_STATUS values (see
// src/types/geosentra.js) — never a separate/invented status, just a label
// mapped onto the existing backend status the rest of the app already reads
// and writes (createAssignment/assignTeamToOperation, startOperation,
// verifyCompletion, closeOperation, etc.).
export const STATUS_DISPLAY_LABEL = {
  [OPERATION_STATUS.YET_TO_PLAN_RESCUE]: 'Not Yet Planned',
  [OPERATION_STATUS.PLANNING]: 'Assignment Created',
  [OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING]: 'Team Notified',
  [OPERATION_STATUS.TEAM_ASSIGNED]: 'Team En Route',
  [OPERATION_STATUS.OPERATION_ACTIVE]: 'Rescue/Relocation In Progress',
  [OPERATION_STATUS.PARTIALLY_RELOCATED]: 'Rescue/Relocation In Progress',
  [OPERATION_STATUS.RELOCATION_COMPLETED]: 'Relocation Completed',
  [OPERATION_STATUS.OPERATION_CLOSED]: 'Operation Closed',
  [OPERATION_STATUS.ASSIGNMENT_REJECTED]: 'Assignment Rejected',
  [OPERATION_STATUS.TEAM_UNAVAILABLE]: 'Team Unavailable',
  [OPERATION_STATUS.OPERATION_CANCELLED]: 'Operation Cancelled',
  [OPERATION_STATUS.OPERATION_FAILED]: 'Operation Failed',
  [OPERATION_STATUS.REASSIGNMENT]: 'Reassignment In Progress',
}

// The "happy path" stepper shown on the operation-status page. Each node maps
// 1:1 to a real status; "Reached Site" has no dedicated backend status, so
// rather than invent one it is derived from relocatedCount > 0 (a real signal
// already stored on the operation) and shown as a sub-note on the
// in-progress step instead of a fabricated 8th status.
export const STATUS_STEPS = [
  { id: 'created', label: 'Assignment Created', statuses: [OPERATION_STATUS.PLANNING] },
  { id: 'notified', label: 'Team Notified', statuses: [OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING] },
  { id: 'enroute', label: 'Team En Route', statuses: [OPERATION_STATUS.TEAM_ASSIGNED] },
  { id: 'inprogress', label: 'Rescue/Relocation In Progress', statuses: [OPERATION_STATUS.OPERATION_ACTIVE, OPERATION_STATUS.PARTIALLY_RELOCATED] },
  { id: 'completed', label: 'Relocation Completed', statuses: [OPERATION_STATUS.RELOCATION_COMPLETED] },
  { id: 'closed', label: 'Operation Closed', statuses: [OPERATION_STATUS.OPERATION_CLOSED] },
]

const OFF_PATH_STATUSES = [OPERATION_STATUS.ASSIGNMENT_REJECTED, OPERATION_STATUS.TEAM_UNAVAILABLE, OPERATION_STATUS.OPERATION_CANCELLED, OPERATION_STATUS.OPERATION_FAILED, OPERATION_STATUS.REASSIGNMENT]

export function isOffPathStatus(status) {
  return OFF_PATH_STATUSES.includes(status)
}

export function currentStepIndex(status) {
  return STATUS_STEPS.findIndex((s) => s.statuses.includes(status))
}
