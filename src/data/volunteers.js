// Frontend-only Volunteer roster. Deterministic, authored data — no
// Math.random() anywhere. Same derive-don't-store approach as
// data/coordinators.js: "available right now" is computed from `status` +
// live assignment count in utils/assignmentCalculations.js, never stored as
// a separate flag.
//
// FUTURE BACKEND INTEGRATION: replace this array with a real volunteer
// registry endpoint; keep field names unchanged.
export const volunteers = [
  { id: 'vol-karthik', name: 'Karthikeyan S.', region: 'Chromepet', skill: 'First Aid', status: 'Available' },
  { id: 'vol-divya', name: 'Divya Rajan', region: 'Pallavaram', skill: 'Evacuation Support', status: 'Available' },
  { id: 'vol-priya', name: 'Priya Srinivasan', region: 'Sholinganallur', skill: 'Logistics', status: 'Available' },
  { id: 'vol-arjun', name: 'Arjun Kumar', region: 'Thoraipakkam', skill: 'Medical Support', status: 'Available' },
  { id: 'vol-farhan', name: 'Farhan M.', region: 'Velachery', skill: 'Transport', status: 'Available' },
  { id: 'vol-lakshmi', name: 'Lakshmi Narayanan', region: 'Guindy', skill: 'Medical Support', status: 'Available' },
  { id: 'vol-suresh', name: 'Suresh Kumar', region: 'Tambaram', skill: 'Transport', status: 'Off Duty' },
  { id: 'vol-anitha', name: 'Anitha R.', region: 'Adyar', skill: 'Supplies', status: 'Available' },
  { id: 'vol-vikram', name: 'Vignesh M.', region: 'Porur', skill: 'Logistics', status: 'Available' },
  { id: 'vol-kavya', name: 'Kavya Srinivasan', region: 'Taramani', skill: 'First Aid', status: 'Available' },
]

export const getVolunteer = (id) => volunteers.find((v) => v.id === id)
