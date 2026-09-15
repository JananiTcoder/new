// Central role/permission configuration for GEOSENTRA's frontend-only mock
// auth. Every access decision — sidebar filtering, route guards, page-level
// content — reads from PAGE_ACCESS here so permissions can't drift apart
// between the nav and the route guards.

export const ROLES = {
  DISASTER_AUTHORITY: 'disaster-authority',
  VOLUNTEERS: 'volunteers',
  CITIZEN: 'citizen',
  EMERGENCY_COORDINATOR: 'emergency-coordinator',
}

export const ROLE_LIST = Object.values(ROLES)

export const ROLE_LABELS = {
  [ROLES.DISASTER_AUTHORITY]: 'Disaster Authority',
  [ROLES.VOLUNTEERS]: 'Volunteers',
  [ROLES.CITIZEN]: 'Citizen',
  [ROLES.EMERGENCY_COORDINATOR]: 'Emergency Coordinator',
}

export const ROLE_DESCRIPTIONS = {
  [ROLES.DISASTER_AUTHORITY]: 'Monitor risk, prioritize habitations and plan relocation.',
  [ROLES.VOLUNTEERS]: 'Support relocation efforts — logistics, supplies and temporary shelters.',
  [ROLES.CITIZEN]: 'Find the safest route to a safe destination.',
  [ROLES.EMERGENCY_COORDINATOR]: 'Monitor evacuation and changing hazard conditions.',
}

// Demo-only mock identities — no passwords, no real auth. Selecting a role
// card in RoleSelect.jsx logs in as this user.
export const MOCK_USERS = {
  [ROLES.DISASTER_AUTHORITY]: { name: 'Arun Kumar (Disaster Authority)', role: ROLES.DISASTER_AUTHORITY, email: 'authority@geosentra.gov.in' },
  [ROLES.VOLUNTEERS]: { name: 'Karthikeyan S. (Volunteer Lead)', role: ROLES.VOLUNTEERS, email: 'volunteers@geosentra.gov.in' },
  [ROLES.CITIZEN]: { name: 'Priya Srinivasan (Citizen)', role: ROLES.CITIZEN, email: 'citizen@geosentra.gov.in' },
  [ROLES.EMERGENCY_COORDINATOR]: { name: 'Meena Krishnan (EOC Coordinator)', role: ROLES.EMERGENCY_COORDINATOR, email: 'coordinator@geosentra.gov.in' },
}

// Page ids match src/data/nav.js item ids (plus 'habitations' also covering
// the /app/habitations/:id detail route).
export const PAGE_ACCESS = {
  overview: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.CITIZEN, ROLES.EMERGENCY_COORDINATOR],
  hazard: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.EMERGENCY_COORDINATOR],
  habitations: [ROLES.DISASTER_AUTHORITY, ROLES.EMERGENCY_COORDINATOR],
  'assign-coordinator': [ROLES.DISASTER_AUTHORITY, ROLES.EMERGENCY_COORDINATOR],
  sites: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.CITIZEN, ROLES.EMERGENCY_COORDINATOR],
  infrastructure: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.EMERGENCY_COORDINATOR],
  routes: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.CITIZEN, ROLES.EMERGENCY_COORDINATOR],
  'routes-plan': [ROLES.DISASTER_AUTHORITY, ROLES.EMERGENCY_COORDINATOR],
  operations: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.EMERGENCY_COORDINATOR],
  'relocation-team': [ROLES.DISASTER_AUTHORITY, ROLES.EMERGENCY_COORDINATOR],
  'relocation-validate': [ROLES.DISASTER_AUTHORITY, ROLES.EMERGENCY_COORDINATOR],
  evacuation: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.EMERGENCY_COORDINATOR],
  whatif: [ROLES.DISASTER_AUTHORITY, ROLES.EMERGENCY_COORDINATOR],
  alerts: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.CITIZEN, ROLES.EMERGENCY_COORDINATOR],
  audit: [ROLES.DISASTER_AUTHORITY],
  settings: [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.CITIZEN, ROLES.EMERGENCY_COORDINATOR],
  'national-relocations': [ROLES.DISASTER_AUTHORITY],
  'resource-network': [ROLES.DISASTER_AUTHORITY, ROLES.VOLUNTEERS, ROLES.EMERGENCY_COORDINATOR],
  'report-issue': [ROLES.CITIZEN],
  'emergency-sos': [ROLES.CITIZEN],
  tasks: [ROLES.VOLUNTEERS],
  people: [ROLES.VOLUNTEERS],
  'report-incident': [ROLES.VOLUNTEERS],
  'volunteer-sos': [ROLES.VOLUNTEERS],
}

export const PAGE_LABELS = {
  overview: 'Overview',
  hazard: 'Hazard Intelligence',
  habitations: 'Risk Habitations',
  'assign-coordinator': 'Assign Emergency Coordinator',
  sites: 'Relief Sites',
  infrastructure: 'Infrastructure',
  routes: 'Route Intelligence',
  'routes-plan': 'Relocation Planner',
  operations: 'Operation Management',
  'relocation-team': 'Rescue Team',
  'relocation-validate': 'Validation',
  evacuation: 'Institution / Evacuation',
  whatif: 'What-If Simulator',
  alerts: 'Alerts',
  audit: 'Audit Trail',
  settings: 'Settings',
  'national-relocations': 'All Relocations Across India',
  'resource-network': 'Resource Network',
  'report-issue': 'Report an Issue',
  'emergency-sos': 'Emergency / SOS',
  tasks: 'My Tasks',
  people: 'People',
  'report-incident': 'Report Incident',
  'volunteer-sos': 'SOS',
}

export function canAccessPage(role, pageId) {
  const allowed = PAGE_ACCESS[pageId]
  if (!allowed) return true
  return allowed.includes(role)
}

export const SESSION_STORAGE_KEY = 'geosentra_mock_session'
