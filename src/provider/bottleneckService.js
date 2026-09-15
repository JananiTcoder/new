// Real bottleneck calculation, built only from provider-submitted capacity +
// the existing habitation population data. Replaces "random bottleneck
// generation" with a deterministic pipeline:
//
//   requiredPopulation (sum of habitation population in a district)
//   totalUsableCapacity (sum of available capacity from active, non-rejected providers)
//   capacityGap = requiredPopulation - totalUsableCapacity
//
// Every card produced here carries its own source count, gap and confidence
// label so nothing is presented as an official government statistic.
import { VERIFICATION_STATUS, OPERATING_STATUS, DETAIL_CATEGORY, detailCategoryForAccountType } from '../types/provider'
import { aggregateCapacity, groupByDistrict, dataStatusLabel } from './capacityService'

const BOTTLENECK_TYPE = {
  SHELTER_SHORTAGE: 'Shelter Capacity Shortage',
  MEDICAL_SHORTAGE: 'Medical Capacity Shortage',
  FACILITY_GAP: 'Infrastructure Facility Gap',
  VERIFICATION_PENDING: 'Verification Pending',
}

function isActive(provider, capacity) {
  return capacity && provider.verificationStatus !== VERIFICATION_STATUS.REJECTED && capacity.operatingStatus !== OPERATING_STATUS.CLOSED
}

/**
 * @param {{providers: object[], capacitiesById: Record<string,object>, detailsById: Record<string,object>, habitations: object[]}} input
 * @returns {object[]} one bottleneck summary card per district that has either habitation population or registered providers.
 */
export function computeDistrictBottlenecks({ providers, capacitiesById, detailsById, habitations }) {
  const providersByDistrict = groupByDistrict(providers)
  const populationByDistrict = {}
  habitations.forEach((h) => {
    populationByDistrict[h.district] = (populationByDistrict[h.district] || 0) + h.population
  })

  const districts = new Set([...Object.keys(providersByDistrict), ...Object.keys(populationByDistrict)])

  return Array.from(districts)
    .sort()
    .map((district) => {
      const districtProviders = providersByDistrict[district] || []
      const requiredPopulation = populationByDistrict[district] || 0
      const agg = aggregateCapacity(districtProviders, capacitiesById)
      const capacityGap = requiredPopulation - agg.availableCapacity

      const unverifiedCount = districtProviders.filter((p) => p.verificationStatus === VERIFICATION_STATUS.PENDING || p.verificationStatus === VERIFICATION_STATUS.NEEDS_CORRECTION).length

      const hospitalShortfall = districtProviders.some((p) => {
        if (detailCategoryForAccountType(p.accountType) !== DETAIL_CATEGORY.HOSPITAL) return false
        const hd = detailsById[p.id]?.hospital
        const c = capacitiesById[p.id]
        if (!hd || !isActive(p, c)) return false
        return hd.availableBeds <= Math.max(2, Math.round(hd.totalBeds * 0.1))
      })

      const facilityGap = districtProviders.some((p) => {
        const c = capacitiesById[p.id]
        if (!isActive(p, c) || !c.totalCapacity) return false
        return !c.waterAvailable || !c.toiletsAvailable || !c.electricityAvailable
      })

      let bottleneckType = null
      if (capacityGap > 0) bottleneckType = BOTTLENECK_TYPE.SHELTER_SHORTAGE
      else if (hospitalShortfall) bottleneckType = BOTTLENECK_TYPE.MEDICAL_SHORTAGE
      else if (facilityGap) bottleneckType = BOTTLENECK_TYPE.FACILITY_GAP
      else if (unverifiedCount > 0) bottleneckType = BOTTLENECK_TYPE.VERIFICATION_PENDING

      const mostRecentUpdate = districtProviders.reduce((latest, p) => {
        const c = capacitiesById[p.id]
        if (!c?.lastUpdated) return latest
        return !latest || c.lastUpdated > latest ? c.lastUpdated : latest
      }, null)

      return {
        district,
        requiredPopulation,
        totalUsableCapacity: agg.availableCapacity,
        totalRegisteredCapacity: agg.totalCapacity,
        capacityGap,
        bottleneckType,
        providerCount: districtProviders.length,
        activeProviderCount: agg.providerCount,
        unverifiedCount,
        lastUpdated: mostRecentUpdate,
        confidence: districtProviders.length === 0 ? 'No providers registered' : districtProviders.every((p) => p.isDemo) ? 'Demo data' : 'Self-reported',
      }
    })
}

export { BOTTLENECK_TYPE }

/**
 * Emergency Coordinator capacity-shortage summary for one required population
 * figure against the full active provider network (not district-scoped) —
 * used for "is there enough capacity anywhere" style questions.
 */
export function computeOverallShortage({ providers, capacitiesById, requiredPopulation }) {
  const agg = aggregateCapacity(providers, capacitiesById)
  const capacityShortage = requiredPopulation - agg.availableCapacity
  return {
    ...agg,
    requiredPopulation,
    capacityShortage,
    label: capacityShortage > 0 ? 'Capacity Shortage' : 'Capacity Available',
  }
}

export { dataStatusLabel }
