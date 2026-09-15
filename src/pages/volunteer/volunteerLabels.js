// Shared Volunteer-portal terminology mapping — pure functions, no state, no
// randomness. Mirrors src/pages/citizen/citizenLabels.js's approach: a thin
// presentation layer over the same deterministic task/habitation data.
import { TASK_STATUS, TASK_TYPE } from '../../data/volunteerTasks'

export const PRIORITY_LABEL = { critical: 'RED PRIORITY', high: 'ORANGE PRIORITY', medium: 'YELLOW PRIORITY', low: 'LOW PRIORITY' }

export function priorityTone(priority) {
  if (priority === 'critical') return 'danger'
  if (priority === 'high') return 'warning'
  if (priority === 'medium') return 'blue'
  return 'default'
}

export const TASK_STATUS_LABEL = {
  [TASK_STATUS.ASSIGNED]: 'Assigned',
  [TASK_STATUS.ACCEPTED]: 'Accepted',
  [TASK_STATUS.REJECTED]: 'Rejected',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.WAITING_FOR_CHECKIN]: 'Waiting for Check-in',
  [TASK_STATUS.PARTIALLY_COMPLETED]: 'Partially Completed',
  [TASK_STATUS.COMPLETED]: 'Completed',
  [TASK_STATUS.UNDER_VERIFICATION]: 'Under Verification',
  [TASK_STATUS.FAILED]: 'Failed',
  [TASK_STATUS.CANCELLED]: 'Cancelled',
  [TASK_STATUS.REASSIGNED]: 'Reassigned',
}

export function taskStatusLabel(status) {
  return TASK_STATUS_LABEL[status] || 'Status unavailable'
}

export function taskStatusTone(status) {
  switch (status) {
    case TASK_STATUS.COMPLETED:
      return 'good'
    case TASK_STATUS.IN_PROGRESS:
    case TASK_STATUS.PARTIALLY_COMPLETED:
    case TASK_STATUS.ACCEPTED:
      return 'blue'
    case TASK_STATUS.UNDER_VERIFICATION:
    case TASK_STATUS.WAITING_FOR_CHECKIN:
      return 'warning'
    case TASK_STATUS.REJECTED:
    case TASK_STATUS.FAILED:
    case TASK_STATUS.CANCELLED:
      return 'danger'
    default:
      return 'default'
  }
}

export const TASK_TYPE_LABEL = {
  [TASK_TYPE.EVACUATION]: 'Evacuation',
  [TASK_TYPE.MEDICAL_SUPPLY]: 'Medical Supply Delivery',
  [TASK_TYPE.SHELTER_VERIFICATION]: 'Shelter Verification',
  [TASK_TYPE.RESOURCE_DELIVERY]: 'Resource Delivery',
  [TASK_TYPE.WELFARE_CHECK]: 'Welfare Check',
  [TASK_TYPE.VERIFICATION]: 'People Verification',
}

export function taskTypeLabel(type) {
  return TASK_TYPE_LABEL[type] || 'Task'
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const ACTIVE_STATUSES = [TASK_STATUS.ASSIGNED, TASK_STATUS.ACCEPTED, TASK_STATUS.WAITING_FOR_CHECKIN, TASK_STATUS.IN_PROGRESS, TASK_STATUS.PARTIALLY_COMPLETED]

/** The single task the volunteer should focus on next — highest priority among active statuses. */
export function pickCurrentTask(tasks) {
  const active = tasks.filter((t) => ACTIVE_STATUSES.includes(t.status))
  if (active.length === 0) return null
  return [...active].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))[0]
}

export function isTaskActive(task) {
  return ACTIVE_STATUSES.includes(task.status)
}

// The one primary action button a task card/detail page should show for its
// current status — never more than one at a time on the card (detail page
// shows a couple, e.g. Accept + Reject, per the brief's "not every button at
// once" rule).
export function primaryActionForStatus(status) {
  switch (status) {
    case TASK_STATUS.ASSIGNED:
      return 'Accept'
    case TASK_STATUS.ACCEPTED:
      return 'Navigate'
    case TASK_STATUS.WAITING_FOR_CHECKIN:
      return 'Check in'
    case TASK_STATUS.IN_PROGRESS:
    case TASK_STATUS.PARTIALLY_COMPLETED:
      return 'Update'
    case TASK_STATUS.UNDER_VERIFICATION:
      return 'View'
    case TASK_STATUS.COMPLETED:
      return 'View'
    default:
      return 'View'
  }
}

export function readinessLabel(status) {
  // status: 'ready' | 'needs-attention' | 'unavailable' | 'unknown'
  if (status === 'ready') return 'Ready'
  if (status === 'needs-attention') return 'Needs attention'
  if (status === 'unavailable') return 'Unavailable'
  return 'Data unavailable'
}

export function readinessTone(status) {
  if (status === 'ready') return 'good'
  if (status === 'needs-attention') return 'warning'
  if (status === 'unavailable') return 'danger'
  return 'default'
}

// Deterministic readiness breakdown for a task — never a bare unexplained
// percentage. Every category is derived from real fields already on the
// task record (status + assigned resources), never randomized.
export function computeReadinessBreakdown(task) {
  if (!task) return { people: 'unavailable', transport: 'unavailable', medical: 'unavailable', supplies: 'unavailable', overallPct: 0 }
  const resources = (task.assignedResources || []).join(' ').toLowerCase()
  const people = ['accepted', 'in-progress', 'partially-completed', 'completed', 'under-verification'].includes(task.status)
    ? 'ready'
    : task.status === 'rejected' || task.status === 'failed' || task.status === 'cancelled'
    ? 'unavailable'
    : 'needs-attention'
  const transport = /van|vehicle|wheeler|transport/.test(resources) ? 'ready' : 'needs-attention'
  const medical = /medical|first aid/.test(resources) ? 'ready' : task.type === 'medical-supply' ? 'needs-attention' : 'ready'
  const supplies = (task.assignedResources || []).length > 0 ? 'ready' : 'needs-attention'
  const statuses = { people, transport, medical, supplies }
  const readyCount = Object.values(statuses).filter((s) => s === 'ready').length
  return { ...statuses, overallPct: Math.round((readyCount / 4) * 100) }
}
