// Site-match ranking for a given habitation. Every match is computed live from
// utils/capacityCalculations.js (bottleneck + available capacity + suitability)
// so it always agrees with what Safe Sites and the Relocation Planner show —
// there is no separate hand-authored "best match" table to fall out of sync.
import { safeSites } from './safeSites'
import { haversineKm } from '../utils/geo'
import { computeEffectiveCapacity, computeAvailableCapacity, computeSuitabilityScore } from '../utils/capacityCalculations'

export function getRelocationMatches(habitation) {
  const matches = safeSites.map((site) => {
    const availableCapacity = computeAvailableCapacity(site)
    const { effectiveCapacity, bottleneckLabel } = computeEffectiveCapacity(site)
    const matchScore = computeSuitabilityScore(site, habitation, availableCapacity)
    const distanceKm = +haversineKm(habitation.position, site.position).toFixed(1)
    const sufficient = availableCapacity >= habitation.population

    return {
      siteId: site.id,
      siteName: site.name,
      matchScore,
      availableCapacity,
      effectiveCapacity,
      bottleneckLabel,
      distanceKm,
      safetyScore: site.safetyScoreBase,
      infrastructure: site.roadAccess,
      livelihoodContinuity: site.livelihoodAccess,
      sufficient,
      whyNot: sufficient
        ? undefined
        : `${site.name} can currently accept ${availableCapacity.toLocaleString()} of the ${habitation.population.toLocaleString()} residents who need to move — capacity is bound by ${bottleneckLabel.toLowerCase()}.`,
    }
  })

  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((m, i) => ({ ...m, recommendation: i === 0 ? 'BEST MATCH' : m.sufficient ? 'ALTERNATE OPTION' : 'PARTIAL MATCH' }))
}
