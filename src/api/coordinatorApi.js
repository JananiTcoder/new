// Emergency Coordinator & Operations REST API Layer for GeoSentra & Flutter Integration.
//
// Provides endpoints:
// - POST /api/emergency-coordinators/assign
// - GET  /api/emergency-coordinators/:coordinatorId/operations
// - PATCH /api/operations/:operationId/status
// - GET  /api/operations/:operationId
// - GET  /api/emergency-coordinators/:coordinatorId/notifications
//
// In this prototype, operations are stored in localStorage (`geosentra_operations`)
// and notifications are dispatched via `notificationService`. In production,
// this API can be served directly by FastAPI / Express / Spring Boot backend.

import { notificationService } from '../services/notificationService'
import { habitations, getHabitation } from '../data/habitations'
import { safeSites, getSafeSite } from '../data/safeSites'
import { coordinators, getCoordinator } from '../data/coordinators'

const OPERATIONS_STORAGE_KEY = 'geosentra_operations'

export function getStoredOperationsMap() {
  try {
    const raw = localStorage.getItem(OPERATIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveStoredOperationsMap(map) {
  try {
    localStorage.setItem(OPERATIONS_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Fallback
  }
}

let opCounter = 100
function makeOperationId(habitationId) {
  opCounter += 1
  return `OP-${habitationId ? habitationId.toUpperCase().slice(0, 5) : 'EMRG'}-${Date.now().toString().slice(-4)}`
}

/**
 * Assigns an Emergency Coordinator to a Risk Habitation and sends an alert.
 * Equivalent to: POST /api/emergency-coordinators/assign
 *
 * @param {Object} body
 * @param {string} body.habitationId
 * @param {string} body.coordinatorId
 * @param {string} body.reliefSiteId
 * @param {string} [body.routeId]
 * @param {Object} [body.routeDetails] - { distanceKm, estimatedMinutes, name }
 * @returns {Promise<Object>}
 */
export async function assignEmergencyCoordinator({
  habitationId,
  coordinatorId,
  reliefSiteId,
  routeId = 'route-a',
  routeDetails = { distanceKm: 8.4, estimatedMinutes: 18 },
}) {
  const operations = getStoredOperationsMap()
  const habitation = getHabitation(habitationId) || { id: habitationId, name: habitationId, primaryHazard: 'Flood' }
  const site = getSafeSite(reliefSiteId) || { id: reliefSiteId, name: 'Tambaram Relief Centre' }
  const coordinator = getCoordinator(coordinatorId) || { id: coordinatorId, name: 'Arun Kumar' }

  const operationId = operations[habitationId]?.id || makeOperationId(habitationId)
  const now = new Date().toISOString()

  const operationRecord = {
    id: operationId,
    habitationId,
    habitationName: habitation.name,
    coordinatorId,
    coordinatorName: coordinator.name,
    reliefSiteId,
    reliefSiteName: site.name,
    routeId,
    routeDetails,
    status: 'ASSIGNED',
    assignedAt: now,
    updatedAt: now,
    populationRequiring: habitation.population || 2450,
    relocatedCount: 0,
    hazard: {
      type: habitation.primaryHazard || 'Flood',
      level: habitation.risk?.status || 'Critical Red Zone',
    },
    timeline: [
      {
        id: `tl-${Date.now()}-1`,
        label: 'Emergency Coordinator Assigned',
        detail: `${coordinator.name} assigned to respond to ${habitation.name}.`,
        timestamp: now,
      },
    ],
  }

  // Persist to operations map
  operations[habitationId] = operationRecord
  saveStoredOperationsMap(operations)

  // Dispatch alert to Coordinator (Flutter app receiver)
  await notificationService.sendEmergencyAssignment({
    operationId,
    coordinatorId,
    coordinatorName: coordinator.name,
    habitation: {
      id: habitationId,
      name: habitation.name,
      hazard: habitation.primaryHazard || 'Flood',
      hazardLevel: 'Critical',
    },
    reliefSite: {
      id: reliefSiteId,
      name: site.name,
    },
    route: {
      id: routeId,
      distanceKm: routeDetails.distanceKm || 8.4,
      estimatedMinutes: routeDetails.estimatedMinutes || 18,
    },
  })

  return {
    success: true,
    operationId,
    status: 'ASSIGNED',
    message: 'Emergency Coordinator assigned successfully',
    operation: operationRecord,
  }
}

/**
 * Retrieves all operations assigned to a specific Emergency Coordinator.
 * Equivalent to: GET /api/emergency-coordinators/:coordinatorId/operations
 *
 * @param {string} coordinatorId
 * @returns {Promise<Object>}
 */
export async function getCoordinatorOperations(coordinatorId) {
  const operations = getStoredOperationsMap()
  const list = Object.values(operations)
    .filter((op) => !coordinatorId || op.coordinatorId === coordinatorId)
    .map((op) => {
      const habitation = getHabitation(op.habitationId)
      const site = getSafeSite(op.reliefSiteId)
      return {
        operationId: op.id,
        status: op.status,
        assignedAt: op.assignedAt,
        updatedAt: op.updatedAt,
        habitation: {
          id: op.habitationId,
          name: op.habitationName || habitation?.name || op.habitationId,
          district: habitation?.district || 'Tamil Nadu',
          population: habitation?.population || op.populationRequiring,
        },
        hazard: {
          type: op.hazard?.type || habitation?.primaryHazard || 'Flood',
          level: op.hazard?.level || habitation?.risk?.status || 'Critical',
        },
        reliefSite: {
          id: op.reliefSiteId,
          name: op.reliefSiteName || site?.name || op.reliefSiteId,
          location: site?.district || 'Relief Centre',
        },
        route: {
          id: op.routeId || 'route-a',
          distanceKm: op.routeDetails?.distanceKm || 8.4,
          estimatedMinutes: op.routeDetails?.estimatedMinutes || 18,
        },
        timeline: op.timeline || [],
      }
    })

  return {
    success: true,
    coordinatorId,
    count: list.length,
    operations: list,
  }
}

/**
 * Updates the operational status of an ongoing emergency response operation.
 * Used by the Flutter app when the coordinator reaches checkpoints:
 * ASSIGNED -> DISPATCHED -> EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED
 * Equivalent to: PATCH /api/operations/:operationId/status
 *
 * @param {string} operationId
 * @param {string} nextStatus
 * @returns {Promise<Object>}
 */
export async function updateOperationStatus(operationId, nextStatus) {
  const operations = getStoredOperationsMap()
  let targetHabitationId = null

  for (const [habId, op] of Object.entries(operations)) {
    if (op.id === operationId || habId === operationId) {
      targetHabitationId = habId
      break
    }
  }

  if (!targetHabitationId || !operations[targetHabitationId]) {
    return {
      success: false,
      error: `Operation with ID ${operationId} not found.`,
    }
  }

  const op = operations[targetHabitationId]
  const now = new Date().toISOString()
  op.status = nextStatus
  op.updatedAt = now
  op.timeline = op.timeline || []
  op.timeline.unshift({
    id: `tl-${Date.now()}`,
    label: `Status changed to ${nextStatus}`,
    timestamp: now,
  })

  operations[targetHabitationId] = op
  saveStoredOperationsMap(operations)

  return {
    success: true,
    operationId,
    status: nextStatus,
    updatedAt: now,
    message: `Operation status successfully updated to ${nextStatus}`,
  }
}

// In-browser mock fetch handler for any client calling `/api/*` directly
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = async function (url, options = {}) {
    const urlStr = typeof url === 'string' ? url : url.toString()

    if (urlStr.startsWith('/api/emergency-coordinators/assign') && (options.method === 'POST' || !options.method)) {
      const body = options.body ? JSON.parse(options.body) : {}
      const res = await assignEmergencyCoordinator(body)
      return new Response(JSON.stringify(res), {
        status: res.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const operationsMatch = urlStr.match(/\/api\/emergency-coordinators\/([^/]+)\/operations/)
    if (operationsMatch && (options.method === 'GET' || !options.method)) {
      const coordinatorId = operationsMatch[1]
      const res = await getCoordinatorOperations(coordinatorId)
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const statusMatch = urlStr.match(/\/api\/operations\/([^/]+)\/status/)
    if (statusMatch && (options.method === 'PATCH' || options.method === 'POST')) {
      const operationId = statusMatch[1]
      const body = options.body ? JSON.parse(options.body) : {}
      const res = await updateOperationStatus(operationId, body.status)
      return new Response(JSON.stringify(res), {
        status: res.success ? 200 : 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return originalFetch.apply(this, arguments)
  }
}
