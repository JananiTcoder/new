// Alerts are DERIVED from current state every render — they are not a static
// list. Moving a What-If slider, changing an allocation, or a site crossing a
// capacity threshold will change what shows up here.
import { ALERT_SEVERITY, OPERATION_STATUS, ROUTE_STATUS } from '../types/geosentra'
import { computeEffectiveCapacity, computeAvailableCapacity } from './capacityCalculations'
import { computeStatusChange } from './riskCalculations'
import { isCoordinatorAvailable, isVolunteerAvailable } from './assignmentCalculations'

export function deriveAlerts({ habitations, safeSites, institutions, scenario, operations = {}, coordinators = [], volunteers = [] }) {
  const alerts = []

  habitations.forEach((h) => {
    const change = computeStatusChange(h, scenario)
    if (change.changed) {
      alerts.push({
        id: `status-${h.id}`,
        severity: change.currentStatus === 'Critical Red Zone' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
        hazard: h.primaryHazard,
        type: 'Red Zone status increased',
        message: `${h.name} moved from ${change.previousStatus} to ${change.currentStatus} under the current scenario.`,
        relatedId: h.id,
        relatedType: 'habitation',
      })
    }
    if (h.risk.confidenceTier === 'Low') {
      alerts.push({
        id: `conf-${h.id}`,
        severity: ALERT_SEVERITY.INFO,
        hazard: h.primaryHazard,
        type: 'Data confidence is low',
        message: `${h.name}'s risk assessment has low data confidence (${h.confidence}%).`,
        relatedId: h.id,
        relatedType: 'habitation',
      })
    }
  })

  safeSites.forEach((s) => {
    const { effectiveCapacity } = computeEffectiveCapacity(s)
    const available = computeAvailableCapacity(s)
    if (effectiveCapacity > 0 && available / effectiveCapacity < 0.12) {
      alerts.push({
        id: `cap-${s.id}`,
        severity: available === 0 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
        hazard: null,
        type: 'Safe-site capacity shortage',
        message: `${s.name} has only ${available.toLocaleString()} spaces of available capacity remaining.`,
        relatedId: s.id,
        relatedType: 'site',
      })
    }
  })

  institutions.forEach((inst) => {
    if (inst.evacuationPriority === 'Immediate' && inst.evacuationReadiness < 80) {
      alerts.push({
        id: `inst-${inst.id}`,
        severity: ALERT_SEVERITY.WARNING,
        hazard: inst.currentHazard,
        type: 'Institution evacuation required',
        message: `${inst.name} is marked Immediate priority but evacuation readiness is only ${inst.evacuationReadiness}%.`,
        relatedId: inst.id,
        relatedType: 'institution',
      })
    }
  })

  // Operation-aware alerts — every one links to the operation it's about so
  // "what needs action" always has a working "Open" button.
  Object.values(operations).forEach((op) => {
    const habitation = habitations.find((h) => h.id === op.habitationId)
    if (!habitation) return

    if (op.routeStatus === ROUTE_STATUS.BLOCKED) {
      alerts.push({
        id: `route-blocked-${op.id}`,
        severity: ALERT_SEVERITY.CRITICAL,
        hazard: habitation.primaryHazard,
        type: 'Route blocked',
        message: `The route for ${habitation.name}'s operation is currently blocked.`,
        relatedId: op.habitationId,
        relatedType: 'operation',
      })
    }

    if (op.status === OPERATION_STATUS.TEAM_UNAVAILABLE) {
      alerts.push({
        id: `team-unavailable-${op.id}`,
        severity: ALERT_SEVERITY.CRITICAL,
        hazard: habitation.primaryHazard,
        type: 'Coordinator unavailable',
        message: `The assigned team for ${habitation.name} is unavailable — reassignment needed.`,
        relatedId: op.habitationId,
        relatedType: 'operation',
      })
    }

    if (op.status === OPERATION_STATUS.ASSIGNMENT_REJECTED) {
      alerts.push({
        id: `assignment-rejected-${op.id}`,
        severity: ALERT_SEVERITY.WARNING,
        hazard: habitation.primaryHazard,
        type: 'Assignment rejected',
        message: `The assignment for ${habitation.name} was rejected${op.rejectionReason ? `: ${op.rejectionReason}` : '.'}`,
        relatedId: op.habitationId,
        relatedType: 'operation',
      })
    }

    if ((op.status === OPERATION_STATUS.OPERATION_ACTIVE || op.status === OPERATION_STATUS.PARTIALLY_RELOCATED) && op.relocatedCount === 0) {
      alerts.push({
        id: `operation-delayed-${op.id}`,
        severity: ALERT_SEVERITY.WARNING,
        hazard: habitation.primaryHazard,
        type: 'Operation delayed',
        message: `${habitation.name}'s operation is active but no one has been relocated yet.`,
        relatedId: op.habitationId,
        relatedType: 'operation',
      })
    }

    if (op.status === OPERATION_STATUS.RELOCATION_COMPLETED) {
      alerts.push({
        id: `operation-completed-${op.id}`,
        severity: ALERT_SEVERITY.INFO,
        hazard: habitation.primaryHazard,
        type: 'Operation completed',
        message: `${habitation.name}'s relocation is complete and ready to close.`,
        relatedId: op.habitationId,
        relatedType: 'operation',
      })
    }
  })

  if (coordinators.length > 0 && coordinators.every((c) => !isCoordinatorAvailable(c, operations))) {
    alerts.push({
      id: 'no-coordinators-available',
      severity: ALERT_SEVERITY.WARNING,
      hazard: null,
      type: 'Coordinator unavailable',
      message: 'No Emergency Coordinator is currently available across the entire roster.',
      relatedId: null,
      relatedType: null,
    })
  }
  if (volunteers.length > 0 && volunteers.every((v) => !isVolunteerAvailable(v, operations))) {
    alerts.push({
      id: 'no-volunteers-available',
      severity: ALERT_SEVERITY.WARNING,
      hazard: null,
      type: 'Volunteer unavailable',
      message: 'No volunteer is currently available across the entire roster.',
      relatedId: null,
      relatedType: null,
    })
  }

  return alerts
}

// Role-based alert visibility. Citizen sees only alerts that are genuinely
// public-safety relevant (their area's hazard status); data-quality notes and
// site/institution operational alerts are administrative and stay hidden from
// them. Volunteers add their own evacuation-relevant alerts on top of the
// public ones. Authority and Emergency Coordinator see everything.
const ALERT_TYPE_ROLES = {
  'Red Zone status increased': ['disaster-authority', 'volunteers', 'citizen', 'emergency-coordinator'],
  'Data confidence is low': ['disaster-authority', 'emergency-coordinator'],
  'Safe-site capacity shortage': ['disaster-authority', 'volunteers', 'emergency-coordinator'],
  'Institution evacuation required': ['disaster-authority', 'volunteers', 'emergency-coordinator'],
}

export function filterAlertsForRole(alerts, role) {
  return alerts.filter((a) => (ALERT_TYPE_ROLES[a.type] || ['disaster-authority', 'emergency-coordinator']).includes(role))
}
