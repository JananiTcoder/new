// Deterministic demo contact list for the Citizen Emergency/SOS screen.
// Every entry is explicitly flagged isDemo so the UI can label it "Demo
// contact" — this app makes no real emergency call, dispatch, or backend
// notification of any kind.
export const emergencyContacts = [
  { id: 'national-emergency', label: 'National Emergency Helpline', number: '112', description: 'All-in-one unified emergency response (Police, Fire, Medical)', isDemo: true },
  { id: 'tn-seoc', label: 'Tamil Nadu State EOC', number: '1070', description: 'Tamil Nadu State Emergency Operations Centre helpline', isDemo: true },
  { id: 'district-deoc', label: 'District Disaster Helpline', number: '1077', description: 'Chennai & Chengalpattu District Emergency Operations Centre', isDemo: true },
  { id: 'chennai-corp', label: 'Chennai Corporation Helpline', number: '1913', description: 'Greater Chennai Corporation flood & municipal control room', isDemo: true },
  { id: 'ambulance', label: 'Ambulance & Medical Emergency', number: '108', description: 'State emergency medical response service', isDemo: true },
  { id: 'police', label: 'Police Control Room', number: '100', description: 'Local police emergency assistance', isDemo: true },
  { id: 'fire', label: 'Fire & Rescue Services', number: '101', description: 'Tamil Nadu Fire and Rescue Services', isDemo: true },
]
