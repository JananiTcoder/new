import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Users, Navigation, LogIn, RefreshCw, FileWarning, Siren, ChevronRight, Bell, ClipboardCheck } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ConnectionStatus from '../../components/ui/ConnectionStatus'
import { PriorityBadge, StatusBadge, DemoDataBadge } from '../../components/ui/TaskComponents'
import { NoAlertsState, EmptyState } from '../../components/ui/DataStates'
import { useAppState } from '../../state/AppStateContext'
import { getHazardType } from '../../types/geosentra'
import { deriveAlerts, filterAlertsForRole } from '../../utils/alerts'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../auth/roleConfig'
import { pickCurrentTask, taskTypeLabel, readinessLabel, readinessTone, computeReadinessBreakdown } from './volunteerLabels'

export default function VolunteerOverview() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { habitations, safeSites, institutions, scenario, operations, coordinators, volunteers, volunteerTasks } = useAppState()

  const currentTask = pickCurrentTask(volunteerTasks)
  const habitation = currentTask ? habitations.find((h) => h.id === currentTask.habitationId) : null
  const destinationSite = currentTask?.destinationSiteId ? safeSites.find((s) => s.id === currentTask.destinationSiteId) : null
  const readiness = computeReadinessBreakdown(currentTask)

  const alerts = filterAlertsForRole(deriveAlerts({ habitations, safeSites, institutions, scenario, operations, coordinators, volunteers }), role).slice(0, 2)

  const goToTask = () => currentTask && navigate(`/app/tasks/${currentTask.id}`)

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Volunteer Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">What's happening, who needs help, and what to do next.</p>
      </div>

      {!currentTask ? (
        <Card className="p-6">
          <EmptyState message="No tasks are currently assigned to you." />
        </Card>
      ) : (
        <Card className={`p-6 border-2 ${currentTask.priority === 'critical' ? 'border-red-300 dark:border-red-500/50' : currentTask.priority === 'high' ? 'border-amber-300 dark:border-amber-500/50' : 'border-blue-200 dark:border-blue-500/40'}`}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <PriorityBadge priority={currentTask.priority} className="text-sm px-3 py-1.5" />
            <StatusBadge status={currentTask.status} />
            {habitation && (
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <AlertTriangle size={12} /> {getHazardType(currentTask.hazard)?.label || 'Hazard'} — {habitation.name}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{currentTask.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-1.5">
            <Users size={14} /> {currentTask.affectedPeople > 0 ? `${currentTask.affectedPeople.toLocaleString()} people affected` : 'No population count for this task'}
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5">
              <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">Task Type</div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{taskTypeLabel(currentTask.type)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5">
              <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">Destination</div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{destinationSite?.name || 'Not applicable'}</div>
            </div>
          </div>

          <Button className="w-full" onClick={goToTask}>
            <ClipboardCheck size={16} /> {currentTask.status === 'assigned' ? 'Start task' : 'Continue task'}
          </Button>
        </Card>
      )}

      {/* Action cards — one recommended action at a time, per the current task's status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <ActionCard icon={ClipboardCheck} label="My Tasks" onClick={() => navigate('/app/tasks')} />
        <ActionCard icon={Navigation} label="Navigate" onClick={goToTask} disabled={!currentTask} />
        <ActionCard icon={LogIn} label="Check in" onClick={goToTask} disabled={!currentTask} />
        <ActionCard icon={RefreshCw} label="Update progress" onClick={goToTask} disabled={!currentTask} />
        <ActionCard icon={FileWarning} label="Report incident" onClick={() => navigate('/app/report-incident')} />
        <ActionCard icon={Siren} label="Request help" onClick={() => navigate('/app/volunteer-sos')} tone="danger" />
      </div>

      {/* Evacuation readiness — text labels, never a bare percentage */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Evacuation Readiness</h3>
          <DemoDataBadge />
        </div>
        {!currentTask ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-2">No active task to assess readiness for.</p>
        ) : (
          <>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2 mb-3">{readiness.overallPct}%</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {['people', 'transport', 'medical', 'supplies'].map((k) => (
                <div key={k} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{k}</span>
                  <Badge tone={readinessTone(readiness[k])}>{readinessLabel(readiness[k])}</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {readiness.overallPct < 100 ? 'Readiness is limited because some resources or steps are still being arranged.' : 'All tracked readiness factors are ready.'}
            </p>
          </>
        )}
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
        {alerts.length === 0 ? (
          <NoAlertsState />
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.type}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.message}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SOS quick access */}
      <Card hover className="p-5 cursor-pointer border-red-200 dark:border-red-500/30" onClick={() => navigate('/app/volunteer-sos')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
              <Siren size={19} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">SOS / Emergency</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Request emergency help for yourself or your team</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
      </Card>

      <ConnectionStatus />
    </div>
  )
}

function ActionCard({ icon: Icon, label, onClick, disabled, tone = 'default' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center transition-colors disabled:opacity-40 disabled:pointer-events-none ${
        tone === 'danger'
          ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400'
      }`}
    >
      <Icon size={20} />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}
