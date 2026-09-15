// Frontend-only Volunteer roster. Deterministic, authored data — no
// Math.random() anywhere. Same derive-don't-store approach as
// data/coordinators.js: "available right now" is computed from `status` +
// live assignment count in utils/assignmentCalculations.js, never stored as
// a separate flag.
//
// FUTURE BACKEND INTEGRATION: replace this array with a real volunteer
// registry endpoint; keep field names unchanged.
export const volunteers = [
  { id: 'vol-priya', name: 'Priya S.', region: 'Coastal District', skill: 'Logistics', status: 'Available' },
  { id: 'vol-arjun', name: 'Arjun K.', region: 'Coastal District', skill: 'Medical Support', status: 'Available' },
  { id: 'vol-divya', name: 'Divya R.', region: 'Central District', skill: 'Logistics', status: 'Available' },
  { id: 'vol-farhan', name: 'Farhan M.', region: 'Central District', skill: 'Transport', status: 'Available' },
  { id: 'vol-lakshmi', name: 'Lakshmi N.', region: 'Eastern Hills District', skill: 'Medical Support', status: 'Available' },
  { id: 'vol-suresh', name: 'Suresh P.', region: 'Eastern Hills District', skill: 'Transport', status: 'Off Duty' },
  { id: 'vol-anitha', name: 'Anitha V.', region: 'Northern District', skill: 'Supplies', status: 'Available' },
  { id: 'vol-vikram', name: 'Vikram T.', region: 'Eastern District', skill: 'Logistics', status: 'Available' },
]

export const getVolunteer = (id) => volunteers.find((v) => v.id === id)
