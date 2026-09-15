// Shared citizen-friendly terminology mapping — every Citizen page uses these
// instead of showing raw scores/tags, per the "avoid confusing terms" rule.
// Pure functions, no state, no randomness — just a translation layer over
// the same deterministic values the admin pages already compute.
import { REDZONE_STATUS } from '../../types/geosentra'
import { OPERATING_STATUS } from '../../types/provider'

export function riskLabel(status) {
  switch (status) {
    case REDZONE_STATUS.CRITICAL:
      return 'Critical'
    case REDZONE_STATUS.HIGH_RISK:
      return 'High'
    case REDZONE_STATUS.WATCH:
      return 'Moderate'
    case REDZONE_STATUS.NORMAL:
    default:
      return 'Low'
  }
}

export function riskToneForLabel(label) {
  if (label === 'Critical' || label === 'High') return 'danger'
  if (label === 'Moderate') return 'warning'
  return 'good'
}

/** Shelter status wording — "Space available" / "Filling up" / "Almost full" / "Full" / "Temporarily unavailable" / "Data unavailable". */
export function capacityStatusLabel(loadPct, operatingStatus) {
  if (operatingStatus === OPERATING_STATUS.CLOSED) return 'Temporarily unavailable'
  if (loadPct == null || Number.isNaN(loadPct)) return 'Data unavailable'
  if (loadPct >= 100) return 'Full'
  if (loadPct >= 90) return 'Almost full'
  if (loadPct >= 60) return 'Filling up'
  return 'Space available'
}

export function capacityToneForLabel(label) {
  if (label === 'Full' || label === 'Almost full') return 'danger'
  if (label === 'Filling up') return 'warning'
  if (label === 'Space available') return 'good'
  return 'default'
}

/** Route condition wording — the top-ranked route is upgraded to "Recommended"; other "safest"-tagged routes read "Safe". */
export function routeConditionLabel(tag, isTopRanked) {
  if (tag === 'safest') return isTopRanked ? 'Recommended' : 'Safe'
  if (tag === 'balanced') return 'Use caution'
  if (tag === 'not-recommended') return 'Blocked'
  return 'Data unavailable'
}

export function routeConditionTone(label) {
  if (label === 'Recommended' || label === 'Safe') return 'good'
  if (label === 'Use caution') return 'warning'
  if (label === 'Blocked') return 'danger'
  return 'default'
}
