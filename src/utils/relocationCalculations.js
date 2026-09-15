// Illustrative frontend prototype calculation — a working, local-only
// relocation allocation planner. No allocation is ever sent anywhere; it lives
// entirely in AppStateContext (in-memory) for the duration of the session.
import { computeEffectiveCapacity } from './capacityCalculations'

/**
 * @param {object} habitation
 * @param {{siteId:string, amount:number}[]} allocations
 * @param {object[]} sites
 */
export function planAllocation(habitation, allocations, sites) {
  const populationNeeding = habitation.population
  let allocatedTotal = 0

  const perSite = allocations
    .filter((a) => a.amount > 0)
    .map((a) => {
      const site = sites.find((s) => s.id === a.siteId)
      const { effectiveCapacity, bottleneckLabel } = computeEffectiveCapacity(site)
      const availableCapacity = Math.max(0, effectiveCapacity - site.currentOccupancy - site.reservedCapacity)
      const overCapacity = a.amount > availableCapacity
      allocatedTotal += a.amount
      return {
        siteId: a.siteId,
        siteName: site.name,
        amount: a.amount,
        availableCapacity,
        overCapacity,
        overCapacityBy: overCapacity ? a.amount - availableCapacity : 0,
        bottleneckLabel,
        remainingAfter: Math.max(0, availableCapacity - a.amount),
      }
    })

  const unallocated = Math.max(0, populationNeeding - allocatedTotal)
  const hasOvercapacity = perSite.some((p) => p.overCapacity)

  return {
    habitationId: habitation.id,
    populationNeeding,
    allocatedTotal,
    unallocated,
    perSite,
    hasOvercapacity,
    isComplete: unallocated === 0 && allocatedTotal > 0,
    isPartial: allocatedTotal > 0 && unallocated > 0,
  }
}
