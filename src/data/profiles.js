import { TRAVEL_PROFILES } from '../types/geosentra'

const DESCRIPTIONS = {
  'school-child': 'Maximum caution. Heavy penalty on any hazard exposure or steep terrain.',
  elderly: 'Prioritizes shortest walking distance, flat terrain and healthcare access.',
  'young-adult': 'Can tolerate moderate risk; considers a broader set of routes.',
  'mobility-needs': 'Requires accessible road surfaces and avoids any flooded, blocked or unstable sections.',
  vehicle: 'Strongly avoids deep water, unstable bridges and blocked roads.',
}

export const travelProfiles = TRAVEL_PROFILES.map((p) => ({ ...p, description: DESCRIPTIONS[p.id] }))
export const getProfile = (id) => travelProfiles.find((p) => p.id === id)
