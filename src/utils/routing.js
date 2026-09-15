// Generates illustrative route GEOMETRY only for a custom origin/destination
// pair (bent slightly apart so "safest / balanced / fastest" are visually
// distinct on the map). This is NOT a real routing/street-network engine.
// Hazard exposure and risk scoring for whatever geometry comes out of here is
// computed uniformly by utils/routeCalculations.js — same as the hand-authored
// default routes in data/routes.js.
import { haversineKm } from './geo'
import { routeOrigin, routeDestination, routeGeometry } from '../data/routes'

export function isAuthoredPair(origin, destination) {
  const close = (a, b) => Math.abs(a.lat - b.lat) < 0.002 && Math.abs(a.lng - b.lng) < 0.002
  return close(origin, routeOrigin) && close(destination, routeDestination)
}

function offsetPoint(a, b, t, mag) {
  const lat = a.lat + (b.lat - a.lat) * t
  const lng = a.lng + (b.lng - a.lng) * t
  const dx = b.lng - a.lng
  const dy = b.lat - a.lat
  const len = Math.hypot(dx, dy) || 1
  const px = -dy / len
  const py = dx / len
  return [lat + py * mag, lng + px * mag]
}

const VARIANTS = [
  { id: 'A', name: 'Safest Route', color: '#059669', bend: 0.008 },
  { id: 'B', name: 'Balanced Route', color: '#d97706', bend: 0.0015 },
  { id: 'C', name: 'Fastest Route', color: '#dc2626', bend: -0.005 },
]

export function generateRoutes(origin, destination) {
  const distKm = haversineKm(origin, destination)
  return VARIANTS.map((v) => {
    const mid1 = offsetPoint(origin, destination, 0.33, v.bend)
    const mid2 = offsetPoint(origin, destination, 0.66, v.bend * 0.6)
    const positions = [[origin.lat, origin.lng], mid1, mid2, [destination.lat, destination.lng]]
    const routeDistKm = distKm * (1 + Math.abs(v.bend) * 6)
    return {
      id: v.id,
      name: v.name,
      color: v.color,
      positions,
      distanceKm: +routeDistKm.toFixed(1),
    }
  })
}

const ROUTE_VARIANT_ORDER = VARIANTS.map((v) => v.id)

/**
 * Resolves the SAME route geometry a habitation -> safe site pair would have
 * produced on the Choose Site / Relocation Planner pages, then picks the one
 * variant matching a stored operation.routeId. Shared by every page that
 * needs to redraw an already-assigned operation's route (OperationStatusPage,
 * the Operation Management overview map) so none of them re-implement this
 * origin/destination -> geometry resolution on their own.
 */
export function resolveOperationRoute(habitation, site, routeId) {
  if (!routeId || !habitation || !site) return null
  const origin = { lat: habitation.position.lat, lng: habitation.position.lng }
  const destination = { lat: site.position.lat, lng: site.position.lng }
  const variants = isAuthoredPair(origin, destination) ? ROUTE_VARIANT_ORDER.map((id) => ({ ...routeGeometry[id] })) : generateRoutes(origin, destination)
  return variants.find((r) => r.id === routeId) || null
}
