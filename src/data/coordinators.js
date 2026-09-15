// Frontend-only Emergency Coordinator roster. Deterministic, authored data —
// no Math.random() anywhere. "Available right now" is NOT stored as a field
// here (that would drift out of sync with real operation load); it is
// derived by utils/assignmentCalculations.js from `status` + live open-
// operation count from AppStateContext's `operations`.
//
// FUTURE BACKEND INTEGRATION: replace this array with a real personnel
// registry endpoint; keep field names unchanged.
export const coordinators = [
  {
    id: 'coord-bose',
    name: 'A. Bose',
    region: 'Coastal District',
    status: 'Available',
    maxConcurrentCases: 3,
  },
  {
    id: 'coord-iyer',
    name: 'R. Iyer',
    region: 'Central District',
    status: 'Available',
    maxConcurrentCases: 2,
  },
  {
    id: 'coord-nair',
    name: 'K. Nair',
    region: 'Eastern Hills District',
    status: 'Available',
    maxConcurrentCases: 2,
  },
  {
    id: 'coord-menon',
    name: 'S. Menon',
    region: 'Northern District',
    status: 'Off Duty',
    maxConcurrentCases: 2,
  },
  {
    id: 'coord-raghavan',
    name: 'P. Raghavan',
    region: 'Eastern District',
    status: 'Available',
    maxConcurrentCases: 3,
  },
]

export const getCoordinator = (id) => coordinators.find((c) => c.id === id)
