// Deterministic demo contact list for the Citizen Emergency/SOS screen.
// Every entry is explicitly flagged isDemo so the UI can label it "Demo
// contact" — this app makes no real emergency call, dispatch, or backend
// notification of any kind.
export const emergencyContacts = [
  { id: 'police', label: 'Police', number: '100', description: 'Local police assistance', isDemo: true },
  { id: 'fire', label: 'Fire & Rescue', number: '101', description: 'Fire and rescue services', isDemo: true },
  { id: 'ambulance', label: 'Ambulance', number: '108', description: 'Medical emergency response', isDemo: true },
  { id: 'disaster-helpline', label: 'Disaster Management Helpline', number: '1078', description: 'State disaster management coordination', isDemo: true },
  { id: 'shelter-assistance', label: 'Shelter Assistance', number: '1800-425-1077', description: 'Help reaching or entering a safe site', isDemo: true },
]
