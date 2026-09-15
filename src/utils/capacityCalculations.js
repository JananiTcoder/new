// Illustrative frontend prototype calculation.
// Effective carrying capacity is bound by the weakest essential service, not by
// physical land area alone. This file is the single source of truth for that
// logic so Safe Sites, the Relocation Planner, the Dashboard and What-If all
// agree on the same number for the same site.
//
// FUTURE BACKEND INTEGRATION:
// Replace `site.capacity.*` inputs with values returned by getSafeSiteCapacity()
// once a real infrastructure/GIS survey feed exists (see predictionAdapters.js).

export const CAPACITY_DIMENSIONS = [
  { key: 'physicalCapacity', label: 'Physical Capacity' },
  { key: 'waterCapacity', label: 'Water Capacity' },
  { key: 'medicalCapacity', label: 'Medical Support Capacity' },
  { key: 'sanitationCapacity', label: 'Sanitation Capacity' },
  { key: 'foodCapacity', label: 'Food Capacity' },
  { key: 'accessibilityCapacity', label: 'Accessibility Capacity' },
]

/** Effective capacity = the smallest of the six supporting-infrastructure dimensions. */
export function computeEffectiveCapacity(site) {
  let bottleneckKey = CAPACITY_DIMENSIONS[0].key
  let min = Infinity
  for (const d of CAPACITY_DIMENSIONS) {
    const val = site.capacity[d.key]
    if (val < min) {
      min = val
      bottleneckKey = d.key
    }
  }
  return {
    effectiveCapacity: min,
    bottleneckKey,
    bottleneckLabel: CAPACITY_DIMENSIONS.find((d) => d.key === bottleneckKey).label,
  }
}

/** Available capacity = effective capacity - current occupancy - reserved capacity - anything already allocated in a draft plan. */
export function computeAvailableCapacity(site, allocatedSoFar = 0) {
  const { effectiveCapacity } = computeEffectiveCapacity(site)
  return Math.max(0, effectiveCapacity - site.currentOccupancy - site.reservedCapacity - allocatedSoFar)
}

export function computeCurrentLoadPct(site) {
  const { effectiveCapacity } = computeEffectiveCapacity(site)
  if (effectiveCapacity === 0) return 100
  return Math.round(((site.currentOccupancy + site.reservedCapacity) / effectiveCapacity) * 100)
}

const ROAD_ACCESS_SCORE = { Excellent: 95, Good: 80, Moderate: 55, Poor: 25 }
const LIVELIHOOD_SCORE = { Good: 85, Medium: 60, Low: 30 }

/**
 * Suitability score is a distinct concept from safety score: it blends this
 * site's safety with how well it can actually absorb THIS habitation right now
 * (capacity headroom, road access, livelihood continuity). A safer site can
 * still be a worse match if it can't hold everyone or is far from livelihoods.
 */
export function computeSuitabilityScore(site, habitation, availableCapacity) {
  const capacityRatio = habitation ? Math.min(1.3, availableCapacity / habitation.population) : 1
  const capacityComponent = Math.min(100, capacityRatio * 80)
  const roadComponent = ROAD_ACCESS_SCORE[site.roadAccess] ?? 50
  const livelihoodComponent = LIVELIHOOD_SCORE[site.livelihoodAccess] ?? 50
  const score = site.safetyScoreBase * 0.45 + capacityComponent * 0.3 + roadComponent * 0.15 + livelihoodComponent * 0.1
  return Math.round(Math.max(0, Math.min(100, score)))
}
