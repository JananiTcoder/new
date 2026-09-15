import { habitations } from './habitations'
import { safeSites } from './safeSites'
import { hazardZones, HAZARD_TYPES } from './hazards'
import { computeHabitationRisk } from '../utils/riskCalculations'
import { computeEffectiveCapacity, computeAvailableCapacity } from '../utils/capacityCalculations'
import { isCoordinatorAvailable, isVolunteerAvailable, operationsList } from '../utils/assignmentCalculations'
import { availabilityStatus } from '../provider/capacityService'
import { REDZONE_STATUS, OPERATION_STATUS } from '../types/geosentra'
import { VERIFICATION_STATUS, AVAILABILITY_STATUS } from '../types/provider'

// Every KPI below is derived live from the underlying mock datasets
// (habitations.js, safeSites.js, hazards.js) run through the shared risk and
// capacity calculators — so the dashboard summary always matches what
// drill-down pages actually show, and reacts to the current What-If scenario.
export function computeDashboardMetrics(scenario) {
  const withRisk = habitations.map((h) => ({ ...h, risk: computeHabitationRisk(h, scenario) }))

  const redZoneCount = withRisk.filter((h) => h.risk.redZone).length
  const immediateCount = withRisk.filter((h) => h.risk.status === REDZONE_STATUS.CRITICAL).length
  const actionCount = withRisk.filter((h) => h.risk.status === REDZONE_STATUS.CRITICAL || h.risk.status === REDZONE_STATUS.HIGH_RISK).length
  const vulnerablePopulation = withRisk.reduce((sum, h) => sum + h.vulnerability.elderly + h.vulnerability.children + h.vulnerability.disabled, 0)
  const affectedPopulation = withRisk
    .filter((h) => h.risk.status === REDZONE_STATUS.CRITICAL || h.risk.status === REDZONE_STATUS.HIGH_RISK)
    .reduce((sum, h) => sum + h.population, 0)

  const availableCapacity = safeSites.reduce((sum, s) => sum + computeAvailableCapacity(s), 0)
  const nearCapacitySites = safeSites.filter((s) => {
    const { effectiveCapacity } = computeEffectiveCapacity(s)
    return computeAvailableCapacity(s) / effectiveCapacity < 0.25
  }).length
  const capacityShortage = Math.max(0, affectedPopulation - availableCapacity)

  const lowRiskCount = withRisk.filter((h) => h.risk.status === REDZONE_STATUS.NORMAL).length
  const moderateRiskCount = withRisk.filter((h) => h.risk.status === REDZONE_STATUS.WATCH).length

  return [
    { id: 'lowrisk', label: 'Low Risk Habitations', value: lowRiskCount, icon: 'ShieldCheck', trend: `of ${habitations.length} tracked`, tone: 'good' },
    { id: 'highrisk', label: 'High-Risk Habitations', value: actionCount, icon: 'AlertTriangle', trend: `of ${habitations.length} tracked`, tone: 'warning' },
    { id: 'redzones', label: 'Critical Red Zone Habitations', value: redZoneCount, icon: 'ShieldAlert', trend: `${immediateCount} require immediate relocation`, tone: 'danger' },
    { id: 'affected', label: 'People Requiring Immediate Relocation', value: affectedPopulation, icon: 'UsersRound', trend: `across ${actionCount} habitations`, tone: 'danger' },
    { id: 'population', label: 'Vulnerable Population Tracked', value: vulnerablePopulation, icon: 'Users', trend: 'Elderly, children & disabled residents', tone: 'default' },
    { id: 'capacity', label: 'Available Safe-Site Capacity', value: availableCapacity, icon: 'ShieldCheck', trend: `${nearCapacitySites} sites near capacity`, tone: 'good' },
    { id: 'shortage', label: 'Capacity Shortage', value: capacityShortage, icon: 'Gauge', trend: capacityShortage > 0 ? 'Additional sites needed' : 'No shortage at current scenario', tone: capacityShortage > 0 ? 'danger' : 'good' },
    { id: 'moderaterisk', label: 'Moderate Risk Habitations', value: moderateRiskCount, icon: 'AlertCircle', trend: `of ${habitations.length} tracked`, tone: 'warning' },
  ]
}

/** Per-hazard rollup for the Dashboard's "Hazard Overview" section — strictly the four approved hazards. */
export function computeHazardOverview(scenario) {
  const withRisk = habitations.map((h) => ({ ...h, risk: computeHabitationRisk(h, scenario) }))
  return HAZARD_TYPES.map((hazard) => {
    const affected = withRisk.filter((h) => h.hazards.includes(hazard.id))
    const highRisk = affected.filter((h) => h.risk.status === REDZONE_STATUS.CRITICAL || h.risk.status === REDZONE_STATUS.HIGH_RISK)
    const zones = hazardZones.filter((z) => z.type === hazard.id)
    const avgConfidence = zones.length ? Math.round(zones.reduce((s, z) => s + z.confidence, 0) / zones.length) : 0
    const worstZone = [...zones].sort((a, b) => (b.severity === 'critical' ? 1 : 0) - (a.severity === 'critical' ? 1 : 0))[0]
    return {
      ...hazard,
      affectedCount: affected.length,
      highRiskCount: highRisk.length,
      severity: worstZone?.severity || 'low',
      confidence: avgConfidence,
      lastUpdated: worstZone?.lastUpdated || '—',
    }
  })
}

/**
 * Compact, action-oriented Overview metrics — replaces the older 8-card
 * dashboardMetrics set. Every number answers "what needs attention now" and
 * links to the page that lets someone act on it (wired in Dashboard.jsx).
 */
export function computeOverviewMetrics({ scenario, operations, coordinators, volunteers, providers, capacitiesById }) {
  const withRisk = habitations.map((h) => ({ ...h, risk: computeHabitationRisk(h, scenario) }))
  const list = operationsList(operations)

  const activeRedZoneCount = withRisk.filter((h) => h.risk.redZone).length

  const needsAttention = withRisk.filter((h) => h.risk.status === REDZONE_STATUS.CRITICAL || h.risk.status === REDZONE_STATUS.HIGH_RISK)
  const unassignedCount = needsAttention.filter((h) => !operations[h.id]).length

  const IN_PROGRESS_STATUSES = [OPERATION_STATUS.PLANNING, OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING, OPERATION_STATUS.TEAM_ASSIGNED]
  const routesInProgressCount = list.filter((o) => o.routeId && IN_PROGRESS_STATUSES.includes(o.status)).length
  const coordinatorsAvailableCount = coordinators.filter((c) => isCoordinatorAvailable(c, operations)).length
  const volunteersAvailableCount = volunteers.filter((v) => isVolunteerAvailable(v, operations)).length
  const verifiedInfrastructureCount = providers.filter(
    (p) => p.verificationStatus === VERIFICATION_STATUS.VERIFIED && availabilityStatus(capacitiesById[p.id]) === AVAILABILITY_STATUS.AVAILABLE
  ).length

  const CLOSED_STATUSES = [OPERATION_STATUS.OPERATION_CLOSED, OPERATION_STATUS.OPERATION_CANCELLED, OPERATION_STATUS.OPERATION_FAILED, OPERATION_STATUS.RELOCATION_COMPLETED]
  const criticalById = new Set(withRisk.filter((h) => h.risk.status === REDZONE_STATUS.CRITICAL).map((h) => h.id))
  const criticalPendingCount = list.filter((o) => criticalById.has(o.habitationId) && !CLOSED_STATUSES.includes(o.status)).length
  const recentlyAssignedCount = list.filter((o) => !!o.coordinatorId).length

  return [
    { id: 'redzones', label: 'Active Red-Zone Habitations', value: activeRedZoneCount, icon: 'ShieldAlert', trend: `of ${habitations.length} tracked`, tone: 'danger' },
    { id: 'unassigned', label: 'Unassigned Habitations', value: unassignedCount, icon: 'AlertTriangle', trend: 'High risk or above, no operation started', tone: unassignedCount > 0 ? 'warning' : 'good' },
    { id: 'routesinprogress', label: 'Routes In Progress', value: routesInProgressCount, icon: 'Route', trend: 'Route generated, operation not yet active', tone: 'default' },
    { id: 'coordinatorsavailable', label: 'Coordinators Available', value: coordinatorsAvailableCount, icon: 'UserCog', trend: `of ${coordinators.length} on roster`, tone: coordinatorsAvailableCount > 0 ? 'good' : 'danger' },
    { id: 'volunteersavailable', label: 'Volunteers Available', value: volunteersAvailableCount, icon: 'Users', trend: `of ${volunteers.length} on roster`, tone: volunteersAvailableCount > 0 ? 'good' : 'danger' },
    { id: 'verifiedinfrastructure', label: 'Verified Infrastructure Available', value: verifiedInfrastructureCount, icon: 'Building2', trend: 'Verified + capacity available', tone: 'good' },
    { id: 'criticalpending', label: 'Critical Pending Operations', value: criticalPendingCount, icon: 'ShieldAlert', trend: 'Critical Red Zone, not yet closed', tone: criticalPendingCount > 0 ? 'danger' : 'good' },
    { id: 'recentlyassigned', label: 'Recently Assigned Operations', value: recentlyAssignedCount, icon: 'ClipboardList', trend: 'Coordinator assigned or further', tone: 'default' },
  ]
}

/**
 * Emergency Coordinator's four Overview KPIs — "people to evacuate",
 * "evacuation progress", "safe capacity available" and "active alerts" as
 * asked for by the EOC brief, all derived live from the same underlying
 * datasets/operations every other page reads (never a separate stored number
 * that could drift).
 */
export function computeCoordinatorKPIs({ scenario, operations, alerts = [] }) {
  const withRisk = habitations.map((h) => ({ ...h, risk: computeHabitationRisk(h, scenario) }))
  const needingEvac = withRisk.filter((h) => h.risk.status === REDZONE_STATUS.CRITICAL || h.risk.status === REDZONE_STATUS.HIGH_RISK)
  const peopleToEvacuate = needingEvac.reduce((sum, h) => sum + h.population, 0)

  const list = operationsList(operations)
  const relocatedTotal = list.reduce((sum, o) => sum + (o.relocatedCount || 0), 0)
  const requiringTotal = list.reduce((sum, o) => sum + (o.populationRequiring || 0), 0)
  const evacuationProgressPct = requiringTotal > 0 ? Math.round((relocatedTotal / requiringTotal) * 100) : 0

  const safeCapacityAvailable = safeSites.reduce((sum, s) => sum + computeAvailableCapacity(s), 0)
  const criticalAlertCount = alerts.filter((a) => a.severity === 'critical').length

  return [
    {
      id: 'evacuate',
      label: 'People To Evacuate',
      value: peopleToEvacuate,
      icon: 'UsersRound',
      trend: `${needingEvac.length} habitation${needingEvac.length === 1 ? '' : 's'} at High Risk or above`,
      tone: peopleToEvacuate > 0 ? 'danger' : 'good',
    },
    {
      id: 'progress',
      label: 'Evacuation Progress (%)',
      value: evacuationProgressPct,
      icon: 'TrendingUp',
      trend: requiringTotal > 0 ? `${relocatedTotal.toLocaleString()} / ${requiringTotal.toLocaleString()} relocated` : 'No relocation operation started yet',
      tone: 'default',
    },
    {
      id: 'safecapacity',
      label: 'Safe Capacity Available',
      value: safeCapacityAvailable,
      icon: 'ShieldCheck',
      trend: `Across ${safeSites.length} tracked safe sites`,
      tone: 'good',
    },
    {
      id: 'activealerts',
      label: 'Active Alerts',
      value: alerts.length,
      icon: 'Bell',
      trend: criticalAlertCount > 0 ? `${criticalAlertCount} critical` : 'None critical',
      tone: criticalAlertCount > 0 ? 'danger' : alerts.length > 0 ? 'warning' : 'good',
    },
  ]
}

/**
 * Single-word EOC header status — Active / Monitoring / Completed — derived
 * from current operation records so the persistent header never claims a
 * status the underlying operations data doesn't back up.
 */
export function computeOperationalStatusLabel(operations) {
  const list = operationsList(operations)
  if (list.length === 0) return 'Monitoring'
  const ACTIVE_STATUSES = [OPERATION_STATUS.OPERATION_ACTIVE, OPERATION_STATUS.PARTIALLY_RELOCATED]
  if (list.some((o) => ACTIVE_STATUSES.includes(o.status))) return 'Active'
  const CLOSED_STATUSES = [OPERATION_STATUS.OPERATION_CLOSED, OPERATION_STATUS.OPERATION_CANCELLED, OPERATION_STATUS.OPERATION_FAILED, OPERATION_STATUS.RELOCATION_COMPLETED]
  if (list.every((o) => CLOSED_STATUSES.includes(o.status))) return 'Completed'
  return 'Monitoring'
}

export const currentEvent = {
  name: 'Monsoon Advisory — Flood, Landslide & Cloudburst',
  severity: 'HIGH',
  region: 'Coastal & Eastern Districts',
  updated: '18 minutes ago',
}

export const shelters = [
  { id: 'sh-1', name: 'Community Relief Center', position: { lat: 12.902, lng: 80.192 }, type: 'shelter' },
  { id: 'sh-2', name: 'Riverside Relief Zone', position: { lat: 12.995, lng: 80.235 }, type: 'shelter' },
  { id: 'sh-3', name: 'Lakeview Shelter Complex', position: { lat: 12.98, lng: 80.245 }, type: 'shelter' },
]

export const hospitals = [
  { id: 'hp-1', name: 'District General Hospital', position: { lat: 12.92, lng: 80.225 }, type: 'hospital' },
  { id: 'hp-2', name: 'Community Health Center', position: { lat: 12.895, lng: 80.13 }, type: 'hospital' },
]

export const schools = [
  { id: 'sc-1', name: 'Govt. Higher Secondary School', position: { lat: 12.842, lng: 80.24 }, type: 'school' },
  { id: 'sc-2', name: 'Northern Public School', position: { lat: 13.05, lng: 80.21 }, type: 'school' },
]
