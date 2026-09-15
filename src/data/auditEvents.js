// Frontend prototype audit log — seed events only. Real events generated during
// the session (scenario applied, allocation changed, status changed, alert
// generated) are appended in-memory by state/AppStateContext.jsx and are lost
// on refresh, matching the "no backend, no persistence" constraint.
//
// This is explicitly a FRONTEND PROTOTYPE AUDIT LOG, not a real government
// audit/compliance system — see the disclosure rendered on the Audit Trail page.
import { AUDIT_EVENT_TYPE, ALERT_SEVERITY } from '../types/geosentra'

export const seedAuditEvents = [
  {
    id: 'seed-1',
    timestamp: '09 Sep 2026 — 18:42',
    type: AUDIT_EVENT_TYPE.RISK_CHANGE,
    relatedId: null,
    previousValue: null,
    newValue: null,
    reason: 'Combined risk scores recalculated for all monitored habitations.',
    severity: ALERT_SEVERITY.INFO,
    actor: 'System — Risk Engine (mock)',
  },
  {
    id: 'seed-2',
    timestamp: '09 Sep 2026 — 18:46',
    type: AUDIT_EVENT_TYPE.STATUS_CHANGE,
    relatedId: 'kovalam-east',
    previousValue: 'High Risk',
    newValue: 'Critical Red Zone',
    reason: 'Escalated due to rising flood depth and repeated historical incidents.',
    severity: ALERT_SEVERITY.CRITICAL,
    actor: 'System — Prioritization Engine (mock)',
  },
  {
    id: 'seed-3',
    timestamp: '09 Sep 2026 — 18:48',
    type: AUDIT_EVENT_TYPE.PLAN_CREATED,
    relatedId: 'kovalam-east',
    previousValue: null,
    newValue: 'Tambaram Emergency Shelter (94% match)',
    reason: 'Relocation matcher identified Tambaram Emergency Shelter as best match.',
    severity: ALERT_SEVERITY.INFO,
    actor: 'System — Relocation Matcher (mock)',
  },
  {
    id: 'seed-4',
    timestamp: '09 Sep 2026 — 18:52',
    type: AUDIT_EVENT_TYPE.ALLOCATION_CHANGED,
    relatedId: 'community-dev-zone',
    previousValue: '0 allocated',
    newValue: '1,000 allocated',
    reason: 'Phase 1 relocation approved pending transport arrangement.',
    severity: ALERT_SEVERITY.INFO,
    actor: 'R. Iyer — District Disaster Officer',
  },
  {
    id: 'seed-5',
    timestamp: '09 Sep 2026 — 18:55',
    type: AUDIT_EVENT_TYPE.ROUTE_CHANGED,
    relatedId: null,
    previousValue: 'Acceptable',
    newValue: 'Not recommended for children',
    reason: 'Route C flagged after water depth update on Lake Road Crossing.',
    severity: ALERT_SEVERITY.WARNING,
    actor: 'System — Route Intelligence (mock)',
  },
  {
    id: 'seed-6',
    timestamp: '09 Sep 2026 — 17:20',
    type: AUDIT_EVENT_TYPE.STATUS_CHANGE,
    relatedId: 'hillview-colony',
    previousValue: 'High Risk',
    newValue: 'Critical Red Zone',
    reason: 'Slope stability readings reported above the safe threshold.',
    severity: ALERT_SEVERITY.CRITICAL,
    actor: 'System — Prioritization Engine (mock)',
  },
  {
    id: 'seed-7',
    timestamp: '09 Sep 2026 — 14:30',
    type: AUDIT_EVENT_TYPE.PLAN_CREATED,
    relatedId: 'govt-hss',
    previousValue: '74% ready',
    newValue: '82% ready',
    reason: 'Institution evacuation checklist updated.',
    severity: ALERT_SEVERITY.INFO,
    actor: 'Government Higher Secondary School, Kovalam — Admin',
  },
]
