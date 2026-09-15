// Raw mock inputs only. Effective capacity, available capacity, current load %
// and suitability score are NOT stored here — they are computed live by
// utils/capacityCalculations.js so Safe Sites, the Relocation Planner, the
// Dashboard and What-If all agree on the same numbers for the same site.
//
// Safety score (safetyScoreBase) is a distinct concept from suitability: it is
// this site's own structural/geographic safety, independent of any specific
// habitation being matched to it.
//
// FUTURE BACKEND INTEGRATION:
// Replace this array with the response of getSafeSiteCapacity() once a real
// infrastructure/GIS survey feed exists (see utils/predictionAdapters.js).
export const safeSites = [
  {
    id: 'community-dev-zone',
    name: 'Tambaram Emergency Shelter',
    type: 'Planned Relocation Site',
    district: 'Tambaram / Central District',
    position: { lat: 12.901, lng: 80.19 },
    safetyScoreBase: 92,
    currentOccupancy: 650,
    reservedCapacity: 120,
    capacity: { physicalCapacity: 1600, waterCapacity: 1850, medicalCapacity: 1900, sanitationCapacity: 1700, foodCapacity: 1750, accessibilityCapacity: 1720 },
    roadAccess: 'Excellent',
    livelihoodAccess: 'Medium',
    confidence: 80,
    accessibility: { wheelchairAccessible: true, rampAvailable: true, accessibleToilets: true, medicalAssistance: true, priorityAssistance: true, signLanguageSupport: false, childFriendly: true, elderlyFriendly: true },
  },
  {
    id: 'riverside-relief',
    name: 'Chennai Corporation Relief Centre — Kotturpuram',
    type: 'Temporary Relief Camp',
    district: 'Central District',
    position: { lat: 12.995, lng: 80.235 },
    safetyScoreBase: 96,
    currentOccupancy: 200,
    reservedCapacity: 20,
    capacity: { physicalCapacity: 1000, waterCapacity: 1400, medicalCapacity: 1050, sanitationCapacity: 1150, foodCapacity: 1200, accessibilityCapacity: 1300 },
    roadAccess: 'Good',
    livelihoodAccess: 'Low',
    confidence: 75,
    accessibility: { wheelchairAccessible: false, rampAvailable: false, accessibleToilets: false, medicalAssistance: true, priorityAssistance: false, signLanguageSupport: false, childFriendly: true, elderlyFriendly: false },
  },
  {
    id: 'northern-township',
    name: 'Chennai Coastal Emergency Shelter — North',
    type: 'Planned Relocation Site',
    district: 'Northern District',
    position: { lat: 13.06, lng: 80.22 },
    safetyScoreBase: 88,
    currentOccupancy: 250,
    reservedCapacity: 38,
    capacity: { physicalCapacity: 2400, waterCapacity: 2600, medicalCapacity: 2500, sanitationCapacity: 2450, foodCapacity: 2450, accessibilityCapacity: 2450 },
    roadAccess: 'Moderate',
    livelihoodAccess: 'Low',
    confidence: 77,
    accessibility: { wheelchairAccessible: true, rampAvailable: true, accessibleToilets: true, medicalAssistance: true, priorityAssistance: true, signLanguageSupport: true, childFriendly: true, elderlyFriendly: true },
  },
  {
    id: 'sunrise-relocation-park',
    name: 'Chromepet Community Relief Centre',
    type: 'Planned Relocation Site',
    district: 'Central District',
    position: { lat: 12.945, lng: 80.195 },
    safetyScoreBase: 90,
    currentOccupancy: 450,
    reservedCapacity: 23,
    capacity: { physicalCapacity: 1400, waterCapacity: 1500, medicalCapacity: 1350, sanitationCapacity: 1450, foodCapacity: 1500, accessibilityCapacity: 1600 },
    roadAccess: 'Good',
    livelihoodAccess: 'Good',
    confidence: 79,
    accessibility: { wheelchairAccessible: true, rampAvailable: true, accessibleToilets: true, medicalAssistance: true, priorityAssistance: false, signLanguageSupport: false, childFriendly: true, elderlyFriendly: true },
  },
  {
    id: 'lakeview-shelter-complex',
    name: 'Lakeview Emergency Relief Centre — Sholinganallur',
    type: 'Emergency Shelter',
    district: 'Coastal District',
    position: { lat: 12.98, lng: 80.245 },
    safetyScoreBase: 85,
    currentOccupancy: 720,
    reservedCapacity: 16,
    capacity: { physicalCapacity: 800, waterCapacity: 900, medicalCapacity: 850, sanitationCapacity: 880, foodCapacity: 900, accessibilityCapacity: 1000 },
    roadAccess: 'Good',
    livelihoodAccess: 'Medium',
    confidence: 73,
    accessibility: { wheelchairAccessible: false, rampAvailable: true, accessibleToilets: false, medicalAssistance: false, priorityAssistance: false, signLanguageSupport: false, childFriendly: true, elderlyFriendly: false },
  },
  {
    id: 'eastern-highlands',
    name: 'Government Higher Secondary School Relief Centre — Pallavaram',
    type: 'Planned Relocation Site',
    district: 'Eastern Hills District',
    position: { lat: 12.97, lng: 80.135 },
    safetyScoreBase: 94,
    currentOccupancy: 140,
    reservedCapacity: 12,
    capacity: { physicalCapacity: 1900, waterCapacity: 2000, medicalCapacity: 2100, sanitationCapacity: 1950, foodCapacity: 2000, accessibilityCapacity: 1950 },
    roadAccess: 'Good',
    livelihoodAccess: 'Medium',
    confidence: 81,
    accessibility: { wheelchairAccessible: true, rampAvailable: true, accessibleToilets: true, medicalAssistance: true, priorityAssistance: true, signLanguageSupport: false, childFriendly: true, elderlyFriendly: true },
  },
]

export const getSafeSite = (id) => safeSites.find((s) => s.id === id)
