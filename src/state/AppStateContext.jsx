import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { habitations, getHabitation } from '../data/habitations'
import { safeSites } from '../data/safeSites'
import { institutions } from '../data/institutions'
import { seedAuditEvents } from '../data/auditEvents'
import { getRelocationMatches } from '../data/relocationMatches'
import { coordinators } from '../data/coordinators'
import { volunteers } from '../data/volunteers'
import { seedVolunteerTasks, TASK_STATUS, TASK_TYPE, makeTaskId } from '../data/volunteerTasks'
import { computeHabitationRisk, computeStatusChange, DEFAULT_SCENARIO, isDefaultScenario } from '../utils/riskCalculations'
import { getOperationForHabitation as findOperationForHabitation } from '../utils/assignmentCalculations'
import { readJSON, writeJSON } from '../utils/storage'
import { AUDIT_EVENT_TYPE, ALERT_SEVERITY, ALERT_STATUS, OPERATION_STATUS, NOTIFICATION_STATE, ROUTE_STATUS } from '../types/geosentra'

// Centralized frontend-only state: this is what lets "selecting a habitation"
// or "moving a What-If slider" affect every page instead of being isolated
// per-page local state. Nothing here ever leaves the browser tab — there is no
// backend call anywhere in this file. Refreshing the page resets everything
// except the theme (handled separately by ThemeContext) and the operation
// lifecycle (handled below — persisted like the provider store, so an
// in-progress operation survives a refresh).
const AppStateContext = createContext(null)
const OPERATIONS_STORAGE_KEY = 'geosentra_operations'
const CITIZEN_REPORTS_STORAGE_KEY = 'geosentra_citizen_reports'
const VOLUNTEER_TASKS_STORAGE_KEY = 'geosentra_volunteer_tasks'
const VOLUNTEER_INCIDENTS_STORAGE_KEY = 'geosentra_volunteer_incidents'
const VOLUNTEER_SOS_STORAGE_KEY = 'geosentra_volunteer_sos'
const TEAM_MESSAGES_STORAGE_KEY = 'geosentra_team_messages'

let auditIdCounter = 0
function makeAuditId() {
  auditIdCounter += 1
  return `evt-${Date.now()}-${auditIdCounter}`
}

let reportIdCounter = 0
function makeReportId() {
  reportIdCounter += 1
  return `report-${Date.now()}-${reportIdCounter}`
}

let incidentIdCounter = 0
function makeIncidentId() {
  incidentIdCounter += 1
  return `incident-${Date.now()}-${incidentIdCounter}`
}

let sosIdCounter = 0
function makeSOSId() {
  sosIdCounter += 1
  return `sos-${Date.now()}-${sosIdCounter}`
}

let messageIdCounter = 0
function makeMessageId() {
  messageIdCounter += 1
  return `msg-${Date.now()}-${messageIdCounter}`
}

let timelineIdCounter = 0
function makeTimelineId() {
  timelineIdCounter += 1
  return `tl-${Date.now()}-${timelineIdCounter}`
}

// Seed demo Coordinator -> Volunteer messages so the Team Communication panel
// isn't empty on first load. Clearly labeled "Demo communication" everywhere
// it renders — there is no real messaging backend.
function seedTeamMessages() {
  const messages = {}
  seedVolunteerTasks.forEach((t) => {
    if (t.status === TASK_STATUS.IN_PROGRESS || t.status === TASK_STATUS.ASSIGNED) {
      messages[t.id] = [
        { id: makeMessageId(), sender: 'Coordinator', time: new Date().toISOString(), message: `Please confirm status for ${t.title} when you get a chance.`, type: 'task-update' },
      ]
    }
  })
  return messages
}

function timestampNow() {
  const d = new Date()
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' — ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function AppStateProvider({ children }) {
  const [selectedHabitationId, setSelectedHabitationIdRaw] = useState('kovalam-east')
  // Defaults to the best-match safe site for the default habitation, so Route
  // Intelligence's default origin/destination pair is a real, sensible trip
  // instead of an arbitrary habitation paired with an unrelated shelter.
  const [selectedSiteId, setSelectedSiteIdRaw] = useState(() => getRelocationMatches(getHabitation('kovalam-east'))[0].siteId)
  const [selectedInstitutionId, setSelectedInstitutionIdRaw] = useState(institutions[0].id)
  const [routeOriginOverride, setRouteOriginOverride] = useState(null) // { kind: 'institution', id } — lets Institution pages drive Route Intelligence's origin
  // One-shot origin/destination override for arbitrary named points that aren't
  // in the local habitations/safeSites arrays (e.g. a national relocation
  // record). Shape: { origin: {id,name,lat,lng}, destination: {id,name,lat,lng} }.
  // Route Intelligence reads this on mount and immediately clears it, so it
  // never shadows the normal habitation/site-based origin resolution afterwards.
  const [customRoute, setCustomRoute] = useState(null)
  const [profileId, setProfileIdRaw] = useState('school-child')
  const [scenario, setScenarioRaw] = useState(DEFAULT_SCENARIO)
  const [allocations, setAllocations] = useState({}) // { [habitationId]: { [siteId]: amount } }
  const [auditEvents, setAuditEvents] = useState(seedAuditEvents)
  const [readAlertIds, setReadAlertIds] = useState(() => new Set())
  // Alert lifecycle status — "Active" is the implicit default for any alert
  // id with no entry here (see ALERT_STATUS.ACTIVE), same "no record IS the
  // initial state" convention `operations` uses below. Frontend-only demo
  // state; acknowledging/resolving an alert never contacts a real backend.
  const [alertStatuses, setAlertStatuses] = useState({})
  // Institution readiness-checklist items resolved through the Coordinator's
  // "Assign Transport" / "Resolve Blocker" actions — keyed by institution id,
  // then checklist index. Institutions.js itself stays static/read-only; this
  // overlay is exactly the same pattern `allocations` uses for safe sites.
  const [institutionChecklistOverrides, setInstitutionChecklistOverrides] = useState({})
  // Resource Network "assign to operation" is a simulated frontend action only
  // — it never changes a real provider's reported capacity. Keyed by a
  // synthetic id so Resource Network can show "already assigned" state.
  const [resourceAssignments, setResourceAssignments] = useState([])
  // Operations — the shared habitation -> safe site -> infrastructure ->
  // rescue team -> route -> validation -> assignment -> acceptance -> active
  // -> completion lifecycle. Keyed by habitationId. "No record" IS the Yet to
  // Plan Rescue status (see utils/assignmentCalculations.js).
  const [operations, setOperations] = useState(() => readJSON(OPERATIONS_STORAGE_KEY, {}))
  useEffect(() => writeJSON(OPERATIONS_STORAGE_KEY, operations), [operations])

  // Citizen "Report an Issue" submissions — frontend-only demo state, never
  // sent anywhere. Persisted the same way as operations/provider data.
  const [citizenReports, setCitizenReports] = useState(() => readJSON(CITIZEN_REPORTS_STORAGE_KEY, []))
  useEffect(() => writeJSON(CITIZEN_REPORTS_STORAGE_KEY, citizenReports), [citizenReports])

  const reportIssue = useCallback((payload) => {
    const report = {
      id: makeReportId(),
      issueType: payload.issueType,
      location: payload.location,
      description: payload.description,
      severity: payload.severity || null,
      status: 'Submitted in demo',
      createdAt: new Date().toISOString(),
    }
    setCitizenReports((prev) => [report, ...prev])
    return report
  }, [])

  // Volunteer task workspace — a separate, per-volunteer work-item lifecycle
  // from `operations` above (that models the district-level Authority/
  // Coordinator relocation pipeline; this models one volunteer's individual
  // ALERT -> TASK -> CHECK-IN -> PROGRESS -> COMPLETION workflow). Additive
  // only: no existing state/action here is touched.
  const [volunteerTasks, setVolunteerTasks] = useState(() => readJSON(VOLUNTEER_TASKS_STORAGE_KEY, seedVolunteerTasks))
  useEffect(() => writeJSON(VOLUNTEER_TASKS_STORAGE_KEY, volunteerTasks), [volunteerTasks])

  const [volunteerIncidents, setVolunteerIncidents] = useState(() => readJSON(VOLUNTEER_INCIDENTS_STORAGE_KEY, []))
  useEffect(() => writeJSON(VOLUNTEER_INCIDENTS_STORAGE_KEY, volunteerIncidents), [volunteerIncidents])

  const [volunteerSOSRequests, setVolunteerSOSRequests] = useState(() => readJSON(VOLUNTEER_SOS_STORAGE_KEY, []))
  useEffect(() => writeJSON(VOLUNTEER_SOS_STORAGE_KEY, volunteerSOSRequests), [volunteerSOSRequests])

  const [teamMessages, setTeamMessages] = useState(() => readJSON(TEAM_MESSAGES_STORAGE_KEY, seedTeamMessages))
  useEffect(() => writeJSON(TEAM_MESSAGES_STORAGE_KEY, teamMessages), [teamMessages])

  const pushTaskTimeline = useCallback((taskId, label) => {
    setVolunteerTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, timeline: [...(t.timeline || []), { id: makeTimelineId(), label, timestamp: new Date().toISOString() }] } : t)))
  }, [])

  const acceptTask = useCallback(
    (taskId) => {
      setVolunteerTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: TASK_STATUS.ACCEPTED } : t)))
      pushTaskTimeline(taskId, 'Task accepted')
    },
    [pushTaskTimeline]
  )

  const rejectTask = useCallback(
    (taskId, reason) => {
      setVolunteerTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: TASK_STATUS.REJECTED, rejectionReason: reason || 'Other' } : t)))
      pushTaskTimeline(taskId, `Task rejected — ${reason || 'Other'}`)
    },
    [pushTaskTimeline]
  )

  const requestReassignment = useCallback(
    (taskId, reason) => {
      setVolunteerTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: TASK_STATUS.REASSIGNED, rejectionReason: reason || 'Other' } : t)))
      pushTaskTimeline(taskId, `Reassignment requested — ${reason || 'Other'} (demo — no coordinator was actually notified)`)
    },
    [pushTaskTimeline]
  )

  const checkInTask = useCallback(
    (taskId) => {
      setVolunteerTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, checkIn: { checkedIn: true, checkedInAt: new Date().toISOString() }, status: TASK_STATUS.WAITING_FOR_CHECKIN } : t)))
      pushTaskTimeline(taskId, 'Arrived at location')
      pushTaskTimeline(taskId, 'Checked in (recorded in demo mode)')
    },
    [pushTaskTimeline]
  )

  const startTaskAction = useCallback(
    (taskId) => {
      setVolunteerTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: TASK_STATUS.IN_PROGRESS } : t)))
      pushTaskTimeline(taskId, 'Action started')
    },
    [pushTaskTimeline]
  )

  // Clamps: non-negative, and evacuated+inTransit+remaining never exceeds the
  // task's total affected people — enforced here as the final guard even
  // though the form also validates before calling this.
  const updateTaskProgress = useCallback(
    (taskId, patch) => {
      setVolunteerTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t
          const total = t.affectedPeople || 0
          const clampField = (v) => Math.max(0, Math.min(Number(v) || 0, total))
          const evacuated = clampField(patch.evacuated)
          const inTransit = clampField(patch.inTransit)
          let remaining = clampField(patch.remaining)
          if (evacuated + inTransit + remaining > total) remaining = Math.max(0, total - evacuated - inTransit)
          const unverified = Math.max(0, Number(patch.unverified) || 0)
          const nextStatus = evacuated > 0 && evacuated < total ? TASK_STATUS.PARTIALLY_COMPLETED : t.status
          return { ...t, status: nextStatus, progress: { evacuated, inTransit, remaining, unverified, notes: patch.notes || '' } }
        })
      )
      pushTaskTimeline(taskId, `Progress updated — ${patch.evacuated || 0} evacuated, ${patch.inTransit || 0} in transit, ${patch.remaining || 0} remaining`)
    },
    [pushTaskTimeline]
  )

  const completeTask = useCallback(
    (taskId, completionForm) => {
      setVolunteerTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: TASK_STATUS.UNDER_VERIFICATION, completion: completionForm } : t)))
      pushTaskTimeline(
        taskId,
        `Task marked completed in demo mode — ${completionForm.peopleAssisted || 0} people assisted, ${completionForm.incidentsEncountered || 0} incident(s) reported`
      )
    },
    [pushTaskTimeline]
  )

  const checkOutTask = useCallback(
    (taskId) => {
      setVolunteerTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, checkedOut: true } : t)))
      pushTaskTimeline(taskId, 'Checked out')
    },
    [pushTaskTimeline]
  )

  const createVerificationTask = useCallback((habitationId, note) => {
    const habitation = getHabitation(habitationId)
    const task = {
      id: makeTaskId(),
      title: `Verify Unverified Residents — ${habitation?.name || habitationId}`,
      type: TASK_TYPE.VERIFICATION,
      priority: 'medium',
      hazard: habitation?.primaryHazard || null,
      habitationId,
      destinationSiteId: null,
      affectedPeople: 0,
      status: TASK_STATUS.ASSIGNED,
      assignedVolunteerId: 'vol-priya',
      requiredSkills: ['Logistics'],
      estimatedDurationMin: 40,
      assignedResources: [],
      objective: note || `Verify status of unverified residents in ${habitation?.name || habitationId}.`,
      instructions: 'Confirm each person/group’s status and mark verified once confirmed.',
      progress: { evacuated: 0, inTransit: 0, remaining: 0, unverified: 0, notes: '' },
      checkIn: { checkedIn: false, checkedInAt: null },
      checkedOut: false,
      timeline: [{ id: makeTimelineId(), label: 'Verification task created (demo assignment)', timestamp: new Date().toISOString() }],
      rejectionReason: null,
      demoOnly: true,
    }
    setVolunteerTasks((prev) => [task, ...prev])
    return task
  }, [])

  const reportVolunteerIncident = useCallback((payload) => {
    const incident = {
      id: makeIncidentId(),
      incidentType: payload.incidentType,
      location: payload.location,
      description: payload.description,
      severity: payload.severity || null,
      peopleAffected: payload.peopleAffected || null,
      relatedTaskId: payload.relatedTaskId || null,
      immediateAssistanceRequired: !!payload.immediateAssistanceRequired,
      status: 'Submitted in demo',
      createdAt: new Date().toISOString(),
    }
    setVolunteerIncidents((prev) => [incident, ...prev])
    return incident
  }, [])

  const sendVolunteerSOS = useCallback((payload) => {
    const sos = {
      id: makeSOSId(),
      emergencyType: payload.emergencyType,
      relatedTaskId: payload.relatedTaskId || null,
      area: payload.area || null,
      description: payload.description || '',
      immediateAssistanceRequired: !!payload.immediateAssistanceRequired,
      status: 'Recorded in demo mode',
      createdAt: new Date().toISOString(),
    }
    setVolunteerSOSRequests((prev) => [sos, ...prev])
    return sos
  }, [])

  const sendTeamMessage = useCallback((taskId, payload) => {
    const message = { id: makeMessageId(), sender: 'You (Volunteer)', time: new Date().toISOString(), message: payload.message, type: payload.type || 'progress-update' }
    setTeamMessages((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), message] }))
    return message
  }, [])

  const addAuditEvent = useCallback((event) => {
    setAuditEvents((prev) => [{ id: makeAuditId(), timestamp: timestampNow(), severity: ALERT_SEVERITY.INFO, ...event }, ...prev])
  }, [])

  const selectHabitation = useCallback((id) => {
    setSelectedHabitationIdRaw(id)
  }, [])
  const selectSite = useCallback((id) => setSelectedSiteIdRaw(id), [])
  const selectInstitution = useCallback((id) => setSelectedInstitutionIdRaw(id), [])
  const setProfileId = useCallback(
    (id) => {
      setProfileIdRaw((prev) => {
        if (prev !== id) {
          addAuditEvent({ type: AUDIT_EVENT_TYPE.PROFILE_CHANGED, relatedId: null, previousValue: prev, newValue: id, reason: 'Traveller profile changed in Route Intelligence.' })
        }
        return id
      })
    },
    [addAuditEvent]
  )

  // Recompute every habitation's risk under the CURRENT scenario. This is the
  // single call every page uses instead of reading a static riskScore field.
  const habitationsWithRisk = useMemo(
    () => habitations.map((h) => ({ ...h, risk: computeHabitationRisk(h, scenario) })),
    [scenario]
  )
  const getHabitationWithRisk = useCallback((id) => habitationsWithRisk.find((h) => h.id === id), [habitationsWithRisk])

  // Sliders fire onChange continuously while dragging. The scenario itself
  // updates on every tick (so every page stays live/reactive), but auditing
  // and status-change diffing is debounced against the value from BEFORE the
  // current drag gesture — otherwise a single slider drag would spam the
  // audit trail and alerts with dozens of near-duplicate entries.
  const diffBaseRef = useRef(null)
  const diffTimerRef = useRef(null)

  const setScenario = useCallback(
    (patch) => {
      setScenarioRaw((prev) => {
        const next = { ...prev, ...patch }
        if (diffBaseRef.current === null) diffBaseRef.current = prev

        if (diffTimerRef.current) clearTimeout(diffTimerRef.current)
        diffTimerRef.current = setTimeout(() => {
          const base = diffBaseRef.current
          diffBaseRef.current = null
          habitations.forEach((h) => {
            const before = computeHabitationRisk(h, base).status
            const after = computeHabitationRisk(h, next).status
            if (before !== after) {
              addAuditEvent({
                type: AUDIT_EVENT_TYPE.STATUS_CHANGE,
                relatedId: h.id,
                previousValue: before,
                newValue: after,
                reason: 'What-If scenario adjustment changed the computed risk score.',
                severity: after === 'Critical Red Zone' ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
                actor: 'System — Scenario Engine (mock)',
              })
            }
          })
          addAuditEvent({ type: AUDIT_EVENT_TYPE.SCENARIO_APPLIED, relatedId: null, previousValue: null, newValue: JSON.stringify(next), reason: 'What-If scenario input changed.', actor: 'A. Bose — Emergency Coordinator' })
        }, 500)

        return next
      })
    },
    [addAuditEvent]
  )

  const resetScenario = useCallback(() => {
    setScenarioRaw(DEFAULT_SCENARIO)
    addAuditEvent({ type: AUDIT_EVENT_TYPE.SCENARIO_RESET, relatedId: null, previousValue: null, newValue: null, reason: 'Scenario reset to baseline conditions.', actor: 'A. Bose — Emergency Coordinator' })
  }, [addAuditEvent])

  const setAllocation = useCallback(
    (habitationId, siteId, amount) => {
      setAllocations((prev) => {
        const habAllocs = { ...(prev[habitationId] || {}) }
        const previousAmount = habAllocs[siteId] || 0
        habAllocs[siteId] = Math.max(0, amount)
        if (previousAmount !== habAllocs[siteId]) {
          addAuditEvent({
            type: AUDIT_EVENT_TYPE.ALLOCATION_CHANGED,
            relatedId: siteId,
            previousValue: `${previousAmount.toLocaleString()} allocated`,
            newValue: `${habAllocs[siteId].toLocaleString()} allocated`,
            reason: `Relocation allocation updated for ${getHabitation(habitationId)?.name || habitationId}.`,
            actor: 'R. Iyer — District Disaster Officer',
          })
        }
        return { ...prev, [habitationId]: habAllocs }
      })
    },
    [addAuditEvent]
  )

  const getAllocationsFor = useCallback((habitationId) => allocations[habitationId] || {}, [allocations])

  const markAlertRead = useCallback((id) => setReadAlertIds((prev) => new Set(prev).add(id)), [])

  const getAlertStatus = useCallback((id) => alertStatuses[id] || ALERT_STATUS.ACTIVE, [alertStatuses])

  const setAlertStatusTo = useCallback(
    (id, status, auditType, alertLabel) => {
      setAlertStatuses((prev) => ({ ...prev, [id]: status }))
      addAuditEvent({ type: auditType, relatedId: id, previousValue: null, newValue: status, reason: `${alertLabel || 'Alert'} marked ${status.toLowerCase()} in demo mode — no real notification or backend ticket was created.` })
    },
    [addAuditEvent]
  )
  const acknowledgeAlert = useCallback((id, alertLabel) => setAlertStatusTo(id, ALERT_STATUS.ACKNOWLEDGED, AUDIT_EVENT_TYPE.ALERT_ACKNOWLEDGED, alertLabel), [setAlertStatusTo])
  const resolveAlert = useCallback((id, alertLabel) => setAlertStatusTo(id, ALERT_STATUS.RESOLVED, AUDIT_EVENT_TYPE.ALERT_RESOLVED, alertLabel), [setAlertStatusTo])
  const dismissAlert = useCallback((id, alertLabel) => setAlertStatusTo(id, ALERT_STATUS.DISMISSED, AUDIT_EVENT_TYPE.ALERT_DISMISSED, alertLabel), [setAlertStatusTo])

  // Marks one readiness-checklist item done for an institution — used by both
  // "Resolve Blocker" and "Assign Transport" (the caller decides which
  // checklist index that action targets). Demo-only: no real transport
  // provider or vendor is contacted.
  const resolveInstitutionChecklistItem = useCallback(
    (institutionId, index, itemLabel) => {
      setInstitutionChecklistOverrides((prev) => ({ ...prev, [institutionId]: { ...(prev[institutionId] || {}), [index]: true } }))
      addAuditEvent({
        type: itemLabel && itemLabel.toLowerCase().includes('transport') ? AUDIT_EVENT_TYPE.TRANSPORT_ASSIGNED : AUDIT_EVENT_TYPE.INSTITUTION_BLOCKER_RESOLVED,
        relatedId: institutionId,
        previousValue: 'Pending',
        newValue: 'Confirmed',
        reason: `${itemLabel || 'Readiness item'} marked resolved in demo mode.`,
      })
    },
    [addAuditEvent]
  )

  // Simulated resource-to-operation assignment from Resource Network — never
  // claims a real provider was notified or that capacity actually moved.
  const assignResourceToOperation = useCallback(
    (providerId, providerName, habitationId, habitationName) => {
      const assignment = { id: `assign-${providerId}-${habitationId}-${Date.now()}`, providerId, habitationId, createdAt: new Date().toISOString() }
      setResourceAssignments((prev) => [assignment, ...prev])
      addAuditEvent({
        type: AUDIT_EVENT_TYPE.RESOURCE_ASSIGNED,
        relatedId: habitationId,
        previousValue: null,
        newValue: providerName,
        reason: `${providerName} assigned to support ${habitationName || habitationId} in demo mode — no real provider was notified.`,
      })
      return assignment
    },
    [addAuditEvent]
  )

  // Coordinator-only simulated destination change for an ACTIVE operation
  // (distinct from the Disaster Authority's raw allocation editor in
  // Relocation.jsx) — always permission/capacity-checked by the caller before
  // this is invoked; this just records the change.
  const changeOperationDestination = useCallback(
    (habitationId, newSiteId, newSiteName, previousSiteName) => {
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], safeSiteId: newSiteId, updatedAt: new Date().toISOString() } }))
      addAuditEvent({
        type: AUDIT_EVENT_TYPE.DESTINATION_CHANGED,
        relatedId: habitationId,
        previousValue: previousSiteName || 'None',
        newValue: newSiteName,
        reason: `Evacuation destination changed to ${newSiteName} (simulated permission-controlled change — no real transport system was updated).`,
      })
    },
    [addAuditEvent]
  )

  // Creates a Planning-status operation for a habitation if one doesn't
  // already exist — called when the user clicks "Plan Relocation" so every
  // later step in the guided workflow has somewhere to write to.
  const ensurePlanning = useCallback(
    (habitationId) => {
      if (operations[habitationId]) return
      const now = new Date().toISOString()
      const habitation = getHabitation(habitationId)
      setOperations((prev) => ({
        ...prev,
        [habitationId]: {
          id: `op-${habitationId}`,
          habitationId,
          safeSiteId: null,
          infrastructureId: null,
          coordinatorId: null,
          volunteerIds: [],
          routeId: null,
          status: OPERATION_STATUS.PLANNING,
          populationRequiring: habitation?.population || 0,
          relocatedCount: 0,
          notificationState: null,
          routeStatus: null,
          rejectionReason: null,
          createdAt: now,
          updatedAt: now,
        },
      }))
      addAuditEvent({
        type: AUDIT_EVENT_TYPE.PLANNING_STARTED,
        relatedId: habitationId,
        previousValue: OPERATION_STATUS.YET_TO_PLAN_RESCUE,
        newValue: OPERATION_STATUS.PLANNING,
        reason: `Relocation planning started for ${habitation?.name || habitationId}.`,
      })
    },
    [operations, addAuditEvent]
  )

  // Step-by-step field writes (safe site / infrastructure / rescue team /
  // volunteers / route) that do NOT change the operation's status — all of
  // those steps share the single PLANNING status. Each field still logs its
  // own audit event so the Audit Trail reflects real workflow progress.
  const updateOperationField = useCallback(
    (habitationId, patch) => {
      const existing = operations[habitationId]
      if (!existing) return
      const now = new Date().toISOString()
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], ...patch, updatedAt: now } }))
      const habitation = getHabitation(habitationId)
      if ('safeSiteId' in patch) {
        const site = safeSites.find((s) => s.id === patch.safeSiteId)
        addAuditEvent({ type: AUDIT_EVENT_TYPE.SAFE_SITE_SELECTED, relatedId: habitationId, previousValue: null, newValue: site?.name || patch.safeSiteId, reason: `Safe Site selected for ${habitation?.name || habitationId}.` })
      }
      if ('infrastructureId' in patch) {
        addAuditEvent({ type: AUDIT_EVENT_TYPE.INFRASTRUCTURE_SELECTED, relatedId: habitationId, previousValue: null, newValue: patch.infrastructureId, reason: `Infrastructure selected for ${habitation?.name || habitationId}.` })
      }
      if ('coordinatorId' in patch) {
        const coordinator = coordinators.find((c) => c.id === patch.coordinatorId)
        addAuditEvent({ type: AUDIT_EVENT_TYPE.COORDINATOR_ASSIGNED, relatedId: habitationId, previousValue: null, newValue: coordinator?.name || patch.coordinatorId, reason: `${coordinator?.name || 'A rescue team'} selected for ${habitation?.name || habitationId}.` })
      }
      if ('volunteerIds' in patch) {
        addAuditEvent({ type: AUDIT_EVENT_TYPE.VOLUNTEERS_ASSIGNED, relatedId: habitationId, previousValue: null, newValue: `${(patch.volunteerIds || []).length} volunteer(s)`, reason: `Volunteers selected for ${habitation?.name || habitationId}.` })
      }
      if ('routeId' in patch) {
        addAuditEvent({ type: AUDIT_EVENT_TYPE.ROUTE_GENERATED, relatedId: habitationId, previousValue: null, newValue: patch.routeId, reason: `Route generated for ${habitation?.name || habitationId} (illustrative route data).` })
      }
    },
    [operations, addAuditEvent]
  )

  // Validation itself is pure/presentational (utils/assignmentCalculations.js)
  // and runs on the Validation page — this only fires once that page's
  // "Review and Validate Assignment" button is enabled and clicked.
  const createAssignment = useCallback(
    (habitationId) => {
      const existing = operations[habitationId]
      if (!existing) return
      const habitation = getHabitation(habitationId)
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING, notificationState: NOTIFICATION_STATE.SENT, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.VALIDATION_PASSED, relatedId: habitationId, previousValue: null, newValue: null, reason: `Pre-assignment validation passed for ${habitation?.name || habitationId}.` })
      addAuditEvent({ type: AUDIT_EVENT_TYPE.ASSIGNMENT_CREATED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING, reason: `Assignment created for ${habitation?.name || habitationId}.` })
      addAuditEvent({ type: AUDIT_EVENT_TYPE.NOTIFICATION_SENT, relatedId: habitationId, previousValue: null, newValue: NOTIFICATION_STATE.SENT, reason: 'Assignment notification sent to the assigned Emergency Coordinator (prototype notification state only — no real SMS/email/push).' })
    },
    [operations, addAuditEvent]
  )

  // One-shot equivalent of selecting a safe site / route / coordinator /
  // volunteers across several pages then validating — used by the
  // Relocation Planner's single-screen "Choose Site" flow (/app/routes/*),
  // where all of that happens in one confirmation instead of a multi-page
  // wizard. Applies the whole patch in one setOperations call (avoiding the
  // stale-closure problem of calling updateOperationField then
  // createAssignment back to back) and fires the same audit trail either
  // path would produce.
  const assignTeamToOperation = useCallback(
    (habitationId, { safeSiteId, routeId, coordinatorId, volunteerIds = [] }) => {
      const existing = operations[habitationId]
      if (!existing) return false
      const habitation = getHabitation(habitationId)
      const site = safeSites.find((s) => s.id === safeSiteId)
      const coordinator = coordinators.find((c) => c.id === coordinatorId)
      const now = new Date().toISOString()
      setOperations((prev) => ({
        ...prev,
        [habitationId]: {
          ...prev[habitationId],
          safeSiteId,
          routeId,
          coordinatorId,
          volunteerIds,
          status: OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING,
          notificationState: NOTIFICATION_STATE.SENT,
          updatedAt: now,
        },
      }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.SAFE_SITE_SELECTED, relatedId: habitationId, previousValue: null, newValue: site?.name || safeSiteId, reason: `Safe Site selected for ${habitation?.name || habitationId} via the Relocation Planner.` })
      addAuditEvent({ type: AUDIT_EVENT_TYPE.ROUTE_GENERATED, relatedId: habitationId, previousValue: null, newValue: routeId, reason: `Route selected for ${habitation?.name || habitationId} (illustrative route data).` })
      addAuditEvent({ type: AUDIT_EVENT_TYPE.COORDINATOR_ASSIGNED, relatedId: habitationId, previousValue: null, newValue: coordinator?.name || coordinatorId, reason: `${coordinator?.name || 'A rescue team'} selected for ${habitation?.name || habitationId}.` })
      if (volunteerIds.length > 0) {
        addAuditEvent({ type: AUDIT_EVENT_TYPE.VOLUNTEERS_ASSIGNED, relatedId: habitationId, previousValue: null, newValue: `${volunteerIds.length} volunteer(s)`, reason: `Volunteers selected for ${habitation?.name || habitationId}.` })
      }
      addAuditEvent({ type: AUDIT_EVENT_TYPE.ASSIGNMENT_CREATED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING, reason: `Assignment created for ${habitation?.name || habitationId} via the Relocation Planner.` })
      addAuditEvent({ type: AUDIT_EVENT_TYPE.NOTIFICATION_SENT, relatedId: habitationId, previousValue: null, newValue: NOTIFICATION_STATE.SENT, reason: 'Assignment notification sent to the assigned Emergency Coordinator (prototype notification state only — no real SMS/email/push).' })
      return true
    },
    [operations, addAuditEvent]
  )

  const acceptAssignment = useCallback(
    (habitationId) => {
      const existing = operations[habitationId]
      if (!existing) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.TEAM_ASSIGNED, notificationState: NOTIFICATION_STATE.ACCEPTED, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.ASSIGNMENT_ACCEPTED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.TEAM_ASSIGNED, reason: `Assignment accepted for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  const startOperation = useCallback(
    (habitationId) => {
      const existing = operations[habitationId]
      if (!existing) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.OPERATION_ACTIVE, routeStatus: ROUTE_STATUS.ACTIVE, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.OPERATION_STATUS_CHANGED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.OPERATION_ACTIVE, reason: `Operation marked active for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  const rejectAssignment = useCallback(
    (habitationId, reason) => {
      const existing = operations[habitationId]
      if (!existing) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.ASSIGNMENT_REJECTED, notificationState: NOTIFICATION_STATE.REJECTED, rejectionReason: reason || null, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.ASSIGNMENT_REJECTED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.ASSIGNMENT_REJECTED, reason: reason || `Assignment rejected for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  // Keeps the same operationId and preserves the habitation/site/
  // infrastructure/route history — only the coordinator and status change.
  const reassignOperation = useCallback(
    (habitationId, newCoordinatorId) => {
      const existing = operations[habitationId]
      if (!existing) return
      const previousCoordinator = coordinators.find((c) => c.id === existing.coordinatorId)
      const newCoordinator = coordinators.find((c) => c.id === newCoordinatorId)
      setOperations((prev) => ({
        ...prev,
        [habitationId]: { ...prev[habitationId], coordinatorId: newCoordinatorId, status: OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING, notificationState: NOTIFICATION_STATE.SENT, rejectionReason: null, updatedAt: new Date().toISOString() },
      }))
      addAuditEvent({
        type: AUDIT_EVENT_TYPE.COORDINATOR_REASSIGNED,
        relatedId: habitationId,
        previousValue: previousCoordinator?.name || existing.coordinatorId || 'None',
        newValue: newCoordinator?.name || newCoordinatorId,
        reason: `Rescue team reassigned for ${getHabitation(habitationId)?.name || habitationId}.`,
      })
    },
    [operations, addAuditEvent]
  )

  const markTeamUnavailable = useCallback(
    (habitationId) => {
      const existing = operations[habitationId]
      if (!existing) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.TEAM_UNAVAILABLE, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.OPERATION_STATUS_CHANGED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.TEAM_UNAVAILABLE, reason: `Assigned team marked unavailable for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  // Never auto-completes — reaching the full required count still requires
  // an explicit verifyCompletion() call, per the "don't close while people
  // remain / don't auto-close on arrival" rule.
  const updateRelocatedCount = useCallback(
    (habitationId, count) => {
      const existing = operations[habitationId]
      if (!existing) return
      const clamped = Math.max(0, Math.min(count, existing.populationRequiring))
      const nextStatus = clamped > 0 && clamped < existing.populationRequiring ? OPERATION_STATUS.PARTIALLY_RELOCATED : existing.status
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], relocatedCount: clamped, status: nextStatus, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.RELOCATED_COUNT_UPDATED, relatedId: habitationId, previousValue: `${existing.relocatedCount}`, newValue: `${clamped}`, reason: `People relocated count updated for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  const verifyCompletion = useCallback(
    (habitationId) => {
      const existing = operations[habitationId]
      if (!existing || existing.relocatedCount < existing.populationRequiring) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.RELOCATION_COMPLETED, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.OPERATION_COMPLETED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.RELOCATION_COMPLETED, reason: `Relocation completion verified for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  const closeOperation = useCallback(
    (habitationId) => {
      const existing = operations[habitationId]
      if (!existing) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.OPERATION_CLOSED, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.OPERATION_CLOSED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.OPERATION_CLOSED, reason: `Operation closed for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  // Deterministic, prototype-labeled route-status control — there is no real
  // routing engine (see utils/routing.js), so this simulates the failure/
  // reroute states the brief asks for rather than generating anything random.
  const setRouteStatus = useCallback(
    (habitationId, routeStatus, reason) => {
      const existing = operations[habitationId]
      if (!existing) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], routeStatus, updatedAt: new Date().toISOString() } }))
      addAuditEvent({
        type: routeStatus === ROUTE_STATUS.ALTERNATIVE_AVAILABLE ? AUDIT_EVENT_TYPE.ALTERNATIVE_ROUTE_SELECTED : AUDIT_EVENT_TYPE.ROUTE_BLOCKED,
        relatedId: habitationId,
        previousValue: existing.routeStatus,
        newValue: routeStatus,
        reason: reason || `Route status updated for ${getHabitation(habitationId)?.name || habitationId} (simulated route data — not a live routing engine).`,
        severity: routeStatus === ROUTE_STATUS.BLOCKED ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
      })
    },
    [operations, addAuditEvent]
  )

  const cancelOperation = useCallback(
    (habitationId, reason) => {
      const existing = operations[habitationId]
      if (!existing) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.OPERATION_CANCELLED, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.OPERATION_STATUS_CHANGED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.OPERATION_CANCELLED, reason: reason || `Operation cancelled for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  const failOperation = useCallback(
    (habitationId, reason) => {
      const existing = operations[habitationId]
      if (!existing) return
      setOperations((prev) => ({ ...prev, [habitationId]: { ...prev[habitationId], status: OPERATION_STATUS.OPERATION_FAILED, updatedAt: new Date().toISOString() } }))
      addAuditEvent({ type: AUDIT_EVENT_TYPE.OPERATION_STATUS_CHANGED, relatedId: habitationId, previousValue: existing.status, newValue: OPERATION_STATUS.OPERATION_FAILED, reason: reason || `Operation marked failed for ${getHabitation(habitationId)?.name || habitationId}.` })
    },
    [operations, addAuditEvent]
  )

  const getOperationForHabitation = useCallback((habitationId) => findOperationForHabitation(operations, habitationId), [operations])

  const value = useMemo(
    () => ({
      habitations: habitationsWithRisk,
      getHabitationWithRisk,
      safeSites,
      institutions,
      selectedHabitationId,
      selectHabitation,
      selectedSiteId,
      selectSite,
      selectedInstitutionId,
      selectInstitution,
      routeOriginOverride,
      setRouteOriginOverride,
      customRoute,
      setCustomRoute,
      profileId,
      setProfileId,
      scenario,
      setScenario,
      resetScenario,
      isScenarioDefault: isDefaultScenario(scenario),
      allocations,
      setAllocation,
      getAllocationsFor,
      auditEvents,
      addAuditEvent,
      readAlertIds,
      markAlertRead,
      alertStatuses,
      getAlertStatus,
      acknowledgeAlert,
      resolveAlert,
      dismissAlert,
      institutionChecklistOverrides,
      resolveInstitutionChecklistItem,
      resourceAssignments,
      assignResourceToOperation,
      changeOperationDestination,
      computeStatusChangeFor: (habitation) => computeStatusChange(habitation, scenario),
      operations,
      coordinators,
      volunteers,
      ensurePlanning,
      updateOperationField,
      createAssignment,
      assignTeamToOperation,
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
      getOperationForHabitation,
      citizenReports,
      reportIssue,
      volunteerTasks,
      acceptTask,
      rejectTask,
      requestReassignment,
      checkInTask,
      startTaskAction,
      updateTaskProgress,
      completeTask,
      checkOutTask,
      createVerificationTask,
      volunteerIncidents,
      reportVolunteerIncident,
      volunteerSOSRequests,
      sendVolunteerSOS,
      teamMessages,
      sendTeamMessage,
    }),
    [
      habitationsWithRisk,
      getHabitationWithRisk,
      selectedHabitationId,
      selectHabitation,
      selectedSiteId,
      selectSite,
      selectedInstitutionId,
      selectInstitution,
      routeOriginOverride,
      setRouteOriginOverride,
      customRoute,
      setCustomRoute,
      profileId,
      setProfileId,
      scenario,
      setScenario,
      resetScenario,
      allocations,
      setAllocation,
      getAllocationsFor,
      auditEvents,
      addAuditEvent,
      readAlertIds,
      markAlertRead,
      alertStatuses,
      getAlertStatus,
      acknowledgeAlert,
      resolveAlert,
      dismissAlert,
      institutionChecklistOverrides,
      resolveInstitutionChecklistItem,
      resourceAssignments,
      assignResourceToOperation,
      changeOperationDestination,
      operations,
      ensurePlanning,
      updateOperationField,
      createAssignment,
      assignTeamToOperation,
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
      getOperationForHabitation,
      citizenReports,
      reportIssue,
      volunteerTasks,
      acceptTask,
      rejectTask,
      requestReassignment,
      checkInTask,
      startTaskAction,
      updateTaskProgress,
      completeTask,
      checkOutTask,
      createVerificationTask,
      volunteerIncidents,
      reportVolunteerIncident,
      volunteerSOSRequests,
      sendVolunteerSOS,
      teamMessages,
      sendTeamMessage,
    ]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
