// Illustrative frontend prototype calculation.
// Every habitation's risk score, Red Zone status, and relocation recommendation
// is derived HERE from raw inputs — nothing is hardcoded per habitation. This is
// what lets the What-If Simulator, Dashboard, Red Zone Intelligence, Relocation
// Planner and Route Intelligence all agree with each other: they all call this
// same function instead of reading independent numbers.
//
// FUTURE BACKEND INTEGRATION:
// Replace the body of computeHazardIntensity() with a call to the trained
// per-hazard model output (see utils/predictionAdapters.js) and keep the same
// return shape so every consumer below keeps working unmodified.
import { REDZONE_STATUS, RELOCATION_TIMEFRAME, confidenceTier } from '../types/geosentra.js'

export const DEFAULT_SCENARIO = {
  rainfallIntensity: 0, // % increase, feeds flood + cloudburst + (lightly) landslide
  floodDepthDelta: 0, // +/- points, feeds flood only
  landslideSusceptibilityDelta: 0, // +/- points, feeds landslide only
  coastalErosionRateDelta: 0, // +/- points, feeds coastal-erosion only
  cloudburstIntensityDelta: 0, // +/- points, feeds cloudburst only
  drainageCapacityDelta: 0, // negative = worse drainage, raises flood + cloudburst
  roadAccessibilityDelta: 0, // negative = worse access, raises infrastructure constraint
  populationVulnerabilityDelta: 0, // +/- points, applied globally
}

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n))

const ROAD_CONSTRAINT = { Good: 15, Moderate: 50, Poor: 90 }
const SHELTER_CONSTRAINT = { Adequate: 15, Limited: 50, Insufficient: 90 }
const HEALTHCARE_BOOST = { Low: 0, Medium: 10, High: 20 }

function computeHazardIntensity(habitation, scenario) {
  let intensity = habitation.hazardIntensityBase
  const hazards = habitation.hazards
  if (hazards.includes('flood')) {
    intensity += scenario.rainfallIntensity * 0.2 + scenario.floodDepthDelta * 0.4 - scenario.drainageCapacityDelta * 0.35
  }
  if (hazards.includes('cloudburst')) {
    intensity += scenario.cloudburstIntensityDelta * 0.5 + scenario.rainfallIntensity * 0.2 - scenario.drainageCapacityDelta * 0.3
  }
  if (hazards.includes('landslide')) {
    intensity += scenario.landslideSusceptibilityDelta * 0.5 + scenario.rainfallIntensity * 0.15
  }
  if (hazards.includes('coastal-erosion')) {
    intensity += scenario.coastalErosionRateDelta * 0.5
  }
  return clamp(intensity)
}

function computePopulationVulnerability(habitation, scenario) {
  const { elderly, children, disabled, healthcareDependency } = habitation.vulnerability
  const fraction = (elderly + children + disabled) / habitation.population
  let score = fraction * 100 * 0.8 + HEALTHCARE_BOOST[healthcareDependency]
  score += scenario.populationVulnerabilityDelta
  return clamp(score)
}

function computeDisasterHistoryScore(habitation) {
  return clamp(habitation.disasterHistory.incidentCount * 18)
}

function computeInfrastructureConstraint(habitation, scenario) {
  let score = ROAD_CONSTRAINT[habitation.roadAccessibility] * 0.6 + SHELTER_CONSTRAINT[habitation.shelterAvailability] * 0.4
  score -= scenario.roadAccessibilityDelta
  return clamp(score)
}

function buildContributingFactors({ hazardIntensity, vulnerability, history, infra, habitation }) {
  const hazardLabel = { flood: 'flood depth', landslide: 'landslide susceptibility', 'coastal-erosion': 'coastal exposure', cloudburst: 'cloudburst intensity' }[
    habitation.primaryHazard
  ]
  const factors = []
  if (hazardIntensity >= 70) factors.push(`High ${hazardLabel}`)
  else if (hazardIntensity >= 45) factors.push(`Elevated ${hazardLabel}`)
  if (vulnerability >= 65) factors.push('High population vulnerability')
  else if (vulnerability >= 40) factors.push('Moderate population vulnerability')
  if (history >= 55) factors.push('Repeated historical incidents')
  if (infra >= 65) factors.push(habitation.roadAccessibility === 'Poor' ? 'Poor road accessibility' : 'Insufficient shelter availability')
  if (factors.length === 0) factors.push('No single dominant contributor — risk is broadly low')
  return factors.slice(0, 4)
}

/**
 * Illustrative frontend prototype calculation.
 * Overall Risk = HazardIntensity*0.40 + PopulationVulnerability*0.25 + DisasterHistory*0.20 + InfrastructureConstraint*0.15
 * A small confidence adjustment pulls the score slightly toward the midpoint when data confidence is low.
 */
export function computeHabitationRisk(habitation, scenario = DEFAULT_SCENARIO) {
  const hazardIntensity = computeHazardIntensity(habitation, scenario)
  const vulnerability = computePopulationVulnerability(habitation, scenario)
  const history = computeDisasterHistoryScore(habitation)
  const infra = computeInfrastructureConstraint(habitation, scenario)

  let riskScore = hazardIntensity * 0.4 + vulnerability * 0.25 + history * 0.2 + infra * 0.15
  const confidenceFactor = habitation.confidence / 100
  riskScore = 50 + (riskScore - 50) * (0.85 + 0.15 * confidenceFactor)
  riskScore = Math.round(clamp(riskScore))

  let status = REDZONE_STATUS.NORMAL
  if (riskScore >= 85) status = REDZONE_STATUS.CRITICAL
  else if (riskScore >= 65) status = REDZONE_STATUS.HIGH_RISK
  else if (riskScore >= 40) status = REDZONE_STATUS.WATCH

  const redZone = status === REDZONE_STATUS.CRITICAL

  let relocationTimeframe = RELOCATION_TIMEFRAME.MONITOR
  let recommendedAction = 'Monitor'
  if (status === REDZONE_STATUS.CRITICAL) {
    relocationTimeframe = RELOCATION_TIMEFRAME.IMMEDIATE
    recommendedAction = 'Relocate'
  } else if (status === REDZONE_STATUS.HIGH_RISK) {
    relocationTimeframe = RELOCATION_TIMEFRAME.SHORT_TERM
    recommendedAction = 'Prepare'
  } else if (status === REDZONE_STATUS.WATCH) {
    relocationTimeframe = RELOCATION_TIMEFRAME.MEDIUM_TERM
    recommendedAction = 'Monitor Closely'
  }

  const vulnerabilityTier = vulnerability >= 65 ? 'High' : vulnerability >= 35 ? 'Medium' : 'Low'

  return {
    riskScore,
    breakdown: {
      hazardIntensity: Math.round(hazardIntensity),
      populationVulnerability: Math.round(vulnerability),
      disasterHistory: Math.round(history),
      infrastructureConstraint: Math.round(infra),
    },
    weights: { hazardIntensity: 0.4, populationVulnerability: 0.25, disasterHistory: 0.2, infrastructureConstraint: 0.15 },
    status,
    redZone,
    relocationTimeframe,
    recommendedAction,
    vulnerabilityTier,
    confidenceTier: confidenceTier(habitation.confidence),
    contributingFactors: buildContributingFactors({ hazardIntensity, vulnerability, history, infra, habitation }),
  }
}

/** Compares baseline (no scenario adjustment) vs. current-scenario status for the "What changed?" panel and audit/alert generation. */
export function computeStatusChange(habitation, scenario) {
  const baseline = computeHabitationRisk(habitation, DEFAULT_SCENARIO)
  const current = computeHabitationRisk(habitation, scenario)
  return {
    changed: baseline.status !== current.status,
    previousStatus: baseline.status,
    currentStatus: current.status,
    previousRiskScore: baseline.riskScore,
    currentRiskScore: current.riskScore,
    baseline,
    current,
  }
}

export function isDefaultScenario(scenario) {
  return Object.entries(DEFAULT_SCENARIO).every(([key, val]) => scenario[key] === val)
}
