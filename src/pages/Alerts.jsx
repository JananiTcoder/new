import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, AlertTriangle, ShieldAlert, Info, XCircle } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import DemoToast from '../components/ui/DemoToast'
import { useAppState } from '../state/AppStateContext'
import { deriveAlerts, filterAlertsForRole } from '../utils/alerts'
import { HAZARD_TYPES, ALERT_STATUS } from '../types/geosentra'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS, ROLES } from '../auth/roleConfig'

const SEVERITY_ICON = { critical: ShieldAlert, warning: AlertTriangle, info: Info }
const SEVERITY_BADGE = { critical: 'danger', warning: 'warning', info: 'blue' }
const SEVERITIES = ['critical', 'warning', 'info']
const STATUS_BADGE = { [ALERT_STATUS.ACTIVE]: 'default', [ALERT_STATUS.ACKNOWLEDGED]: 'blue', [ALERT_STATUS.IN_PROGRESS]: 'warning', [ALERT_STATUS.RESOLVED]: 'good', [ALERT_STATUS.DISMISSED]: 'default' }
const STATUSES = Object.values(ALERT_STATUS)

export default function Alerts() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const {
    habitations,
    safeSites,
    institutions,
    scenario,
    operations,
    coordinators,
    volunteers,
    volunteerTasks,
    readAlertIds,
    markAlertRead,
    getAlertStatus,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    selectHabitation,
  } = useAppState()
  const isVolunteer = role === ROLES.VOLUNTEERS
  const canAct = role === ROLES.EMERGENCY_COORDINATOR || role === ROLES.DISASTER_AUTHORITY
  const [severityFilter, setSeverityFilter] = useState('all')
  const [hazardFilter, setHazardFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState('')

  const alerts = useMemo(
    () => filterAlertsForRole(deriveAlerts({ habitations, safeSites, institutions, scenario, operations, coordinators, volunteers }), role),
    [habitations, safeSites, institutions, scenario, operations, coordinators, volunteers, role]
  )

  const filtered = alerts.filter(
    (a) =>
      (severityFilter === 'all' || a.severity === severityFilter) &&
      (hazardFilter === 'all' || a.hazard === hazardFilter) &&
      (statusFilter === 'all' || getAlertStatus(a.id) === statusFilter)
  )

  const handleAcknowledge = (a) => {
    acknowledgeAlert(a.id, a.type)
    setToast('Alert status updated in demo mode.')
  }
  const handleResolve = (a) => {
    resolveAlert(a.id, a.type)
    setToast('Alert status updated in demo mode.')
  }
  const handleDismiss = (a) => {
    dismissAlert(a.id, a.type)
    setToast('Alert status updated in demo mode.')
  }

  const openRelated = (alert) => {
    if (alert.relatedType === 'habitation') {
      selectHabitation(alert.relatedId)
      navigate(`/app/habitations/${alert.relatedId}`)
    } else if (alert.relatedType === 'operation') {
      navigate(`/app/operations/${alert.relatedId}`)
    } else if (alert.relatedType === 'site') {
      navigate('/app/safe-sites')
    } else if (alert.relatedType === 'institution') {
      navigate('/app/institution')
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2.5">
        <Bell size={22} className="text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Alerts</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Generated live from current risk, capacity and readiness state — not a static list. Showing alerts relevant to the {ROLE_LABELS[role]} role.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', ...SEVERITIES].map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${severityFilter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            {s}
          </button>
        ))}
        <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
        <button onClick={() => setHazardFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${hazardFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
          All Hazards
        </button>
        {HAZARD_TYPES.map((h) => (
          <button
            key={h.id}
            onClick={() => setHazardFilter(h.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${hazardFilter === h.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            {h.label}
          </button>
        ))}
        {canAct && (
          <>
            <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              All Statuses
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                {s}
              </button>
            ))}
          </>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-10">No alerts match this filter.</p>}
        {filtered.map((a) => {
          const Icon = SEVERITY_ICON[a.severity]
          const read = readAlertIds.has(a.id)
          const status = getAlertStatus(a.id)
          const resolved = status === ALERT_STATUS.RESOLVED || status === ALERT_STATUS.DISMISSED
          return (
            <Card key={a.id} className={`p-4 flex items-start gap-3 ${read || resolved ? 'opacity-60' : ''}`}>
              <Icon size={18} className={a.severity === 'critical' ? 'text-red-500' : a.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{a.type}</span>
                  <Badge tone={SEVERITY_BADGE[a.severity]}>{a.severity}</Badge>
                  {canAct && <Badge tone={STATUS_BADGE[status]}>{status}</Badge>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{a.message}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {a.relatedType && (
                  <button onClick={() => openRelated(a)} className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Open
                  </button>
                )}
                {isVolunteer &&
                  a.relatedType === 'habitation' &&
                  (() => {
                    const task = volunteerTasks.find((t) => t.habitationId === a.relatedId)
                    return task ? (
                      <button onClick={() => navigate(`/app/tasks/${task.id}`)} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        View related task
                      </button>
                    ) : null
                  })()}
                {canAct && !resolved && (
                  <div className="flex items-center gap-2">
                    {status === ALERT_STATUS.ACTIVE && (
                      <button onClick={() => handleAcknowledge(a)} className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        Acknowledge
                      </button>
                    )}
                    <button onClick={() => handleResolve(a)} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Resolve
                    </button>
                    <button onClick={() => handleDismiss(a)} className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300">
                      <XCircle size={13} /> Dismiss
                    </button>
                  </div>
                )}
                {!read && (
                  <button onClick={() => markAlertRead(a.id)} className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300">
                    <CheckCircle2 size={13} /> Mark read
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <DataStatusPanel />
      <DemoToast message={toast} onDismiss={() => setToast('')} />
    </div>
  )
}
