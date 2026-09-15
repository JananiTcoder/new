import { PAGE_ACCESS, ROLES } from '../auth/roleConfig'

export const navItems = [
  { id: 'overview', label: 'Overview', path: '/app', icon: 'LayoutGrid' },
  { id: 'hazard', label: 'Hazard Intelligence', path: '/app/hazard-intelligence', icon: 'AlertTriangle' },
  { id: 'habitations', label: 'Risk Habitations', path: '/app/habitations', icon: 'Home' },
  { id: 'relocation', label: 'Relocation', path: '/app/relocation', icon: 'ArrowRightLeft' },
  { id: 'sites', label: 'Safe Sites', path: '/app/safe-sites', icon: 'ShieldCheck' },
  { id: 'resource-network', label: 'Resource Network', path: '/app/resource-network', icon: 'Warehouse' },
  { id: 'routes', label: 'Route Intelligence', path: '/app/routes', icon: 'Route' },
  { id: 'operations', label: 'Operation Management', path: '/app/operations', icon: 'ClipboardList' },
  { id: 'evacuation', label: 'Institution / Evacuation', path: '/app/institution', icon: 'School' },
  { id: 'whatif', label: 'What-If Simulator', path: '/app/what-if', icon: 'FlaskConical' },
  { id: 'alerts', label: 'Alerts', path: '/app/alerts', icon: 'Bell' },
  { id: 'audit', label: 'Audit Trail', path: '/app/audit-trail', icon: 'History' },
  { id: 'national-relocations', label: 'All Relocations Across India', path: '/app/national-relocations', icon: 'Globe2' },
  { id: 'report-issue', label: 'Report an Issue', path: '/app/report-issue', icon: 'FileWarning' },
  { id: 'emergency-sos', label: 'Emergency / SOS', path: '/app/emergency', icon: 'Siren' },
  { id: 'tasks', label: 'My Tasks', path: '/app/tasks', icon: 'ClipboardCheck' },
  { id: 'people', label: 'People', path: '/app/people', icon: 'Users' },
  { id: 'report-incident', label: 'Report Incident', path: '/app/report-incident', icon: 'FileWarning' },
  { id: 'volunteer-sos', label: 'SOS', path: '/app/volunteer-sos', icon: 'Siren' },
  { id: 'settings', label: 'Settings', path: '/app/settings', icon: 'Settings' },
]

// Disaster Authority gets exactly these seven primary tabs, in this order —
// Hazard Intelligence, Resource Network, Institution/Evacuation, What-If and
// All Relocations Across India are folded into Risk Habitations/Relocation/
// Operations instead (their routes stay live, reached via secondary links,
// same treatment What-If already got). Every other role keeps the general
// PAGE_ACCESS-filtered list below unchanged.
const AUTHORITY_TAB_IDS = ['overview', 'habitations', 'relocation', 'operations', 'alerts', 'audit', 'settings']

// Citizen gets exactly these seven tabs, in this order — Resource Network
// and Infrastructure (provider/admin-facing) are dropped from their nav
// entirely (see roleConfig.js PAGE_ACCESS), replaced by the two citizen
// safety features.
const CITIZEN_TAB_IDS = ['overview', 'sites', 'routes', 'alerts', 'report-issue', 'emergency-sos', 'settings']

// Volunteer gets exactly these ten tabs, in this order — My Tasks is the most
// important item (Sidebar/MobileNav add an active-task-count badge to it for
// this role). 'routes' and 'resource-network' keep their existing pageIds/
// routes (so RoleRoute guards and other roles' behavior are untouched) but
// are relabeled here to match the brief's nav copy for volunteers only.
const VOLUNTEER_TAB_IDS = ['overview', 'tasks', 'routes', 'people', 'sites', 'resource-network', 'alerts', 'report-incident', 'volunteer-sos', 'settings']
const VOLUNTEER_LABEL_OVERRIDES = { routes: 'Map / Safe Route', 'resource-network': 'Resources' }

// Emergency Coordinator gets exactly these eleven tabs, in this order — the
// Emergency Operations Center console. 'operations' (Operation Management) is
// replaced by 'whatif' (What-If Simulator) here; the /app/operations route
// stays live and reachable (e.g. from Overview's Active Operations table),
// it's just not a primary tab for this role.
const COORDINATOR_TAB_IDS = ['overview', 'hazard', 'habitations', 'relocation', 'sites', 'resource-network', 'routes', 'evacuation', 'whatif', 'alerts', 'settings']

export const mobileNavItems = [
  { id: 'overview', label: 'Overview', path: '/app', icon: 'LayoutGrid' },
  { id: 'hazard', label: 'Hazards', path: '/app/hazard-intelligence', icon: 'AlertTriangle' },
  { id: 'routes', label: 'Routes', path: '/app/routes', icon: 'Route' },
  { id: 'relocation', label: 'Relocation', path: '/app/relocation', icon: 'ArrowRightLeft' },
  { id: 'tasks', label: 'Tasks', path: '/app/tasks', icon: 'ClipboardCheck' },
  { id: 'more', label: 'More', path: '/app/settings', icon: 'Menu' },
]

// My Tasks is the single most important item for Volunteers (per the brief),
// so it gets a dedicated bottom-bar slot ahead of the generic PAGE_ACCESS
// filter every other role uses.
const VOLUNTEER_MOBILE_TAB_IDS = ['overview', 'tasks', 'routes', 'more']

// Single source of truth for role-based nav is PAGE_ACCESS (src/auth/roleConfig.js) —
// filtering here just reads from it so the sidebar can never drift out of sync
// with the route guards.
export function getNavigationForRole(role) {
  if (role === ROLES.DISASTER_AUTHORITY) {
    return AUTHORITY_TAB_IDS.map((id) => navItems.find((item) => item.id === id)).filter(Boolean)
  }
  if (role === ROLES.CITIZEN) {
    return CITIZEN_TAB_IDS.map((id) => navItems.find((item) => item.id === id)).filter(Boolean)
  }
  if (role === ROLES.VOLUNTEERS) {
    return VOLUNTEER_TAB_IDS.map((id) => navItems.find((item) => item.id === id))
      .filter(Boolean)
      .map((item) => (VOLUNTEER_LABEL_OVERRIDES[item.id] ? { ...item, label: VOLUNTEER_LABEL_OVERRIDES[item.id] } : item))
  }
  if (role === ROLES.EMERGENCY_COORDINATOR) {
    return COORDINATOR_TAB_IDS.map((id) => navItems.find((item) => item.id === id)).filter(Boolean)
  }
  return navItems.filter((item) => (PAGE_ACCESS[item.id] || []).includes(role))
}

export function getMobileNavigationForRole(role) {
  if (role === ROLES.VOLUNTEERS) {
    return VOLUNTEER_MOBILE_TAB_IDS.map((id) => mobileNavItems.find((item) => item.id === id)).filter(Boolean)
  }
  return mobileNavItems.filter((item) => item.id === 'more' || (PAGE_ACCESS[item.id] || []).includes(role))
}
