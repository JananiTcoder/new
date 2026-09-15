// Pure calculation utilities for provider capacity. No React, no I/O — these
// are the single source of truth for turning raw provider-submitted numbers
// into the status labels / colors used across Safe Sites, the map, the
// Disaster Authority registry, Emergency Coordinator and Citizen views.
//
// CORE REQUIREMENT: nothing in this file (or anywhere downstream of it) may
// use Math.random() for a capacity, occupancy, availability or bottleneck
// value. Every number here is either provider-submitted or a deterministic
// calculation over provider-submitted numbers.
import { AVAILABILITY_STATUS, STATUS_COLOR, DATA_STATUS, STALE_AFTER_DAYS, OPERATING_STATUS, VERIFICATION_STATUS } from '../types/provider'

export function occupiedPlusReserved(capacity) {
  if (!capacity) return 0
  return (capacity.occupiedCapacity || 0) + (capacity.reservedCapacity || 0)
}

export function currentLoadPct(capacity) {
  if (!capacity || !capacity.totalCapacity) return 0
  return Math.round((occupiedPlusReserved(capacity) / capacity.totalCapacity) * 100)
}

/**
 * Availability status is derived purely from operating status + the ratio of
 * available capacity to total capacity — never randomized, never invented
 * when data is missing.
 */
export function availabilityStatus(capacity) {
  if (!capacity) return AVAILABILITY_STATUS.NO_DATA
  if (capacity.operatingStatus === OPERATING_STATUS.CLOSED) return AVAILABILITY_STATUS.UNAVAILABLE
  if (!capacity.totalCapacity || capacity.totalCapacity <= 0) return AVAILABILITY_STATUS.NO_DATA
  const ratio = Math.max(0, capacity.availableCapacity || 0) / capacity.totalCapacity
  if (ratio <= 0) return AVAILABILITY_STATUS.FULL
  if (ratio < 0.15) return AVAILABILITY_STATUS.LIMITED
  return AVAILABILITY_STATUS.AVAILABLE
}

/** Marker/badge color for a provider, folding in verification + active state per the map spec (Green/Amber/Red/Grey). */
export function markerColorForProvider(provider, capacity) {
  if (!provider || provider.verificationStatus === VERIFICATION_STATUS.REJECTED) return STATUS_COLOR[AVAILABILITY_STATUS.UNAVAILABLE]
  if (!capacity || capacity.operatingStatus === OPERATING_STATUS.CLOSED) return STATUS_COLOR[AVAILABILITY_STATUS.UNAVAILABLE]
  return STATUS_COLOR[availabilityStatus(capacity)]
}

export function isStale(lastUpdated, thresholdDays = STALE_AFTER_DAYS) {
  if (!lastUpdated) return false
  const ageMs = Date.now() - new Date(lastUpdated).getTime()
  return ageMs > thresholdDays * 24 * 60 * 60 * 1000
}

/** The transparency label to show next to any capacity figure for this provider. */
export function dataStatusLabel(provider) {
  if (!provider) return DATA_STATUS.MISSING
  if (provider.isDemo) return DATA_STATUS.DEMO
  if (provider.verificationStatus === VERIFICATION_STATUS.VERIFIED) return DATA_STATUS.VERIFIED
  if (provider.verificationStatus === VERIFICATION_STATUS.PENDING || provider.verificationStatus === VERIFICATION_STATUS.NEEDS_CORRECTION) return DATA_STATUS.AWAITING_VERIFICATION
  return DATA_STATUS.SELF_REPORTED
}

/** Full computed snapshot for one provider — this is what dashboards/cards/markers all read from. */
export function computeProviderSnapshot(provider, capacity) {
  const status = availabilityStatus(capacity)
  return {
    provider,
    capacity,
    status,
    color: markerColorForProvider(provider, capacity),
    loadPct: currentLoadPct(capacity),
    dataStatusLabel: dataStatusLabel(provider),
    stale: isStale(capacity?.lastUpdated),
    hasCapacityData: !!capacity && capacity.totalCapacity > 0,
  }
}

/** Aggregate active (non-closed, non-rejected) provider capacity across a list. */
export function aggregateCapacity(providers, capacitiesById) {
  let total = 0
  let available = 0
  let occupied = 0
  let reserved = 0
  let providerCount = 0
  providers.forEach((p) => {
    const c = capacitiesById[p.id]
    if (!c || p.verificationStatus === VERIFICATION_STATUS.REJECTED || c.operatingStatus === OPERATING_STATUS.CLOSED) return
    total += c.totalCapacity || 0
    available += c.availableCapacity || 0
    occupied += c.occupiedCapacity || 0
    reserved += c.reservedCapacity || 0
    providerCount += 1
  })
  return { totalCapacity: total, availableCapacity: available, occupiedCapacity: occupied, reservedCapacity: reserved, providerCount }
}

export function groupByDistrict(providers) {
  const map = {}
  providers.forEach((p) => {
    const key = p.district || 'Unspecified District'
    if (!map[key]) map[key] = []
    map[key].push(p)
  })
  return map
}

/**
 * Provider infrastructure "connected to" a given Safe Site — matched by
 * district, since safeSites.js and providerSeed.js already share the same
 * district vocabulary as the rest of the app. No new linking field invented;
 * a district with zero registered providers legitimately produces an empty
 * result (see the "No verified infrastructure available" empty state).
 */
export function getInfrastructureForSafeSite(safeSite, providers, capacitiesById) {
  if (!safeSite) return []
  return providers
    .filter((p) => p.district === safeSite.district && p.verificationStatus !== VERIFICATION_STATUS.REJECTED)
    .map((p) => computeProviderSnapshot(p, capacitiesById[p.id]))
}

export function groupByAccountType(providers) {
  const map = {}
  providers.forEach((p) => {
    const key = p.accountType || 'Other'
    if (!map[key]) map[key] = []
    map[key].push(p)
  })
  return map
}
