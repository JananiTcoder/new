import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import GeoMap from '../components/map/GeoMap'
import AlertTicker from '../components/layout/AlertTicker'
import AnalyticsPanel from '../components/map/AnalyticsPanel'
import { LegendDot, LegendBox } from '../components/map/MapLegend'
import { LAYER_DEFS, SAFE_SITE_COLOR } from '../components/map/mapLayerDefs'
import { computeOverviewMetrics, shelters, hospitals, schools } from '../data/dashboard'
import { safeSites } from '../data/safeSites'
import { hazardZones, severityLevels } from '../data/hazards'
import { useAppState } from '../state/AppStateContext'
import { useProviderData } from '../provider/providerStore'
import { deriveAlerts, filterAlertsForRole } from '../utils/alerts'
import { ROLES } from '../auth/roleConfig'

// Authority Overview: a full-page, Google-Maps-like operational map with the
// alert ticker directly above it. Everything the old card-based Overview
// showed (Priority Habitations, Recent Decisions, Resource Network, the
// frontend data-status panel, the 8 KPI cards) now lives one click away in
// the "View Analytics" drawer instead of permanently occupying page space.
export default function AuthorityOverview() {
  const navigate = useNavigate()
  const { habitations, institutions, selectHabitation, scenario, operations, coordinators, volunteers } = useAppState()
  const [layers, setLayers] = useState({ hazards: true, population: true, infrastructure: true, safeSites: true })
  const [analyticsOpen, setAnalyticsOpen] = useState(false)

  const toggleLayer = (id) => setLayers((prev) => ({ ...prev, [id]: !prev[id] }))

  const { providers, capacitiesById } = useProviderData()
  const overviewMetrics = computeOverviewMetrics({ scenario, operations, coordinators, volunteers, providers, capacitiesById })

  const alerts = filterAlertsForRole(deriveAlerts({ habitations, safeSites, institutions, scenario, operations, coordinators, volunteers }), ROLES.DISASTER_AUTHORITY)
  const tickerItems = alerts.map((a) => `${a.type}: ${a.message}`)

  const safeSiteMarkers = safeSites.map((s) => ({ id: s.id, type: 'site', shape: 'box', color: SAFE_SITE_COLOR, position: s.position, label: s.name }))
  const markers = [
    ...(layers.population ? habitations.map((h) => ({ id: h.id, type: 'habitation', position: h.position, label: h.name, priority: h.risk.status })) : []),
    ...(layers.safeSites ? safeSiteMarkers : []),
    ...(layers.infrastructure ? [...shelters, ...hospitals, ...schools].map((m) => ({ id: m.id, type: m.type, position: m.position, label: m.name })) : []),
  ]

  const analyticsMetrics = overviewMetrics.map((m) => ({
    ...m,
    onClick: () => {
      setAnalyticsOpen(false)
      navigate(
        m.id === 'redzones' || m.id === 'unassigned' || m.id === 'criticalpending'
          ? '/app/habitations'
          : m.id === 'routesinprogress' || m.id === 'recentlyassigned' || m.id === 'coordinatorsavailable' || m.id === 'volunteersavailable'
          ? '/app/operations'
          : '/app/resource-network'
      )
    },
  }))

  const openHabitation = (id) => {
    selectHabitation(id)
    navigate(`/app/habitations/${id}`)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AlertTicker items={tickerItems} />

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <GeoMap
          className="rounded-none"
          markers={markers}
          hazardZones={hazardZones}
          showHazards={layers.hazards}
          onMarkerClick={(m) => {
            if (m.type === 'habitation') openHabitation(m.id)
            if (m.type === 'site') navigate('/app/safe-sites')
          }}
        />

        <div className="absolute top-4 right-4 z-[500] glass rounded-2xl p-3 shadow-lg w-52">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">Map Layers</div>
          <div className="space-y-1">
            {LAYER_DEFS.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                aria-pressed={layers[l.id]}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  layers[l.id] ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <l.icon size={15} />
                {l.label}
              </button>
            ))}
          </div>
          <div className="h-px bg-slate-200 dark:bg-white/10 my-2" />
          <button
            onClick={() => setAnalyticsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={analyticsOpen}
            aria-controls="authority-analytics-panel"
            aria-label="View analytics"
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <BarChart3 size={15} />
            View Analytics
          </button>
        </div>

        <div className="absolute bottom-4 left-4 z-[500] glass rounded-2xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-4 text-xs max-w-[90%]">
          {severityLevels.map((s) => (
            <LegendDot key={s.id} color={s.color} label={s.label} />
          ))}
          <span className="h-3.5 w-px bg-slate-300 dark:bg-slate-600" />
          <LegendBox color={SAFE_SITE_COLOR} label="Safe Sites" />
        </div>

        <AnalyticsPanel open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} metrics={analyticsMetrics} />
      </div>
    </div>
  )
}
