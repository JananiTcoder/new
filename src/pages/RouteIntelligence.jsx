import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { Navigation, MapPin, Clock, ArrowRightLeft, CheckCircle2, AlertTriangle, X, ShieldCheck, Gauge, Info } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import BottomSheet from '../components/ui/BottomSheet'
import LocationSearch from '../components/ui/LocationSearch'
import AssignmentBreadcrumb from '../components/ui/AssignmentBreadcrumb'
import OperationSummary from '../components/ui/OperationSummary'
import GeoMap from '../components/map/GeoMap'
import { travelProfiles } from '../data/profiles'
import { routeOrigin, routeDestination, routeGeometry, nearestShelters, recommendedShelterId, shelterRecommendationReason } from '../data/routes'
import { isAuthoredPair, generateRoutes } from '../utils/routing'
import { rankRoutesForProfile, explainRoute, getRouteHazardSegments } from '../utils/routeCalculations'
import { planningStepIndex } from '../utils/assignmentCalculations'
import { useAppState } from '../state/AppStateContext'
import { HAZARD_TYPES, OPERATION_STATUS } from '../types/geosentra'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'

const ROUTE_ORDER = ['A', 'B', 'C']

const TAG_DOT = { safest: 'bg-emerald-500', balanced: 'bg-amber-500', 'not-recommended': 'bg-red-500' }
const TAG_BADGE = { safest: 'good', balanced: 'warning', 'not-recommended': 'danger' }

const originDefault = { id: 'origin-default', name: routeOrigin.name, lat: routeOrigin.lat, lng: routeOrigin.lng }
const destinationDefault = { id: 'destination-default', name: routeDestination.name, lat: routeDestination.lat, lng: routeDestination.lng }

export default function RouteIntelligence() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const isCitizen = role === ROLES.CITIZEN
  const { habitations, safeSites, institutions, selectedHabitationId, selectedSiteId, routeOriginOverride, customRoute, setCustomRoute, profileId, setProfileId, scenario, getOperationForHabitation, updateOperationField } = useAppState()
  const contextHabitation = habitations.find((h) => h.id === selectedHabitationId)
  const contextSite = safeSites.find((s) => s.id === selectedSiteId)
  const overrideInstitution = routeOriginOverride?.kind === 'institution' ? institutions.find((i) => i.id === routeOriginOverride.id) : null
  const operation = contextHabitation ? getOperationForHabitation(contextHabitation.id) : null

  const resolveOrigin = () => {
    if (overrideInstitution) return { id: overrideInstitution.id, name: overrideInstitution.name, lat: overrideInstitution.position.lat, lng: overrideInstitution.position.lng }
    if (contextHabitation) return { id: contextHabitation.id, name: contextHabitation.name, lat: contextHabitation.position.lat, lng: contextHabitation.position.lng }
    return originDefault
  }

  const [origin, setOrigin] = useState(resolveOrigin)
  const [destination, setDestination] = useState(() => (contextSite ? { id: contextSite.id, name: contextSite.name, lat: contextSite.position.lat, lng: contextSite.position.lng } : destinationDefault))

  useEffect(() => {
    setOrigin(resolveOrigin())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHabitationId, routeOriginOverride])
  useEffect(() => {
    if (contextSite) setDestination({ id: contextSite.id, name: contextSite.name, lat: contextSite.position.lat, lng: contextSite.position.lng })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId])
  // National Relocations (or any other page) can hand off an arbitrary named
  // origin/destination pair via AppStateContext.setCustomRoute — consume it
  // once on arrival, then clear it so it never shadows normal
  // habitation/site-based navigation afterwards. Declared after the two
  // effects above so it always wins when both fire on the same mount.
  useEffect(() => {
    if (customRoute) {
      setOrigin(customRoute.origin)
      setDestination(customRoute.destination)
      setCustomRoute(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customRoute])

  const [selectedRouteId, setSelectedRouteId] = useState('A')

  const confirmRouteAndContinue = () => {
    updateOperationField(contextHabitation.id, { routeId: selectedRouteId })
    navigate('/app/relocation/validate')
  }

  const [whyRouteId, setWhyRouteId] = useState(null)
  const [hazardSeg, setHazardSeg] = useState(null)
  const [shelterCompareOpen, setShelterCompareOpen] = useState(false)
  const [sheetExpanded, setSheetExpanded] = useState(false)

  const authored = isAuthoredPair(origin, destination)
  const baseRoutes = useMemo(() => (authored ? ROUTE_ORDER.map((id) => ({ ...routeGeometry[id] })) : generateRoutes(origin, destination)), [authored, origin, destination])
  const routes = useMemo(() => baseRoutes.map((r) => ({ ...r, hazardSegments: getRouteHazardSegments(r, scenario) })), [baseRoutes, scenario])
  const ranked = useMemo(() => rankRoutesForProfile(routes, profileId, scenario), [routes, profileId, scenario])

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0]
  const whyRoute = whyRouteId ? routes.find((r) => r.id === whyRouteId) : null
  const explanation = whyRoute ? explainRoute(whyRoute, profileId, scenario) : null

  const markers = [
    { id: 'origin', type: 'origin', position: { lat: origin.lat, lng: origin.lng }, label: origin.name },
    { id: 'destination', type: 'destination', position: { lat: destination.lat, lng: destination.lng }, label: destination.name },
  ]

  const swapLocations = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const stepIndex = operation ? planningStepIndex(operation) : -1
  const showConfirmBanner = operation && operation.status === OPERATION_STATUS.PLANNING && stepIndex === 4
  const showOperationSummary = operation && stepIndex === 6

  const panelContent = (
    <div className="p-5 space-y-6">
      {operation && (showConfirmBanner || showOperationSummary) && (
        <div className="space-y-3">
          <AssignmentBreadcrumb operation={operation} />
          {showConfirmBanner && (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4 space-y-2.5">
              <p className="text-sm text-blue-800 dark:text-blue-300">Confirm the selected route to continue to pre-assignment validation.</p>
              <Button size="sm" onClick={confirmRouteAndContinue}>
                Confirm Route & Continue <Icons.ArrowRight size={14} />
              </Button>
            </div>
          )}
          {showOperationSummary && <OperationSummary habitation={contextHabitation} operation={operation} />}
        </div>
      )}

      <div>
        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">Safe Route Intelligence</h2>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">Illustrative route for frontend demonstration — not a real routing engine.</p>
        <div className="space-y-2">
          <LocationSearch icon={Navigation} label="From" value={origin} onChange={setOrigin} />
          <div className="flex justify-center -my-1 relative z-10">
            <button onClick={swapLocations} className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm" title="Swap origin and destination">
              <ArrowRightLeft size={12} />
            </button>
          </div>
          <LocationSearch icon={MapPin} label="To" value={destination} onChange={setDestination} />
        </div>
        <button onClick={() => setShelterCompareOpen(true)} className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <ShieldCheck size={13} /> Compare nearby shelters
        </button>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2.5">Who is travelling?</div>
        <div className="flex flex-wrap gap-2">
          {travelProfiles.map((p) => {
            const Icon = Icons[p.icon] || Icons.User
            const active = profileId === p.id
            return (
              <button
                key={p.id}
                onClick={() => setProfileId(p.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={14} /> {p.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5 leading-relaxed">{travelProfiles.find((p) => p.id === profileId)?.description}</p>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2.5">Routes to {destination.name}</div>
        <div className="space-y-3">
          {ranked.map(({ route, stats }) => {
            const selected = selectedRouteId === route.id
            return (
              <Card key={route.id} onClick={() => setSelectedRouteId(route.id)} className={`p-4 cursor-pointer transition-all ${selected ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/20' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <span className={`h-2.5 w-2.5 rounded-full ${TAG_DOT[stats.tag]}`} />
                    {route.name}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Clock size={13} /> {stats.timeMin} min
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                  <span className="font-semibold">Route safety score {stats.routeSafetyScore}/100</span>
                  <span>·</span>
                  <span>{route.distanceKm} km</span>
                  {stats.dominantHazardLabel && (
                    <>
                      <span>·</span>
                      <span>{stats.dominantHazardLabel} exposure</span>
                    </>
                  )}
                </div>
                {stats.rankLabel && <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1.5">{stats.rankLabel}</div>}
                <div className="flex items-center justify-between">
                  <Badge tone={TAG_BADGE[stats.tag]}>{stats.label}</Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setWhyRouteId(route.id)
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:gap-1.5 transition-all"
                  >
                    {stats.tag === 'not-recommended' ? 'Why not this route?' : 'Why this route?'} <Icons.ArrowRight size={12} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="lg:flex lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      <div className="relative h-[46vh] lg:h-full lg:flex-1 lg:order-2">
        <GeoMap markers={markers} routes={routes} selectedRouteId={selectedRouteId} onRouteClick={setSelectedRouteId} onHazardSegmentClick={isCitizen ? undefined : setHazardSeg} showHazards={false} className="!rounded-none" />

        <div className="absolute top-4 left-4 z-[500] glass rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Info size={12} /> Illustrative route — not a real routing engine
        </div>

        {hazardSeg && (
          <div className="absolute top-14 right-4 z-[500] w-72 animate-fade-up">
            <Card className="p-4 relative">
              <button onClick={() => setHazardSeg(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X size={16} />
              </button>
              <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">Road Segment</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{hazardSeg.label}</div>
              <div className="space-y-2 text-sm">
                <SegRow label="Hazard" value={HAZARD_TYPES.find((h) => h.id === hazardSeg.hazard)?.label || hazardSeg.hazard} />
                <SegRow label="Risk Level" value={hazardSeg.risk} danger={hazardSeg.risk === 'HIGH'} />
                {hazardSeg.waterloggingProbability != null && <SegRow label="Waterlogging probability" value={`${hazardSeg.waterloggingProbability}%`} />}
                {hazardSeg.estimatedDepthM != null && <SegRow label="Estimated depth" value={`${hazardSeg.estimatedDepthM} m`} />}
                {hazardSeg.accessibility && <SegRow label="Accessibility" value={hazardSeg.accessibility} />}
                <SegRow label="Data confidence" value={`${hazardSeg.confidence}%`} />
              </div>
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-400">{hazardSeg.recommendedAction}</div>
              <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">{hazardSeg.reason}</div>
            </Card>
          </div>
        )}
      </div>

      <div className="hidden lg:block lg:w-[420px] lg:shrink-0 lg:order-1 lg:h-full lg:overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">{panelContent}</div>

      <BottomSheet expanded={sheetExpanded} onToggle={() => setSheetExpanded((v) => !v)} peek="42vh" title={sheetExpanded ? 'Show less' : 'Route Intelligence'}>
        {panelContent}
      </BottomSheet>

      <Modal open={!!whyRouteId} onClose={() => setWhyRouteId(null)} title={explanation?.title} side>
        {explanation && whyRoute && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <ScoreBlock icon={Gauge} label="Risk score" value={`${explanation.riskScore} / 100`} tone={explanation.recommended ? 'good' : 'danger'} />
              <ScoreBlock icon={CheckCircle2} label="Confidence" value={`${explanation.confidence}%`} />
              <ScoreBlock icon={Clock} label="Freshness" value={explanation.freshness} />
            </div>

            {!isCitizen && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Hazard Exposure (all four monitored hazards)</div>
                <div className="grid grid-cols-2 gap-2">
                  {HAZARD_TYPES.map((h) => {
                    const val = rankRoutesForProfile([whyRoute], profileId, scenario)[0].stats.exposure[h.id]
                    return (
                      <div key={h.id} className="rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">{h.label}</span>
                        <span className={`font-bold ${val >= 50 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {explanation.summary && <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-4 text-sm text-red-700 dark:text-red-400 leading-relaxed">{explanation.summary}</div>}

            <div className="space-y-3">
              {(explanation.points || explanation.warnings).map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  {explanation.points ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSelectedRouteId(whyRouteId)
                setWhyRouteId(null)
              }}
            >
              Select this route
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={shelterCompareOpen} onClose={() => setShelterCompareOpen(false)} title="Nearest Safe Shelters">
        <div className="space-y-3">
          {nearestShelters.map((s) => {
            const recommended = s.id === recommendedShelterId
            return (
              <Card key={s.id} className={`p-4 ${recommended ? 'border-emerald-300 dark:border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-500/20' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{s.name}</span>
                  {recommended && (
                    <Badge tone="good" icon={ShieldCheck}>
                      Recommended
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{s.distanceKm} km</span>
                  <span>{s.timeMin} min</span>
                  <span className={s.capacityPct > 80 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>Capacity {s.capacityPct}%</span>
                </div>
              </Card>
            )
          })}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-3.5 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">{shelterRecommendationReason}</div>
        </div>
      </Modal>
    </div>
  )
}

function SegRow({ label, value, danger }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-bold ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>{value}</span>
    </div>
  )
}

function ScoreBlock({ icon: Icon, label, value, tone }) {
  const toneClass = tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' : tone === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
  return (
    <div className="flex-1 rounded-xl bg-slate-50 dark:bg-white/5 p-3">
      <Icon size={14} className="text-slate-400 mb-1" />
      <div className={`text-sm font-bold ${toneClass}`}>{value}</div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  )
}
