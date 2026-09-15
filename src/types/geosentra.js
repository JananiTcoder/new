// Shared constants and JSDoc type shapes for GEOSENTRA.
// The project uses plain JavaScript (no TypeScript build step), so "types" here
// are documented with JSDoc typedefs for editor intellisense + a single source
// of truth for the enums every page/data file/util imports from.
//
// FUTURE BACKEND INTEGRATION:
// These shapes are intentionally close to what a real risk/relocation API would
// return, so swapping data/*.js + utils/*Calculations.js for real network calls
// later should not require changing the pages that consume them.

// ---- Approved hazard scope (strict — do not add hazards outside this list) ----
export const HAZARD_TYPES = [
  { id: 'landslide', label: 'Landslide', color: '#b45309' },
  { id: 'flood', label: 'Flood', color: '#2563eb' },
  { id: 'coastal-erosion', label: 'Coastal Erosion', color: '#0d9488' },
  { id: 'cloudburst', label: 'Cloudburst', color: '#0891b2' },
]
export const HAZARD_IDS = HAZARD_TYPES.map((h) => h.id)
export const getHazardType = (id) => HAZARD_TYPES.find((h) => h.id === id)

// ---- Red Zone status tiers ----
export const REDZONE_STATUS = {
  NORMAL: 'Normal',
  WATCH: 'Watch',
  HIGH_RISK: 'High Risk',
  CRITICAL: 'Critical Red Zone',
}
export const REDZONE_STATUS_LEVELS = [
  { id: REDZONE_STATUS.NORMAL, color: '#059669', order: 0 },
  { id: REDZONE_STATUS.WATCH, color: '#d97706', order: 1 },
  { id: REDZONE_STATUS.HIGH_RISK, color: '#ea580c', order: 2 },
  { id: REDZONE_STATUS.CRITICAL, color: '#991b1b', order: 3 },
]
export const statusOrder = (status) => REDZONE_STATUS_LEVELS.find((s) => s.id === status)?.order ?? 0
export const statusColor = (status) => REDZONE_STATUS_LEVELS.find((s) => s.id === status)?.color ?? '#64748b'

// ---- Relocation timeframes ----
export const RELOCATION_TIMEFRAME = {
  IMMEDIATE: 'Immediate',
  SHORT_TERM: 'Short-Term',
  MEDIUM_TERM: 'Medium-Term',
  MONITOR: 'Monitor Only',
}

// ---- Travel / evacuation profiles ----
export const TRAVEL_PROFILES = [
  { id: 'school-child', label: 'School Children', icon: 'Backpack' },
  { id: 'elderly', label: 'Elderly People', icon: 'Users' },
  { id: 'young-adult', label: 'Young Adults', icon: 'PersonStanding' },
  { id: 'mobility-needs', label: 'People with Mobility Needs', icon: 'Accessibility' },
  { id: 'vehicle', label: 'Vehicles', icon: 'Car' },
]

// ---- Institution types ----
export const INSTITUTION_TYPES = {
  SCHOOL: 'School',
  COLLEGE: 'College',
  HOSPITAL: 'Hospital',
  CARE_HOME: 'Care Home',
  COMMUNITY_CENTER: 'Community Center',
}

// ---- Data confidence tiers ----
export const CONFIDENCE_TIER = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }
export const confidenceTier = (pct) => (pct >= 75 ? CONFIDENCE_TIER.HIGH : pct >= 55 ? CONFIDENCE_TIER.MEDIUM : CONFIDENCE_TIER.LOW)

// ---- Alert severities ----
export const ALERT_SEVERITY = { INFO: 'info', WARNING: 'warning', CRITICAL: 'critical' }

// ---- Alert lifecycle status. "Active" is the implicit default for any alert
// with no stored status — never stored separately, same convention as
// OPERATION_STATUS.YET_TO_PLAN_RESCUE above. Frontend-only demo state; no
// real notification or backend ticketing system is involved. ----
export const ALERT_STATUS = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Acknowledged',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
}

// ---- Operation status (the full habitation -> safe site -> infrastructure ->
// rescue team -> route -> validation -> assignment -> acceptance -> active ->
// completion lifecycle). "No operation record exists yet" IS the
// YET_TO_PLAN_RESCUE status — it is never itself stored, exactly like the
// rest of this app treats "no record" as the initial state rather than
// duplicating that as a stored value. ----
export const OPERATION_STATUS = {
  // Canonical Coordinator & Flutter lifecycle statuses
  ASSIGNED: 'Assigned',
  DISPATCHED: 'Dispatched',
  EN_ROUTE: 'En Route',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',

  // Prior workflow aliases / legacy states
  YET_TO_PLAN_RESCUE: 'Yet to Assign',
  PLANNING: 'Planning',
  TEAM_ASSIGNMENT_PENDING: 'Assigned',
  TEAM_ASSIGNED: 'Dispatched',
  OPERATION_ACTIVE: 'In Progress',
  PARTIALLY_RELOCATED: 'In Progress',
  RELOCATION_COMPLETED: 'Completed',
  OPERATION_CLOSED: 'Completed',
  ASSIGNMENT_REJECTED: 'Assignment Rejected',
  OPERATION_CANCELLED: 'Operation Cancelled',
  OPERATION_FAILED: 'Operation Failed',
  TEAM_UNAVAILABLE: 'Team Unavailable',
  REASSIGNMENT: 'Reassignment',
}

// ---- Prototype notification state — this app has no real SMS/email/push
// delivery; these labels describe frontend-only state transitions only. ----
export const NOTIFICATION_STATE = {
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  READ: 'Read',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
}

// ---- Route status for an in-progress operation. Illustrative/simulated —
// see utils/routing.js and routeCalculations.js for the same disclosure on
// the underlying route geometry. ----
export const ROUTE_STATUS = {
  ACTIVE: 'Route Active',
  WARNING: 'Route Warning',
  BLOCKED: 'Route Blocked',
  ALTERNATIVE_AVAILABLE: 'Alternative Route Available',
  UNAVAILABLE: 'Route Unavailable',
}

// ---- Audit event types ----
export const AUDIT_EVENT_TYPE = {
  STATUS_CHANGE: 'Red Zone status change',
  RISK_CHANGE: 'Risk score change',
  RISK_ASSESSMENT_VIEWED: 'Risk assessment viewed',
  SCENARIO_APPLIED: 'Scenario applied',
  SCENARIO_RESET: 'Scenario reset',
  PLAN_CREATED: 'Relocation plan created',
  PLANNING_STARTED: 'Relocation planning started',
  ALLOCATION_CHANGED: 'Site allocation changed',
  ROUTE_CHANGED: 'Route recommendation changed',
  ROUTE_GENERATED: 'Route generated',
  ROUTE_BLOCKED: 'Route blocked',
  ALTERNATIVE_ROUTE_SELECTED: 'Alternative route selected',
  ALERT_GENERATED: 'Alert generated',
  PROFILE_CHANGED: 'User profile changed',
  SAFE_SITE_SELECTED: 'Safe Site selected',
  INFRASTRUCTURE_SELECTED: 'Infrastructure selected',
  VALIDATION_PASSED: 'Validation passed',
  VALIDATION_FAILED: 'Validation failed',
  ASSIGNMENT_CREATED: 'Assignment created',
  NOTIFICATION_SENT: 'Notification sent',
  ASSIGNMENT_ACCEPTED: 'Assignment accepted',
  ASSIGNMENT_REJECTED: 'Assignment rejected',
  COORDINATOR_ASSIGNED: 'Emergency Coordinator assigned',
  COORDINATOR_REASSIGNED: 'Emergency Coordinator reassigned',
  VOLUNTEERS_ASSIGNED: 'Volunteers assigned',
  RELOCATED_COUNT_UPDATED: 'People relocated count updated',
  OPERATION_STATUS_CHANGED: 'Operation status changed',
  OPERATION_COMPLETED: 'Operation completed',
  OPERATION_CLOSED: 'Operation closed',
  ALERT_ACKNOWLEDGED: 'Alert acknowledged',
  ALERT_RESOLVED: 'Alert resolved',
  ALERT_DISMISSED: 'Alert dismissed',
  DESTINATION_CHANGED: 'Evacuation destination changed',
  RESOURCE_ASSIGNED: 'Resource assignment updated',
  INSTITUTION_BLOCKER_RESOLVED: 'Institution blocker resolved',
  TRANSPORT_ASSIGNED: 'Institution transport assigned',
}

/**
 * @typedef {'landslide'|'flood'|'coastal-erosion'|'cloudburst'} HazardId
 *
 * @typedef {Object} HazardZone
 * @property {string} id
 * @property {HazardId} type
 * @property {string} label
 * @property {[number,number][]} polygon
 * @property {number} affectedAreaKm2
 * @property {number} confidence
 * @property {string} lastUpdated
 * @property {Object} fields  hazard-specific fields, shape depends on `type`
 *
 * @typedef {Object} DisasterHistory
 * @property {number} incidentCount
 * @property {string} summary
 *
 * @typedef {Object} VulnerabilityIndicators
 * @property {number} elderly
 * @property {number} children
 * @property {number} disabled
 * @property {'Low'|'Medium'|'High'} healthcareDependency
 *
 * @typedef {Object} Habitation
 * @property {string} id
 * @property {string} name
 * @property {string} district
 * @property {{lat:number,lng:number}} position
 * @property {number} population
 * @property {HazardId[]} hazards
 * @property {HazardId} primaryHazard
 * @property {number} hazardIntensityBase 0-100
 * @property {VulnerabilityIndicators} vulnerability
 * @property {DisasterHistory} disasterHistory
 * @property {'Poor'|'Moderate'|'Good'} roadAccessibility
 * @property {'Insufficient'|'Limited'|'Adequate'} shelterAvailability
 * @property {number} confidence 0-100
 * @property {string} lastUpdated
 * @property {'Good'|'Fair'} dataQuality
 * @property {string} missingData
 *
 * @typedef {Object} CapacityBreakdown
 * @property {number} physicalCapacity
 * @property {number} waterCapacity
 * @property {number} medicalCapacity
 * @property {number} sanitationCapacity
 * @property {number} foodCapacity
 * @property {number} accessibilityCapacity
 *
 * @typedef {Object} SafeSite
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {{lat:number,lng:number}} position
 * @property {number} safetyScoreBase 0-100, structural/geographic safety only
 * @property {number} currentOccupancy
 * @property {number} reservedCapacity
 * @property {CapacityBreakdown} capacity
 * @property {'Excellent'|'Good'|'Moderate'|'Poor'} roadAccess
 * @property {'Good'|'Medium'|'Low'} livelihoodAccess
 * @property {number} confidence
 *
 * @typedef {Object} RelocationPlan
 * @property {string} habitationId
 * @property {{siteId:string, amount:number}[]} allocations
 * @property {number} allocatedTotal
 * @property {number} unallocated
 *
 * @typedef {Object} RouteSegment
 * @property {string} id
 * @property {string} label
 * @property {{lat:number,lng:number}} position
 * @property {HazardId} hazard
 * @property {'LOW'|'MEDIUM'|'HIGH'} risk
 * @property {string} reason
 * @property {string} recommendedAction
 *
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} label
 *
 * @typedef {Object} Institution
 * @property {string} id
 * @property {string} name
 * @property {'School'|'College'|'Hospital'|'Care Home'|'Community Center'} type
 * @property {number} groupSize
 * @property {string} selectedSiteId
 * @property {string} preferredProfileId
 * @property {boolean} accessibilityRequirement
 * @property {'Immediate'|'Short-Term'|'Medium-Term'} evacuationPriority
 *
 * @typedef {Object} AuditEvent
 * @property {number|string} id
 * @property {string} timestamp
 * @property {string} type one of AUDIT_EVENT_TYPE
 * @property {string} [relatedId]
 * @property {string} [previousValue]
 * @property {string} [newValue]
 * @property {string} reason
 * @property {'info'|'warning'|'critical'} severity
 *
 * @typedef {Object} DataConfidence
 * @property {'High'|'Medium'|'Low'} tier
 * @property {number} pct
 * @property {string} lastUpdated
 * @property {string} sourceStatus always "Mock frontend data — no live feed"
 *
 * @typedef {Object} PredictionResult
 * @property {HazardId} hazardType
 * @property {number} riskScore
 * @property {string} severity
 * @property {number} affectedArea
 * @property {number} confidence
 * @property {string[]} contributingFactors
 * @property {string} timestamp
 * @property {string} modelVersion
 */
export {}
