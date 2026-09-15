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
    id: 'coord-arun',
    name: 'Arun Kumar',
    region: 'Tambaram',
    status: 'Available',
    maxConcurrentCases: 3,
  },
  {
    id: 'coord-meena',
    name: 'Meena Krishnan',
    region: 'Velachery',
    status: 'Available',
    maxConcurrentCases: 3,
  },
  {
    id: 'coord-bose',
    name: 'A. Bose',
    region: 'Perungudi',
    status: 'Available',
    maxConcurrentCases: 3,
  },
  {
    id: 'coord-iyer',
    name: 'R. Iyer',
    region: 'Medavakkam',
    status: 'Available',
    maxConcurrentCases: 2,
  },
  {
    id: 'coord-nair',
    name: 'Karthikeyan S.',
    region: 'Pallavaram',
    status: 'Available',
    maxConcurrentCases: 2,
  },
  {
    id: 'coord-menon',
    name: 'Suresh Kumar',
    region: 'Guindy',
    status: 'Off Duty',
    maxConcurrentCases: 2,
  },
  {
    id: 'coord-raghavan',
    name: 'P. Raghavan',
    region: 'Chromepet',
    status: 'Available',
    maxConcurrentCases: 3,
  },
]

export const getCoordinator = (id) => coordinators.find((c) => c.id === id)
