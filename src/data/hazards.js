// Strict hazard scope: Landslide, Flood, Coastal Erosion, Cloudburst only.
// Each zone carries hazard-specific mock fields (not generic reused fields) so
// the Hazard Intelligence page can explain what actually makes each hazard
// dangerous, rather than showing the same shape for every hazard type.
//
// FUTURE BACKEND INTEGRATION:
// Each zone's `fields` object mirrors what getLandslidePrediction() /
// getFloodPrediction() / getCoastalErosionPrediction() / getCloudburstPrediction()
// return in utils/predictionAdapters.js — swapping the source of this array for
// real model output later should not require changing any page.
import { HAZARD_TYPES } from '../types/geosentra'

export { HAZARD_TYPES, HAZARD_TYPES as hazardTypes }

// Zone severity (distinct from a habitation's Red Zone status) — how intense
// the hazard itself is at this location, independent of who lives there.
export const severityLevels = [
  { id: 'low', label: 'Safe', color: '#059669' },
  { id: 'medium', label: 'Moderate Risk', color: '#d97706' },
  { id: 'high', label: 'High Risk', color: '#ea580c' },
  { id: 'critical', label: 'Red Zone (Critical)', color: '#991b1b' },
]

export const hazardZones = [
  {
    id: 'hz-1',
    type: 'flood',
    severity: 'critical',
    label: 'Coastal Floodplain',
    polygon: [
      [12.828, 80.238],
      [12.828, 80.252],
      [12.852, 80.252],
      [12.852, 80.238],
    ],
    affectedAreaKm2: 4.1,
    confidence: 81,
    lastUpdated: 'Today, 18:42',
    redZone: true,
    sourceStatus: 'Mock prediction — backend not connected',
    fields: {
      waterLevel: '2.1 m above normal',
      floodDepth: '0.6–0.9 m sustained',
      rainfallIntensity: 78,
      drainageCapacity: 32,
      riverProximity: '0.4 km from tidal creek',
      waterloggingProbability: 81,
      historicalFloodIncidents: 4,
      roadAccessibility: 'Poor',
      warningLevel: 'Severe',
    },
  },
  {
    id: 'hz-2',
    type: 'flood',
    severity: 'medium',
    label: 'Lake Road Basin',
    polygon: [
      [12.86, 80.2],
      [12.86, 80.23],
      [12.89, 80.23],
      [12.89, 80.2],
    ],
    affectedAreaKm2: 2.6,
    confidence: 74,
    lastUpdated: 'Today, 17:10',
    redZone: false,
    sourceStatus: 'Mock prediction — backend not connected',
    fields: {
      waterLevel: '0.8 m above normal',
      floodDepth: '0.2–0.3 m, seasonal',
      rainfallIntensity: 52,
      drainageCapacity: 58,
      riverProximity: '1.1 km from lake',
      waterloggingProbability: 46,
      historicalFloodIncidents: 2,
      roadAccessibility: 'Moderate',
      warningLevel: 'Moderate',
    },
  },
  {
    id: 'hz-3',
    type: 'landslide',
    severity: 'critical',
    label: 'Eastern Ridge',
    polygon: [
      [12.918, 80.108],
      [12.918, 80.128],
      [12.938, 80.128],
      [12.938, 80.108],
    ],
    affectedAreaKm2: 1.8,
    confidence: 79,
    lastUpdated: 'Today, 18:05',
    redZone: true,
    sourceStatus: 'Mock prediction — backend not connected',
    fields: {
      slope: '34–41°',
      elevation: '212 m',
      soilStability: 'Poor — saturated clay-loam',
      rainfallIntensity: 74,
      landslideSusceptibility: 86,
      recentIncidents: 3,
      roadBlockageRisk: 'High',
      warningLevel: 'Severe',
    },
  },
  {
    id: 'hz-4',
    type: 'landslide',
    severity: 'medium',
    label: 'North Ridge Slope',
    polygon: [
      [12.948, 80.14],
      [12.948, 80.158],
      [12.965, 80.158],
      [12.965, 80.14],
    ],
    affectedAreaKm2: 1.2,
    confidence: 68,
    lastUpdated: 'Today, 14:20',
    redZone: false,
    sourceStatus: 'Mock prediction — backend not connected',
    fields: {
      slope: '22–27°',
      elevation: '164 m',
      soilStability: 'Fair',
      rainfallIntensity: 48,
      landslideSusceptibility: 42,
      recentIncidents: 0,
      roadBlockageRisk: 'Medium',
      warningLevel: 'Moderate',
    },
  },
  {
    id: 'hz-5',
    type: 'cloudburst',
    severity: 'high',
    label: 'Urban Lowland Cloudburst Belt',
    polygon: [
      [12.87, 80.09],
      [12.87, 80.11],
      [12.895, 80.11],
      [12.895, 80.09],
    ],
    affectedAreaKm2: 3.0,
    confidence: 70,
    lastUpdated: 'Today, 16:50',
    redZone: false,
    sourceStatus: 'Mock prediction — backend not connected',
    fields: {
      shortDurationRainfallIntensity: 68,
      rainfallAccumulation: '92 mm / hr peak',
      drainageOverloadProbability: 71,
      flashFloodProbability: 63,
      urbanDensity: 'High',
      lowLyingAreaIndicator: true,
      historicalCloudburstIncidents: 2,
      roadDisruptionRisk: 'High',
      warningLevel: 'High',
    },
  },
  {
    id: 'hz-6',
    type: 'coastal-erosion',
    severity: 'high',
    label: 'Coastal Erosion Belt',
    polygon: [
      [12.918, 80.246],
      [12.918, 80.262],
      [12.945, 80.262],
      [12.945, 80.246],
    ],
    affectedAreaKm2: 2.5,
    confidence: 76,
    lastUpdated: 'Today, 13:48',
    redZone: false,
    sourceStatus: 'Mock prediction — backend not connected',
    fields: {
      distanceFromCoastline: '180 m',
      shorelineRetreatRate: '1.4 m / year',
      erosionSusceptibility: 72,
      coastalExposure: 'High — direct wave exposure',
      historicalErosionIncidents: 1,
      infrastructureExposure: 'Moderate — temporary structures near shoreline',
      safeInlandDistance: '600 m',
      warningLevel: 'High',
    },
  },
]

export const activeLayers = [
  { hazard: 'Flood Risk', level: 'HIGH' },
  { hazard: 'Landslide Risk', level: 'HIGH' },
  { hazard: 'Cloudburst Risk', level: 'MEDIUM' },
  { hazard: 'Coastal Erosion Risk', level: 'MEDIUM' },
]

export const hazardSummary = {
  combinedRisk: 0.87,
  riskScore: 87,
  confidence: 78,
  lastUpdated: 'Today, 18:42',
  dataQuality: 'Good',
  missingData: 'Some healthcare capacity data is unavailable.',
  dataStatus: 'Mock frontend data — no live sensor feed connected',
}

export const getHazardZone = (id) => hazardZones.find((z) => z.id === id)
export const hazardZonesByType = (type) => hazardZones.filter((z) => z.type === type)
