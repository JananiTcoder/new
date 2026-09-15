import { useEffect, useMemo, useState } from 'react'
import * as Icons from 'lucide-react'
import { Clock, Navigation2, MapPin, ChevronDown, Info } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LocationSearch from '../../components/ui/LocationSearch'
import GeoMap from '../../components/map/GeoMap'
import { UnavailableState } from '../../components/ui/DataStates'
import { travelProfiles } from '../../data/profiles'
import { routeOrigin, routeDestination, routeGeometry } from '../../data/routes'
import { isAuthoredPair, generateRoutes } from '../../utils/routing'
import { rankRoutesForProfile, getRouteHazardSegments } from '../../utils/routeCalculations'
import { useAppState } from '../../state/AppStateContext'
import { useLanguage } from '../../context/LanguageContext'
import { routeConditionLabel, routeConditionTone } from './citizenLabels'

const ROUTE_ORDER = ['A', 'B', 'C']
const originDefault = { id: 'origin-default', name: routeOrigin.name, lat: routeOrigin.lat, lng: routeOrigin.lng }
const destinationDefault = { id: 'destination-default', name: routeDestination.name, lat: routeDestination.lat, lng: routeDestination.lng }

export default function CitizenRoutes() {
  const { t } = useLanguage()
  const { habitations, safeSites, selectedHabitationId, selectedSiteId, customRoute, setCustomRoute, profileId, setProfileId, scenario } = useAppState()
  const contextHabitation = habitations.find((h) => h.id === selectedHabitationId)
  const contextSite = safeSites.find((s) => s.id === selectedSiteId)

  const [origin, setOrigin] = useState(() => (contextHabitation ? { id: contextHabitation.id, name: contextHabitation.name, lat: contextHabitation.position.lat, lng: contextHabitation.position.lng } : originDefault))
  const [destination, setDestination] = useState(() => (contextSite ? { id: contextSite.id, name: contextSite.name, lat: contextSite.position.lat, lng: contextSite.position.lng } : destinationDefault))
  const [showOthers, setShowOthers] = useState(false)

  useEffect(() => {
    if (customRoute) {
      setOrigin(customRoute.origin)
      setDestination(customRoute.destination)
      setCustomRoute(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customRoute])

  const authored = isAuthoredPair(origin, destination)
  const baseRoutes = useMemo(() => (authored ? ROUTE_ORDER.map((id) => ({ ...routeGeometry[id] })) : generateRoutes(origin, destination)), [authored, origin, destination])
  const routes = useMemo(() => baseRoutes.map((r) => ({ ...r, hazardSegments: getRouteHazardSegments(r, scenario) })), [baseRoutes, scenario])
  const ranked = useMemo(() => (routes.length > 0 ? rankRoutesForProfile(routes, profileId, scenario) : []), [routes, profileId, scenario])

  const swapLocations = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  if (ranked.length === 0) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('routes')}</h1>
        <UnavailableState title="Route information unavailable" hint="Please try again or use the emergency instructions." />
      </div>
    )
  }

  const primary = ranked[0]
  const primaryLabel = routeConditionLabel(primary.stats.tag, true)
  const others = ranked.slice(1)
  const primaryAccessibility = primary.route.accessibility

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('routes')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Illustrative route for this demo — not a live routing engine.</p>
      </div>

      <div className="space-y-2">
        <LocationSearch icon={Navigation2} label="From" value={origin} onChange={setOrigin} />
        <div className="flex justify-center -my-1 relative z-10">
          <button onClick={swapLocations} className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shadow-sm" title="Swap">
            <Icons.ArrowRightLeft size={12} />
          </button>
        </div>
        <LocationSearch icon={MapPin} label="To" value={destination} onChange={setDestination} />
      </div>

      <div className="flex flex-wrap gap-2">
        {travelProfiles.map((p) => {
          const Icon = Icons[p.icon] || Icons.User
          const active = profileId === p.id
          return (
            <button
              key={p.id}
              onClick={() => setProfileId(p.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon size={14} /> {p.label}
            </button>
          )
        })}
      </div>

      <Card className="h-[240px] p-0 overflow-hidden">
        <GeoMap
          markers={[
            { id: 'origin', type: 'origin', position: { lat: origin.lat, lng: origin.lng }, label: origin.name },
            { id: 'destination', type: 'destination', position: { lat: destination.lat, lng: destination.lng }, label: destination.name },
          ]}
          routes={[primary.route]}
          showHazards={false}
        />
      </Card>

      {/* Recommended route */}
      <Card className="p-5 border-2 border-blue-300 dark:border-blue-500/50">
        <Badge tone="blue" className="mb-3">
          {t('recommendedRoute').toUpperCase()}
        </Badge>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{primary.route.name}</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300 mb-3">
          <span className="flex items-center gap-1.5">
            <Navigation2 size={14} className="text-slate-400" /> {primary.route.distanceKm} km
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" /> {primary.stats.timeMin} min
          </span>
          <Badge tone={routeConditionTone(primaryLabel)}>{primaryLabel}</Badge>
        </div>

        {primaryLabel === 'Blocked' && primary.stats.dominantHazardLabel && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3.5 mb-3 text-sm text-red-700 dark:text-red-400">
            <b>Road affected near a {primary.stats.dominantHazardLabel.toLowerCase()} zone.</b> Use the recommended alternate route below.
          </div>
        )}

        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {primaryAccessibility ? (
            <span className={primaryAccessibility.wheelchairFriendly ? 'text-emerald-600 dark:text-emerald-400' : ''}>
              {primaryAccessibility.wheelchairFriendly ? 'Wheelchair-friendly route.' : 'Not wheelchair-friendly.'}
              {primaryAccessibility.floodProneSegment && ' Flood-prone segment present.'}
              {primaryAccessibility.assistanceRequired && ' Assistance may be required.'}
            </span>
          ) : (
            'Accessibility information unavailable for this route.'
          )}
        </div>

        <Button className="w-full">{t('startRoute')}</Button>
      </Card>

      {/* Other routes */}
      {others.length > 0 && (
        <div>
          <button onClick={() => setShowOthers((v) => !v)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
            <ChevronDown size={16} className={`transition-transform ${showOthers ? 'rotate-180' : ''}`} /> {t('otherRoutes')} ({others.length})
          </button>
          {showOthers && (
            <div className="space-y-3">
              {others.map(({ route, stats }) => {
                const label = routeConditionLabel(stats.tag, false)
                return (
                  <Card key={route.id} className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{route.name}</span>
                      <Badge tone={routeConditionTone(label)}>{label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{route.distanceKm} km</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {stats.timeMin} min
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>Route condition is illustrative frontend prototype data — not a live traffic or hazard feed.</span>
      </div>
    </div>
  )
}
