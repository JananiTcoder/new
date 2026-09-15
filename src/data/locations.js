import { habitations } from './habitations'
import { safeSites } from './safeSites'
import { institutions } from './institutions'
import { shelters, hospitals, schools } from './dashboard'
import { routeOrigin, routeDestination } from './routes'

const landmarks = [
  { id: 'iit-madras', name: 'IIT Madras', type: 'landmark', lat: 12.9915, lng: 80.2336 },
  { id: 'st-thomas-mount', name: 'St. Thomas Mount', type: 'landmark', lat: 13.0067, lng: 80.1943 },
]

// Location picker index used by Route Intelligence's origin/destination search.
export const locations = [
  { id: 'origin-default', name: routeOrigin.name, type: 'school', lat: routeOrigin.lat, lng: routeOrigin.lng },
  { id: 'destination-default', name: routeDestination.name, type: 'shelter', lat: routeDestination.lat, lng: routeDestination.lng },
  ...landmarks,
  ...habitations.map((h) => ({ id: h.id, name: h.name, type: 'habitation', lat: h.position.lat, lng: h.position.lng })),
  ...safeSites.map((s) => ({ id: s.id, name: s.name, type: 'site', lat: s.position.lat, lng: s.position.lng })),
  ...institutions.map((i) => ({ id: i.id, name: i.name, type: 'institution', lat: i.position.lat, lng: i.position.lng })),
  ...shelters.map((s) => ({ id: s.id, name: s.name, type: 'shelter', lat: s.position.lat, lng: s.position.lng })),
  ...hospitals.map((h) => ({ id: h.id, name: h.name, type: 'hospital', lat: h.position.lat, lng: h.position.lng })),
  ...schools.map((s) => ({ id: s.id, name: s.name, type: 'school', lat: s.position.lat, lng: s.position.lng })),
]

export const searchLocations = (query) => {
  const q = query.trim().toLowerCase()
  if (!q) return locations.slice(0, 8)
  return locations.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 8)
}

export const getLocation = (id) => locations.find((l) => l.id === id)
