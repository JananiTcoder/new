// Placeholder adapters for future trained-model / backend integration.
// Every function below returns local mock data ONLY — none of them call a
// network endpoint. They exist so a future team can replace the function body
// with a real API/model call without touching any page that imports it.
//
// Expected prediction shape (kept consistent across all four hazards):
//   { hazardType, riskScore, severity, affectedArea, confidence, contributingFactors, timestamp, modelVersion }
import { hazardZones } from '../data/hazards'
import { severityLevels } from '../data/hazards'

const MODEL_VERSION = 'mock-v0'

function zoneToPrediction(zone) {
  const severityLabel = severityLevels.find((s) => s.id === zone.severity)?.label || zone.severity
  return {
    hazardType: zone.type,
    riskScore: { low: 20, medium: 45, high: 70, critical: 92 }[zone.severity] ?? 50,
    severity: severityLabel,
    affectedArea: zone.affectedAreaKm2,
    confidence: zone.confidence,
    contributingFactors: Object.entries(zone.fields || {})
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`),
    timestamp: zone.lastUpdated,
    modelVersion: MODEL_VERSION,
  }
}

// FUTURE BACKEND INTEGRATION:
// Replace this mock implementation with the trained landslide model endpoint.
export function getLandslidePrediction(zoneId) {
  const zone = hazardZones.find((z) => z.type === 'landslide' && (!zoneId || z.id === zoneId))
  return zone ? zoneToPrediction(zone) : null
}

// FUTURE BACKEND INTEGRATION:
// Replace this mock implementation with the trained flood model endpoint.
export function getFloodPrediction(zoneId) {
  const zone = hazardZones.find((z) => z.type === 'flood' && (!zoneId || z.id === zoneId))
  return zone ? zoneToPrediction(zone) : null
}

// FUTURE BACKEND INTEGRATION:
// Replace this mock implementation with the trained coastal erosion model endpoint.
export function getCoastalErosionPrediction(zoneId) {
  const zone = hazardZones.find((z) => z.type === 'coastal-erosion' && (!zoneId || z.id === zoneId))
  return zone ? zoneToPrediction(zone) : null
}

// FUTURE BACKEND INTEGRATION:
// Replace this mock implementation with the trained cloudburst model endpoint.
export function getCloudburstPrediction(zoneId) {
  const zone = hazardZones.find((z) => z.type === 'cloudburst' && (!zoneId || z.id === zoneId))
  return zone ? zoneToPrediction(zone) : null
}

// FUTURE BACKEND INTEGRATION:
// Replace with a call to a combined risk-assessment service; for now this
// delegates to the local frontend formula in utils/riskCalculations.js.
export function getRiskAssessment(habitation, scenario) {
  // Deliberately requires the caller to pass computeHabitationRisk's own
  // output shape in — kept here only as a named integration point.
  return { hazardType: habitation.primaryHazard, source: 'frontend formula (utils/riskCalculations.js)', modelVersion: MODEL_VERSION }
}

// FUTURE BACKEND INTEGRATION:
// Replace with a call to a trained relocation-recommendation service; for now
// this delegates to utils/relocationCalculations.js + utils/capacityCalculations.js.
export function getRelocationRecommendations(habitationId) {
  return { habitationId, source: 'frontend formula (utils/relocationCalculations.js)', modelVersion: MODEL_VERSION }
}

// FUTURE BACKEND INTEGRATION:
// Replace with a call to a real infrastructure/GIS capacity survey feed; for
// now this delegates to utils/capacityCalculations.js.
export function getSafeSiteCapacity(siteId) {
  return { siteId, source: 'frontend formula (utils/capacityCalculations.js)', modelVersion: MODEL_VERSION }
}

// FUTURE BACKEND INTEGRATION:
// Replace with a call to a real routing + hazard-overlay service; for now this
// delegates to utils/routeCalculations.js.
export function getRouteRisk(routeId, profileId) {
  return { routeId, profileId, source: 'frontend formula (utils/routeCalculations.js)', modelVersion: MODEL_VERSION }
}
