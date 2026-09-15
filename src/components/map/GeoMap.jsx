import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../../context/ThemeContext'

// Plain OpenStreetMap raster tiles: free, no API key, no signup, no billing, ever.
// Dark mode reuses the same tiles with a CSS filter (scoped to .leaflet-tile-pane
// in index.css) instead of a second tile server, since OSM has no dark variant.
const OSM_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}

const MARKER_COLOR = {
  habitation: '#dc2626',
  site: '#059669',
  hospital: '#7c3aed',
  school: '#2563eb',
  shelter: '#0891b2',
  origin: '#1d4ed8',
  destination: '#059669',
  coordinator: '#2563eb',
  volunteer: '#9333ea',
}

const SEVERITY_STYLE = {
  low: { color: '#059669', fillColor: '#059669', fillOpacity: 0.12 },
  medium: { color: '#d97706', fillColor: '#d97706', fillOpacity: 0.16 },
  high: { color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.2 },
  critical: { color: '#991b1b', fillColor: '#991b1b', fillOpacity: 0.3 },
}

function pinIcon(color, big) {
  const size = big ? 30 : 24
  const html = `
    <div class="geo-pin">
      <svg width="${size}" height="${size * 1.3}" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.373 18.627 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="12" r="4.5" fill="white"/>
      </svg>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [size, size * 1.3], iconAnchor: [size / 2, size * 1.3] })
}

// Distinct box/square marker (as opposed to the teardrop pin above) so safe
// sites are visually unmistakable from habitation/hazard/relocation pins at a
// glance — used wherever a marker is passed with `shape: 'box'`.
function boxIcon(color, big) {
  const size = big ? 26 : 20
  const html = `
    <div class="geo-box" style="width:${size}px;height:${size}px;background:${color};border:2.5px solid white;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
      <svg width="${Math.round(size * 0.5)}" height="${Math.round(size * 0.5)}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 12.5L9.5 18L20 6" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

function shelterIcon(color = '#059669', big) {
  const size = big ? 28 : 22
  const html = `
    <div class="geo-shelter" style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <svg width="${Math.round(size * 0.55)}" height="${Math.round(size * 0.55)}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

function coordinatorIcon(color = '#2563eb', big) {
  const size = big ? 28 : 22
  const html = `
    <div class="geo-coordinator" style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:9999px;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <svg width="${Math.round(size * 0.55)}" height="${Math.round(size * 0.55)}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

function volunteerIcon(color = '#9333ea', big) {
  const size = big ? 28 : 22
  const html = `
    <div class="geo-volunteer" style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:9999px;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <svg width="${Math.round(size * 0.55)}" height="${Math.round(size * 0.55)}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

function FitBounds({ points }) {
  const map = useMap()
  const didFit = useRef(false)
  useEffect(() => {
    if (!points || points.length === 0 || didFit.current) return
    if (points.length === 1) {
      map.setView(points[0], 14)
    } else {
      map.fitBounds(points, { padding: [48, 48], maxZoom: 15 })
    }
    didFit.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])
  return null
}

// Keeps Leaflet's internal size in sync whenever the map's container is
// resized for a reason Leaflet itself can't see — the left navigation
// collapsing/expanding or opening as a mobile drawer, a panel opening beside
// the map, window resize, etc. Without this the map keeps rendering at its
// last-known size and shows blank/cropped tiles until the window is nudged.
function ResizeInvalidate() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(container)
    return () => ro.disconnect()
  }, [map])
  return null
}

export default function GeoMap({
  center = [12.9716, 80.2081],
  zoom = 12,
  markers = [],
  showMarkers = true,
  hazardZones = [],
  showHazards = true,
  routes = [],
  selectedRouteId,
  onRouteClick,
  onHazardSegmentClick,
  onHazardZoneClick,
  onMarkerClick,
  selectedMarkerId,
  className = '',
  fitToContent = true,
  interactive = true,
  // Overrides what FitBounds zooms/pans to, without touching which markers/
  // routes are actually rendered — lets a caller keep every operation's
  // marker and route mounted (so selectedRouteId can mute the rest instead
  // of unmounting them) while still framing the view on just the selected
  // route. Falls back to fitting every marker+route when omitted.
  focusPoints,
}) {
  const { theme } = useTheme()

  const fitPoints = useMemo(() => {
    if (!fitToContent) return []
    if (focusPoints) return focusPoints
    const pts = []
    markers.forEach((m) => pts.push([m.position.lat, m.position.lng]))
    routes.forEach((r) => r.positions?.forEach((p) => pts.push(p)))
    return pts
  }, [markers, routes, fitToContent, focusPoints])

  return (
    <div className={`relative isolate w-full h-full overflow-hidden rounded-xl ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        zoomControl={interactive}
        className="w-full h-full"
        style={{ background: theme === 'dark' ? '#0e1420' : '#eef2f7' }}
      >
        <TileLayer url={OSM_TILES.url} attribution={OSM_TILES.attribution} subdomains="abc" maxZoom={19} />

        <ResizeInvalidate />
        {fitPoints.length > 0 && <FitBounds points={fitPoints} />}

        {showHazards &&
          hazardZones.map((z) => (
            <Polygon
              key={z.id}
              positions={z.polygon}
              pathOptions={{ ...SEVERITY_STYLE[z.severity], weight: z.severity === 'critical' ? 2.5 : 1.5 }}
              eventHandlers={{ click: () => onHazardZoneClick?.(z) }}
            >
              {z.label && (
                <Tooltip direction="center" opacity={1} sticky>
                  {z.label}
                </Tooltip>
              )}
            </Polygon>
          ))}

        {routes.map((r) => {
          const isSelected = selectedRouteId ? r.id === selectedRouteId : true
          const isAlternative = r.isAlternative || (selectedRouteId && !isSelected)
          return (
            <Polyline
              key={r.id}
              positions={r.positions}
              pathOptions={{
                color: r.color,
                weight: isSelected ? 5.5 : 3.5,
                opacity: selectedRouteId ? (isSelected ? 0.95 : 0.45) : 0.9,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: r.dashArray || (isAlternative ? '6, 8' : undefined),
              }}
              eventHandlers={{ click: () => onRouteClick?.(r.id) }}
            />
          )
        })}

        {routes.flatMap((r) =>
          (r.hazardSegments || []).map((seg) => (
            <CircleMarker
              key={seg.id}
              center={[seg.position.lat, seg.position.lng]}
              radius={7}
              pathOptions={{ color: '#dc2626', weight: 2.5, fillColor: '#fff', fillOpacity: 1 }}
              eventHandlers={{ click: () => onHazardSegmentClick?.(seg) }}
            />
          ))
        )}

        {showMarkers &&
          markers.map((m) => {
            const isSelected = selectedMarkerId === m.id
            let icon
            if (m.shape === 'coordinator' || m.type === 'coordinator') {
              icon = coordinatorIcon(m.color || MARKER_COLOR.coordinator, isSelected)
            } else if (m.shape === 'volunteer' || m.type === 'volunteer') {
              icon = volunteerIcon(m.color || MARKER_COLOR.volunteer, isSelected)
            } else if (m.shape === 'shelter' || m.shape === 'site' || m.type === 'site' || m.type === 'safeSite') {
              icon = shelterIcon(m.color || MARKER_COLOR.site, isSelected)
            } else if (m.shape === 'box') {
              icon = boxIcon(m.color || MARKER_COLOR[m.type] || '#2563eb', isSelected)
            } else {
              icon = pinIcon(m.color || MARKER_COLOR[m.type] || '#2563eb', isSelected)
            }

            return (
              <Marker
                key={m.id}
                position={[m.position.lat, m.position.lng]}
                icon={icon}
                eventHandlers={{ click: () => onMarkerClick?.(m) }}
              >
                {m.label && (
                  <Tooltip direction="top" offset={[0, -28]} opacity={1}>
                    {m.label}
                  </Tooltip>
                )}
              </Marker>
            )
          })}
      </MapContainer>
    </div>
  )
}
