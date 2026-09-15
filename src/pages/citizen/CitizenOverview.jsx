import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Navigation, MapPin, Route as RouteIcon, Clock, FileWarning, Siren, ChevronRight, Bell } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ConnectionStatus from '../../components/ui/ConnectionStatus'
import { NoRiskState, NoAlertsState } from '../../components/ui/DataStates'
import GeoMap from '../../components/map/GeoMap'
import { getRelocationMatches } from '../../data/relocationMatches'
import { generateRoutes } from '../../utils/routing'
import { rankRoutesForProfile } from '../../utils/routeCalculations'
import { deriveAlerts, filterAlertsForRole } from '../../utils/alerts'
import { useAppState } from '../../state/AppStateContext'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { ROLES } from '../../auth/roleConfig'
import { REDZONE_STATUS } from '../../types/geosentra'
import { riskLabel, riskToneForLabel } from './citizenLabels'

const RISK_KEY = { Low: 'riskLow', Moderate: 'riskModerate', High: 'riskHigh', Critical: 'riskCritical' }

export default function CitizenOverview() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { t } = useLanguage()
  const { habitations, safeSites, institutions, scenario, selectedHabitationId, operations, coordinators, volunteers, setCustomRoute, readAlertIds } = useAppState()
  const myHabitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const risk = myHabitation.risk
  const label = riskLabel(risk.status)
  const noRisk = risk.status === REDZONE_STATUS.NORMAL

  const bestMatch = getRelocationMatches(myHabitation)[0]
  const recommendedSite = safeSites.find((s) => s.id === bestMatch?.siteId)

  const routes = recommendedSite ? generateRoutes(myHabitation.position, recommendedSite.position) : []
  const rankedRoutes = routes.length > 0 ? rankRoutesForProfile(routes, 'young-adult', scenario) : []
  const bestRoute = rankedRoutes[0]

  const alerts = filterAlertsForRole(deriveAlerts({ habitations, safeSites, institutions, scenario, operations, coordinators, volunteers }), role).filter((a) => !readAlertIds.has(a.id))
  const topAlerts = alerts.slice(0, 2)

  const goToRecommendedRoute = () => {
    if (!recommendedSite) return
    setCustomRoute({
      origin: { id: myHabitation.id, name: myHabitation.name, lat: myHabitation.position.lat, lng: myHabitation.position.lng },
      destination: { id: recommendedSite.id, name: recommendedSite.name, lat: recommendedSite.position.lat, lng: recommendedSite.position.lng },
    })
    navigate('/app/routes')
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Safety Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
          <MapPin size={14} /> {myHabitation.name}, {myHabitation.district}
        </p>
      </div>

      {/* Primary recommendation card — the one thing a citizen needs to understand within seconds */}
      <Card className={`p-6 border-2 ${label === 'Critical' || label === 'High' ? 'border-red-300 dark:border-red-500/50' : label === 'Moderate' ? 'border-amber-300 dark:border-amber-500/50' : 'border-emerald-300 dark:border-emerald-500/50'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Badge tone={riskToneForLabel(label)} className="text-sm px-3 py-1.5">
            {t(RISK_KEY[label]).toUpperCase()} RISK
          </Badge>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {t('riskScore')}: {risk.riskScore}/100 (supporting information)
          </span>
        </div>

        {noRisk ? (
          <NoRiskState className="mb-4" />
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {t('recommendedAction')}: {risk.recommendedAction}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{risk.relocationTimeframe === 'Immediate' ? 'Move to safety now.' : 'Stay alert and be ready to move if conditions worsen.'}</p>
          </>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">{t('recommendedSafeSite')}</div>
            {recommendedSite ? (
              <>
                <div className="font-bold text-slate-900 dark:text-slate-100">{recommendedSite.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{bestMatch.distanceKm} km away</div>
              </>
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500">{t('informationUnavailable')}</div>
            )}
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">{t('recommendedRoute')}</div>
            {bestRoute ? (
              <>
                <div className="font-bold text-slate-900 dark:text-slate-100">{bestRoute.route.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock size={11} /> {bestRoute.stats.timeMin} min · {bestRoute.route.distanceKm} km
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500">{t('informationUnavailable')}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button size="sm" onClick={() => navigate('/app/safe-sites')}>
            <ShieldCheck size={15} /> {t('recommendedSafeSite')}
          </Button>
          <Button size="sm" variant="secondary" onClick={goToRecommendedRoute} disabled={!recommendedSite}>
            <Navigation size={15} /> {t('startRoute')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/app/emergency')}>
            <Siren size={15} /> {t('viewEmergencyInstructions')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/app/report-issue')}>
            <FileWarning size={15} /> {t('reportIssueAction')}
          </Button>
        </div>
      </Card>

      {/* Important alerts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Bell size={16} className="text-blue-600 dark:text-blue-400" /> Important Alerts
          </h3>
          <button onClick={() => navigate('/app/alerts')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:gap-1.5 transition-all">
            View all <ChevronRight size={14} />
          </button>
        </div>
        {topAlerts.length === 0 ? (
          <NoAlertsState />
        ) : (
          <div className="space-y-2">
            {topAlerts.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.type}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.message}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Emergency / SOS quick access */}
      <Card hover className="p-5 cursor-pointer border-red-200 dark:border-red-500/30" onClick={() => navigate('/app/emergency')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
              <Siren size={19} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">Emergency / SOS</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Emergency contacts and instructions</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
      </Card>

      <Card className="h-[260px] p-0 overflow-hidden relative">
        <GeoMap
          markers={[
            { id: myHabitation.id, type: 'habitation', position: myHabitation.position, label: 'Your area', priority: risk.status },
            ...(recommendedSite ? [{ id: recommendedSite.id, type: 'site', shape: 'box', position: recommendedSite.position, label: recommendedSite.name }] : []),
          ]}
          routes={routes.length > 0 ? [routes[0]] : []}
          showHazards
        />
      </Card>

      <ConnectionStatus />
    </div>
  )
}
