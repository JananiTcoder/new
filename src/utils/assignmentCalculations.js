// Pure calculation utilities for the full operation lifecycle: planning,
// pre-assignment validation, assignment, acceptance and completion. No
// React, no I/O, no Math.random() — mirrors the convention in
// riskCalculations.js / capacityCalculations.js. "Available" is always
// derived live from the roster's base status plus current operation load,
// never a separate stored flag that could drift out of sync.
import { OPERATION_STATUS, ROUTE_STATUS, REDZONE_STATUS } from '../types/geosentra'
import { computeAvailableCapacity } from './capacityCalculations'

const OPEN_STATUSES = [
  OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING,
  OPERATION_STATUS.TEAM_ASSIGNED,
  OPERATION_STATUS.OPERATION_ACTIVE,
  OPERATION_STATUS.PARTIALLY_RELOCATED,
  OPERATION_STATUS.TEAM_UNAVAILABLE,
]

export function operationsList(operations) {
  return Object.values(operations || {})
}

export function getOperationForHabitation(operations, habitationId) {
  return operations?.[habitationId] || null
}

/** "No operation record" IS the Yet to Plan Rescue status — never stored separately. */
export function getHabitationOperationStatus(habitationId, operations) {
  return getOperationForHabitation(operations, habitationId)?.status || OPERATION_STATUS.YET_TO_PLAN_RESCUE
}

/**
 * 0-6 index into the guided workflow's Habitation / Safe Site /
 * Infrastructure / Rescue Team / Route / Validation / Assignment steps.
 * Derived from which fields are filled rather than a 1:1 status mapping,
 * since several of those steps all share the single PLANNING status.
 */
export function planningStepIndex(operation) {
  if (!operation) return 0
  if (operation.status !== OPERATION_STATUS.PLANNING) return 6
  const filled = [operation.safeSiteId, operation.infrastructureId, operation.coordinatorId, operation.routeId].filter(Boolean).length
  return Math.min(5, 1 + filled)
}

export function openOperationsForCoordinator(operations, coordinatorId) {
  return operationsList(operations).filter((o) => o.coordinatorId === coordinatorId && OPEN_STATUSES.includes(o.status))
}

export function isCoordinatorAvailable(coordinator, operations) {
  if (!coordinator || coordinator.status !== 'Available') return false
  return openOperationsForCoordinator(operations, coordinator.id).length < coordinator.maxConcurrentCases
}

export function openOperationsForVolunteer(operations, volunteerId) {
  return operationsList(operations).filter((o) => (o.volunteerIds || []).includes(volunteerId) && OPEN_STATUSES.includes(o.status))
}

export function isVolunteerAvailable(volunteer, operations) {
  if (!volunteer || volunteer.status !== 'Available') return false
  return openOperationsForVolunteer(operations, volunteer.id).length === 0
}

export function operationsForCoordinator(operations, coordinatorId) {
  return operationsList(operations).filter((o) => o.coordinatorId === coordinatorId)
}

export function operationsForVolunteer(operations, volunteerId) {
  return operationsList(operations).filter((o) => (o.volunteerIds || []).includes(volunteerId))
}

// ---- Pre-assignment validation ----
// Each validator returns { ok, issues: [{ message, correctionPath, correctionLabel }] }
// so the Validation page can render pass/fail per category with a working
// "fix this" link, and never silently assign when something is wrong.

export function validateHabitation(habitation) {
  const issues = []
  if (!habitation) {
    issues.push({ message: 'Habitation record not found.', correctionPath: '/app/habitations', correctionLabel: 'Return to Risk Habitations' })
    return { ok: false, issues }
  }
  if (habitation.risk?.status === REDZONE_STATUS.NORMAL) {
    issues.push({ message: 'This habitation is no longer at elevated risk — relocation may not be required.', correctionPath: `/app/habitations/${habitation.id}`, correctionLabel: 'Review risk assessment' })
  }
  if (!habitation.population || habitation.population <= 0) {
    issues.push({ message: 'Population data is unavailable for this habitation.', correctionPath: `/app/habitations/${habitation.id}`, correctionLabel: 'Review habitation record' })
  }
  if (!habitation.risk || typeof habitation.risk.riskScore !== 'number') {
    issues.push({ message: 'Risk assessment is invalid or incomplete.', correctionPath: `/app/habitations/${habitation.id}`, correctionLabel: 'Review risk assessment' })
  }
  return { ok: issues.length === 0, issues }
}

export function validateSafeSite(safeSite, requiredPopulation, infrastructureSelected) {
  const issues = []
  if (!safeSite) {
    issues.push({ message: 'No Safe Site has been selected.', correctionPath: '/app/relocation', correctionLabel: 'Select a Safe Site' })
    return { ok: false, issues }
  }
  const available = computeAvailableCapacity(safeSite)
  if (available < requiredPopulation) {
    issues.push({
      message: `Insufficient capacity at ${safeSite.name}: required ${requiredPopulation.toLocaleString()}, available ${available.toLocaleString()}.`,
      correctionPath: '/app/relocation',
      correctionLabel: 'Choose a different Safe Site',
    })
  }
  if (!infrastructureSelected) {
    issues.push({ message: 'No infrastructure has been selected at this Safe Site.', correctionPath: '/app/infrastructure', correctionLabel: 'Select infrastructure' })
  }
  return { ok: issues.length === 0, issues }
}

export function validateCoordinator(coordinator, operations) {
  const issues = []
  if (!coordinator) {
    issues.push({ message: 'No Emergency Coordinator / rescue team has been assigned.', correctionPath: '/app/relocation/team', correctionLabel: 'Select a rescue team' })
    return { ok: false, issues }
  }
  if (!isCoordinatorAvailable(coordinator, operations)) {
    issues.push({
      message: `${coordinator.name} is no longer available — off duty or already at their concurrent-case limit.`,
      correctionPath: '/app/relocation/team',
      correctionLabel: 'Choose a different coordinator',
    })
  }
  return { ok: issues.length === 0, issues }
}

export function validateRoute(routeId, routeStatus) {
  const issues = []
  if (!routeId) {
    issues.push({ message: 'No route has been generated.', correctionPath: '/app/routes', correctionLabel: 'Generate a route' })
    return { ok: false, issues }
  }
  if (routeStatus === ROUTE_STATUS.BLOCKED || routeStatus === ROUTE_STATUS.UNAVAILABLE) {
    issues.push({ message: `The selected route is currently ${routeStatus}.`, correctionPath: '/app/routes', correctionLabel: 'Recalculate route' })
  }
  return { ok: issues.length === 0, issues }
}
