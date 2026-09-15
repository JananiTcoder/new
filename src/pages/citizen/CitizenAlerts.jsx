import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { LoadingState, NoAlertsState } from '../../components/ui/DataStates'
import ConnectionStatus from '../../components/ui/ConnectionStatus'
import { useAppState } from '../../state/AppStateContext'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { deriveAlerts, filterAlertsForRole } from '../../utils/alerts'

// Citizen-facing severity wording — text label AND color, never color alone.
// critical -> Emergency, warning -> Warning, info -> Advisory.
const SEVERITY_LABEL = { critical: 'Emergency', warning: 'Warning', info: 'Advisory' }
const SEVERITY_TONE = { critical: 'danger', warning: 'warning', info: 'blue' }
const SEVERITY_ICON = { critical: ShieldAlert, warning: AlertTriangle, info: Info }

export default function CitizenAlerts() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { t } = useLanguage()
  const { habitations, safeSites, institutions, scenario, operations, coordinators, volunteers, readAlertIds, markAlertRead, selectHabitation } = useAppState()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // All alert data here is synchronous mock state — this brief tick is an
    // honest "checking" moment, not a simulated network fetch.
    const t = setTimeout(() => setReady(true), 300)
    return () => clearTimeout(t)
  }, [])

  const alerts = useMemo(
    () => filterAlertsForRole(deriveAlerts({ habitations, safeSites, institutions, scenario, operations, coordinators, volunteers }), role),
    [habitations, safeSites, institutions, scenario, operations, coordinators, volunteers, role]
  )

  const openRelated = (alert) => {
    if (alert.relatedType === 'habitation') {
      selectHabitation(alert.relatedId)
      navigate(`/app/habitations/${alert.relatedId}`)
    } else if (alert.relatedType === 'site') {
      navigate('/app/safe-sites')
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2.5">
        <Bell size={22} className="text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('alerts')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Public safety alerts for your area.</p>
        </div>
      </div>

      {!ready ? (
        <LoadingState />
      ) : alerts.length === 0 ? (
        <NoAlertsState />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const Icon = SEVERITY_ICON[a.severity]
            const read = readAlertIds.has(a.id)
            return (
              <Card key={a.id} className={`p-4 ${read ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <Icon size={18} className={a.severity === 'critical' ? 'text-red-500' : a.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{a.type}</span>
                      <Badge tone={SEVERITY_TONE[a.severity]}>{SEVERITY_LABEL[a.severity]}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{a.message}</p>
                    <div className="flex items-center gap-3 mt-2.5">
                      {a.relatedType && (
                        <button onClick={() => openRelated(a)} className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {t('viewDetails')}
                        </button>
                      )}
                      {!read && (
                        <button onClick={() => markAlertRead(a.id)} className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300">
                          <CheckCircle2 size={13} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConnectionStatus />
    </div>
  )
}
