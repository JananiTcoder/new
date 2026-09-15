// Illustrative route for frontend demonstration — there is no real routing
// engine or street network here. This file is the single, unified brain for
// BOTH the hand-drawn default routes (data/routes.js routeGeometry) and any
// custom origin/destination the user searches for (utils/routing.js
// generateRoutes): every route, regardless of where its geometry came from,
// gets its hazard exposure and risk score computed the same way, right here,
// against the CURRENT four-hazard zone data and the CURRENT What-If scenario.
//
// FUTURE BACKEND INTEGRATION:
// Replace computeRouteHazardExposure()'s polygon test with a call to
// getRouteRisk() (see predictionAdapters.js) backed by a real routing +
// hazard-overlay service, keeping the returned shape the same.
import { pointInPolygon } from './geo'
import { hazardZones } from '../data/hazards'
import { HAZARD_IDS, TRAVEL_PROFILES } from '../types/geosentra'

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n))

const SEVERITY_SCORE = { low: 15, medium: 40, high: 65, critical: 90 }

// Mirrors the hazard-specific scenario wiring in utils/riskCalculations.js so
// a rainfall/drainage/landslide/coastal slider move affects route exposure the
// same way it affects habitation risk.
const SCENARIO_ADJUSTMENT = {
  flood: (s) => s.rainfallIntensity * 0.2 + s.floodDepthDelta * 0.4 - s.drainageCapacityDelta * 0.35,
  cloudburst: (s) => s.cloudburstIntensityDelta * 0.4 + s.rainfallIntensity * 0.15 - s.drainageCapacityDelta * 0.25,
  landslide: (s) => s.landslideSusceptibilityDelta * 0.4 + s.rainfallIntensity * 0.1,
  'coastal-erosion': (s) => s.coastalErosionRateDelta * 0.4,
}

const HAZARD_LABEL = Object.fromEntries([
  ['flood', 'Flood'],
  ['landslide', 'Landslide'],
  ['coastal-erosion', 'Coastal Erosion'],
  ['cloudburst', 'Cloudburst'],
])

/**
 * Samples a route's geometry against the four-hazard zone polygons. The
 * origin and destination endpoints are excluded from the test — exposure
 * reflects the JOURNEY between them, not the ambient condition of merely
 * standing at a point that happens to be inside a hazard zone. Without this,
 * every route leaving a Red Zone habitation would score identically (the
 * shared origin alone would saturate the exposure for all three variants).
 */
export function computeRouteHazardExposure(route, scenario) {
  const exposure = Object.fromEntries(HAZARD_IDS.map((h) => [h, 0]))
  const crossedZones = new Map()
  const samplePoints = route.positions.length > 2 ? route.positions.slice(1, -1) : route.positions
  for (const pos of samplePoints) {
    const point = Array.isArray(pos) ? { lat: pos[0], lng: pos[1] } : pos
    for (const zone of hazardZones) {
      if (pointInPolygon(point, zone.polygon)) {
        crossedZones.set(zone.id, zone)
        const base = SEVERITY_SCORE[zone.severity] ?? 30
        const delta = SCENARIO_ADJUSTMENT[zone.type]?.(scenario) ?? 0
        exposure[zone.type] = Math.max(exposure[zone.type], clamp(base + delta))
      }
    }
  }
  const [dominantHazard, dominantScore] = Object.entries(exposure).sort((a, b) => b[1] - a[1])[0]
  return { exposure, crossedZones: [...crossedZones.values()], dominantHazard: dominantScore > 0 ? dominantHazard : null }
}

const PROFILE_RISK_MULTIPLIER = {
  'school-child': 1.3,
  elderly: 1.15,
  'mobility-needs': 1.2,
  'young-adult': 0.82,
  vehicle: 0.88,
}
// Walking/driving speed used only to derive an illustrative travel time per profile.
const PROFILE_SPEED_KMH = {
  'school-child': 4,
  elderly: 3.2,
  'young-adult': 5,
  'mobility-needs': 2.8,
  vehicle: 24,
}
const PROFILE_ACCESSIBLE_ONLY = new Set(['mobility-needs'])

/** One route's full stats for one traveller profile under the current scenario. */
export function computeRouteRisk(route, profileId, scenario) {
  const { exposure, crossedZones, dominantHazard } = computeRouteHazardExposure(route, scenario)
  const baseExposure = Math.max(8, ...Object.values(exposure))
  const mult = PROFILE_RISK_MULTIPLIER[profileId] ?? 1
  const riskScore = Math.round(clamp(baseExposure * mult))

  const speed = PROFILE_SPEED_KMH[profileId] ?? 4
  const timeMin = Math.max(3, Math.round((route.distanceKm / speed) * 60))

  const poorRoadSurface = crossedZones.some((z) => z.severity === 'high' || z.severity === 'critical')
  const accessibilityBlocked = PROFILE_ACCESSIBLE_ONLY.has(profileId) && poorRoadSurface

  let tag = 'safest'
  let label = 'RECOMMENDED'
  if (accessibilityBlocked || riskScore >= 65) {
    tag = 'not-recommended'
    label = accessibilityBlocked ? 'NOT ACCESSIBLE' : profileId === 'school-child' ? 'NOT RECOMMENDED FOR CHILDREN' : 'NOT RECOMMENDED'
  } else if (riskScore >= 35) {
    tag = 'balanced'
    label = 'ACCEPTABLE'
  } else {
    tag = 'safest'
    label = profileId === 'elderly' ? 'RECOMMENDED FOR ELDERLY' : profileId === 'vehicle' ? 'RECOMMENDED FOR VEHICLES' : profileId === 'mobility-needs' ? 'ACCESSIBLE ROUTE' : 'RECOMMENDED'
  }

  const roadAccessibility = riskScore >= 65 ? 'Poor' : riskScore >= 35 ? 'Fair' : 'Good'
  const routeSafetyScore = Math.round(clamp(100 - riskScore))

  return {
    riskScore,
    routeSafetyScore,
    timeMin,
    tag,
    label,
    exposure,
    crossedZones,
    dominantHazard,
    dominantHazardLabel: dominantHazard ? HAZARD_LABEL[dominantHazard] : null,
    roadAccessibility,
    accessibilityBlocked,
  }
}

/** Ranks a set of routes for one profile, best (lowest risk) first, with a profile-flavored top label. */
export function rankRoutesForProfile(routes, profileId, scenario) {
  const ranked = routes
    .map((route) => ({ route, stats: computeRouteRisk(route, profileId, scenario) }))
    .sort((a, b) => a.stats.riskScore - b.stats.riskScore)

  if (ranked.length > 0 && ranked[0].stats.tag !== 'not-recommended') {
    const profileLabel = TRAVEL_PROFILES.find((p) => p.id === profileId)?.label || 'this traveller'
    ranked[0].stats.rankLabel = `Safest for ${profileLabel}`
  }
  const fastest = [...ranked].sort((a, b) => a.stats.timeMin - b.stats.timeMin)[0]
  if (fastest && fastest.stats.tag !== 'not-recommended' && fastest !== ranked[0]) {
    fastest.stats.rankLabel = 'Fastest acceptable route'
  }
  return ranked
}

/**
 * Map hazard-segment markers for a route. Authored routes (data/routes.js)
 * carry richer hand-written segment detail; anything else (a custom searched
 * origin/destination) gets an equivalent marker derived automatically from
 * whichever hazard zones its geometry actually crosses.
 */
export function getRouteHazardSegments(route, scenario) {
  if (route.hazardSegments) return route.hazardSegments
  const { crossedZones } = computeRouteHazardExposure(route, scenario)
  return crossedZones.map((zone) => ({
    id: `${route.id}-${zone.id}`,
    label: zone.label,
    position: { lat: zone.polygon[0][0], lng: zone.polygon[0][1] },
    hazard: zone.type,
    risk: zone.severity === 'critical' || zone.severity === 'high' ? 'HIGH' : 'MEDIUM',
    confidence: zone.confidence,
    reason: `Route passes through the ${zone.label} hazard zone.`,
    recommendedAction: zone.severity === 'critical' || zone.severity === 'high' ? 'AVOID DURING ACTIVE WARNING' : 'Passable with caution',
  }))
}

/** Builds the "Why this route? / Why not this route?" explanation panel content. */
export function explainRoute(route, profileId, scenario) {
  const stats = computeRouteRisk(route, profileId, scenario)
  const confidence = Math.round(clamp(90 - stats.riskScore * 0.3))

  if (stats.tag !== 'not-recommended') {
    return {
      title: 'Why GEOSENTRA Recommends This Route',
      recommended: true,
      riskScore: stats.riskScore,
      confidence,
      freshness: 'Recent',
      points: [
        stats.dominantHazardLabel
          ? `Passes near a ${stats.dominantHazardLabel.toLowerCase()} zone but exposure is limited for this profile`
          : 'Avoids all four monitored hazard types (landslide, flood, coastal erosion, cloudburst)',
        `Estimated distance ${route.distanceKm} km, ${stats.timeMin} min travel time for this profile`,
        `Route safety score ${stats.routeSafetyScore}/100 under the current scenario`,
        'Suitable for the selected profile — within acceptable risk threshold',
      ],
    }
  }
  return {
    title: 'Why Not This Route?',
    recommended: false,
    riskScore: stats.riskScore,
    confidence,
    freshness: 'Recent',
    summary: stats.dominantHazardLabel
      ? `Crosses a ${stats.dominantHazardLabel.toLowerCase()} zone — estimated risk score ${stats.riskScore}/100 for the selected profile.`
      : `Estimated risk score ${stats.riskScore}/100 for the selected profile under the current scenario.`,
    warnings: [
      stats.dominantHazardLabel ? `Passes directly through a ${stats.dominantHazardLabel.toLowerCase()} zone` : 'Elevated hazard exposure detected',
      stats.accessibilityBlocked ? 'Road surface is not accessible for this profile' : 'Higher hazard exposure than the safest alternative',
      'Reduced accessibility for the selected profile',
      'Longer exposure time within the hazard zone during evacuation',
    ],
  }
}
