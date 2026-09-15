import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Users, Clock, Wrench, Package, Navigation2, ShieldAlert, FileWarning,
  MessageSquare, CheckCircle2, XCircle, LogIn, PlayCircle, RefreshCw, ClipboardCheck, Send,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../../components/ui/FormField'
import GeoMap from '../../components/map/GeoMap'
import { PriorityBadge, StatusBadge, TaskTimeline, UpcomingSteps, ProgressSummary, DemoDataBadge } from '../../components/ui/TaskComponents'
import { UnavailableState, InfoUnavailable } from '../../components/ui/DataStates'
import { useAppState } from '../../state/AppStateContext'
import { generateRoutes } from '../../utils/routing'
import { rankRoutesForProfile } from '../../utils/routeCalculations'
import { routeConditionLabel, routeConditionTone } from '../citizen/citizenLabels'
import { availabilityStatus } from '../../provider/capacityService'
import { useProviderData } from '../../provider/providerStore'
import { TASK_STATUS } from '../../data/volunteerTasks'

const REJECT_REASONS = ['Too far', 'Unavailable', 'Skill mismatch', 'Unsafe', 'Other']

const UPCOMING_BY_STATUS = {
  [TASK_STATUS.ASSIGNED]: ['Navigate', 'Check in', 'Start action', 'Update progress', 'Complete task', 'Check out'],
  [TASK_STATUS.ACCEPTED]: ['Check in', 'Start action', 'Update progress', 'Complete task', 'Check out'],
  [TASK_STATUS.WAITING_FOR_CHECKIN]: ['Start action', 'Update progress', 'Complete task', 'Check out'],
  [TASK_STATUS.IN_PROGRESS]: ['Complete task', 'Check out'],
  [TASK_STATUS.PARTIALLY_COMPLETED]: ['Complete task', 'Check out'],
  [TASK_STATUS.UNDER_VERIFICATION]: ['Check out'],
}

export default function VolunteerTaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    habitations, safeSites, volunteerTasks, volunteerIncidents, teamMessages,
    acceptTask, rejectTask, requestReassignment, checkInTask, startTaskAction,
    updateTaskProgress, completeTask, checkOutTask, sendTeamMessage,
  } = useAppState()
  const { providers, capacitiesById } = useProviderData()

  const task = volunteerTasks.find((t) => t.id === id)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [checkinPrompt, setCheckinPrompt] = useState(false)
  const [progressForm, setProgressForm] = useState(null)
  const [progressErrors, setProgressErrors] = useState({})
  const [completeOpen, setCompleteOpen] = useState(false)
  const [completeForm, setCompleteForm] = useState({ peopleAssisted: '', peopleEvacuated: '', resourcesUsed: '', incidentsEncountered: '', remainingIssues: '', notes: '' })
  const [messageDraft, setMessageDraft] = useState('')

  if (!task) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">This task could not be found.</p>
          <Button size="sm" className="mt-3" onClick={() => navigate('/app/tasks')}>
            Back to My Tasks
          </Button>
        </Card>
      </div>
    )
  }

  const habitation = habitations.find((h) => h.id === task.habitationId)
  const destinationSite = task.destinationSiteId ? safeSites.find((s) => s.id === task.destinationSiteId) : null

  const routes = habitation && destinationSite ? generateRoutes(habitation.position, destinationSite.position) : []
  const ranked = routes.length > 0 ? rankRoutesForProfile(routes, 'young-adult', {}) : []
  const primaryRoute = ranked[0]
  const primaryLabel = primaryRoute ? routeConditionLabel(primaryRoute.stats.tag, true) : null

  const taskResources = destinationSite
    ? providers
        .filter((p) => p.district === destinationSite.district)
        .slice(0, 4)
        .map((p) => ({ provider: p, status: availabilityStatus(capacitiesById[p.id]) }))
    : []

  const incidents = volunteerIncidents.filter((i) => i.relatedTaskId === task.id)
  const messages = teamMessages[task.id] || []

  const openProgressForm = () =>
    setProgressForm({
      evacuated: String(task.progress?.evacuated ?? 0),
      inTransit: String(task.progress?.inTransit ?? 0),
      remaining: String(task.progress?.remaining ?? task.affectedPeople ?? 0),
      unverified: String(task.progress?.unverified ?? 0),
      notes: '',
    })

  const submitProgress = () => {
    const total = task.affectedPeople || 0
    const evacuated = Number(progressForm.evacuated)
    const inTransit = Number(progressForm.inTransit)
    const remaining = Number(progressForm.remaining)
    const unverified = Number(progressForm.unverified)
    const errors = {}
    ;[
      ['evacuated', evacuated],
      ['inTransit', inTransit],
      ['remaining', remaining],
      ['unverified', unverified],
    ].forEach(([key, val]) => {
      if (Number.isNaN(val) || val < 0) errors[key] = 'Must be zero or a positive number.'
    })
    if (evacuated + inTransit + remaining > total) errors.remaining = `Evacuated + in transit + remaining cannot exceed the total of ${total}.`
    setProgressErrors(errors)
    if (Object.keys(errors).length > 0) return
    updateTaskProgress(task.id, { evacuated, inTransit, remaining, unverified, notes: progressForm.notes })
    setProgressForm(null)
  }

  const submitCompletion = () => {
    completeTask(task.id, {
      peopleAssisted: Number(completeForm.peopleAssisted) || 0,
      peopleEvacuated: Number(completeForm.peopleEvacuated) || 0,
      resourcesUsed: completeForm.resourcesUsed,
      incidentsEncountered: Number(completeForm.incidentsEncountered) || 0,
      remainingIssues: completeForm.remainingIssues,
      notes: completeForm.notes,
    })
    setCompleteOpen(false)
  }

  const sendQuickMessage = (type, text) => {
    sendTeamMessage(task.id, { type, message: text })
    setMessageDraft('')
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate('/app/tasks')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> My Tasks
      </button>

      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          <DemoDataBadge />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{task.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5 flex-wrap">
          <MapPin size={14} /> {habitation ? `${habitation.name}, ${habitation.district}` : 'Location unavailable'}
          {task.affectedPeople > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <Users size={14} /> {task.affectedPeople.toLocaleString()} people affected
            </>
          )}
        </p>
      </div>

      {/* Objective / instructions */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Objective</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{task.objective || 'No objective recorded.'}</p>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Instructions</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{task.instructions || 'No specific instructions recorded.'}</p>
      </Card>

      {/* Status-gated action buttons — only the valid next actions, never all at once */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Next Step</h3>
        <div className="flex flex-wrap gap-2.5">
          {task.status === TASK_STATUS.ASSIGNED && (
            <>
              <Button onClick={() => acceptTask(task.id)}>
                <CheckCircle2 size={16} /> Accept task
              </Button>
              <Button variant="secondary" onClick={() => setRejectOpen(true)}>
                <XCircle size={16} /> Reject task
              </Button>
            </>
          )}
          {task.status === TASK_STATUS.ACCEPTED && (
            <>
              <Button onClick={() => navigate('/app/routes')}>
                <Navigation2 size={16} /> Navigate
              </Button>
              <Button variant="secondary" onClick={() => setCheckinPrompt(true)}>
                <LogIn size={16} /> Check in
              </Button>
            </>
          )}
          {task.status === TASK_STATUS.WAITING_FOR_CHECKIN && (
            <Button onClick={() => startTaskAction(task.id)}>
              <PlayCircle size={16} /> Start task
            </Button>
          )}
          {(task.status === TASK_STATUS.IN_PROGRESS || task.status === TASK_STATUS.PARTIALLY_COMPLETED) && (
            <>
              <Button onClick={openProgressForm}>
                <RefreshCw size={16} /> Update progress
              </Button>
              <Button variant="secondary" onClick={() => navigate('/app/report-incident')}>
                <FileWarning size={16} /> Report incident
              </Button>
              <Button variant="secondary" onClick={() => navigate('/app/volunteer-sos')}>
                <ShieldAlert size={16} /> Request help
              </Button>
              <Button variant="dark" onClick={() => setCompleteOpen(true)}>
                <ClipboardCheck size={16} /> Complete task
              </Button>
            </>
          )}
          {task.status === TASK_STATUS.UNDER_VERIFICATION && (
            <>
              <div className="w-full rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                Awaiting coordinator verification.
              </div>
              {!task.checkedOut && (
                <Button variant="secondary" onClick={() => checkOutTask(task.id)}>
                  Check out
                </Button>
              )}
            </>
          )}
          {(task.status === TASK_STATUS.COMPLETED || (task.status === TASK_STATUS.UNDER_VERIFICATION && task.checkedOut)) && (
            <Button onClick={() => navigate('/app/tasks')}>View next task</Button>
          )}
          {task.status === TASK_STATUS.REJECTED && (
            <div className="w-full rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              Rejected — {task.rejectionReason || 'No reason recorded'}
            </div>
          )}
        </div>
      </Card>

      {/* Progress */}
      {task.affectedPeople > 0 && (
        <Card className="p-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Evacuation Progress</h3>
          <ProgressSummary progress={task.progress} total={task.affectedPeople} />
          {task.progress?.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Notes: {task.progress.notes}</p>}
        </Card>
      )}

      {/* Assigned team / resources */}
      <Card className="p-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
              <Wrench size={15} /> Required Skills
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{task.requiredSkills?.length ? task.requiredSkills.join(', ') : 'None specified'}</p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
              <Package size={15} /> Assigned Resources
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{task.assignedResources?.length ? task.assignedResources.join(', ') : 'None assigned'}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Estimated duration: {task.estimatedDurationMin ? `${task.estimatedDurationMin} min` : 'Unavailable'}</p>
      </Card>

      {/* Recommended route */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
          <Navigation2 size={15} /> Recommended Route
        </h3>
        {!primaryRoute ? (
          <UnavailableState title="Route information unavailable" hint="No destination is set for this task." />
        ) : (
          <>
            <Card className="h-[180px] p-0 overflow-hidden mb-3">
              <GeoMap
                markers={[
                  { id: 'origin', type: 'origin', position: habitation.position, label: habitation.name },
                  { id: 'destination', type: 'destination', position: destinationSite.position, label: destinationSite.name },
                ]}
                routes={[primaryRoute.route]}
                showHazards={false}
              />
            </Card>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300 mb-3">
              <span>{primaryRoute.route.distanceKm} km</span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {primaryRoute.stats.timeMin} min
              </span>
              <Badge tone={routeConditionTone(primaryLabel)}>{primaryLabel}</Badge>
            </div>
            <Button size="sm" onClick={() => navigate('/app/routes')}>
              Navigate to task location
            </Button>
          </>
        )}
      </Card>

      {/* Task-relevant resources */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Resources Near Destination</h3>
        {taskResources.length === 0 ? (
          <InfoUnavailable message="No resource data available for this task's destination." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {taskResources.map(({ provider, status }) => (
              <div key={provider.id} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3.5 py-2.5">
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{provider.providerName}</span>
                <Badge tone={status === 'Available' ? 'good' : status === 'Limited' ? 'warning' : 'default'}>{status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Incident reports */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Incident Reports</h3>
        {incidents.length === 0 ? (
          <InfoUnavailable message="No incidents reported for this task." />
        ) : (
          <div className="space-y-2">
            {incidents.map((i) => (
              <div key={i.id} className="rounded-xl bg-slate-50 dark:bg-white/5 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{i.incidentType}</span>
                  <Badge tone="warning">{i.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{i.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Team communication */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
          <MessageSquare size={15} /> Team Communication
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Demo communication — messages are recorded locally, not sent to a real coordinator.</p>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {messages.length === 0 ? (
            <InfoUnavailable message="No messages for this task yet." />
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`rounded-xl px-3.5 py-2.5 text-sm ${m.sender.includes('You') ? 'bg-blue-50 dark:bg-blue-500/10 ml-6' : 'bg-slate-50 dark:bg-white/5 mr-6'}`}>
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{m.sender}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(m.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{m.message}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          <Button size="sm" variant="ghost" onClick={() => sendQuickMessage('progress-update', 'Progress update sent.')}>
            Progress update
          </Button>
          <Button size="sm" variant="ghost" onClick={() => sendQuickMessage('resource-needed', 'I need additional resources for this task.')}>
            Need resources
          </Button>
          <Button size="sm" variant="ghost" onClick={() => sendQuickMessage('route-blocked', 'The route to this task is blocked.')}>
            Route blocked
          </Button>
        </div>
        <div className="flex gap-2">
          <Input value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} placeholder="Write a message..." className="flex-1" />
          <Button
            size="sm"
            onClick={() => {
              if (!messageDraft.trim()) return
              sendQuickMessage('progress-update', messageDraft.trim())
            }}
          >
            <Send size={14} />
          </Button>
        </div>
      </Card>

      {/* Workflow timeline */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Task Workflow</h3>
        <TaskTimeline entries={task.timeline} />
        <div className="mt-3">
          <UpcomingSteps steps={UPCOMING_BY_STATUS[task.status] || []} />
        </div>
      </Card>

      {/* Reject modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Task">
        <div className="space-y-4">
          <Field label="Reason" required>
            <Select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
              <option value="">Select a reason</option>
              {REJECT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button
              variant="danger"
              className="flex-1"
              disabled={!rejectReason}
              onClick={() => {
                rejectTask(task.id, rejectReason)
                setRejectOpen(false)
                setRejectReason('')
              }}
            >
              Confirm Reject
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                if (!rejectReason) return
                requestReassignment(task.id, rejectReason)
                setRejectOpen(false)
                setRejectReason('')
              }}
            >
              Request Reassignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Check-in modal */}
      <Modal open={checkinPrompt} onClose={() => setCheckinPrompt(false)} title="Check In">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">Have you reached {habitation?.name || 'the task location'}?</p>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
            Stay with your assigned team. Follow the recommended route. Report blocked roads immediately.
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                checkInTask(task.id)
                setCheckinPrompt(false)
              }}
            >
              Confirm check-in
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setCheckinPrompt(false)}>
              Not yet
            </Button>
          </div>
          <button
            onClick={() => {
              navigate('/app/report-incident')
              setCheckinPrompt(false)
            }}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            Report a location issue
          </button>
        </div>
      </Modal>

      {/* Progress update modal */}
      <Modal open={!!progressForm} onClose={() => setProgressForm(null)} title="Update Progress">
        {progressForm && (
          <div className="space-y-4">
            <Field label="Number evacuated" error={progressErrors.evacuated}>
              <Input type="number" min="0" value={progressForm.evacuated} onChange={(e) => setProgressForm({ ...progressForm, evacuated: e.target.value })} />
            </Field>
            <Field label="Number in transit" error={progressErrors.inTransit}>
              <Input type="number" min="0" value={progressForm.inTransit} onChange={(e) => setProgressForm({ ...progressForm, inTransit: e.target.value })} />
            </Field>
            <Field label="Number remaining" error={progressErrors.remaining}>
              <Input type="number" min="0" value={progressForm.remaining} onChange={(e) => setProgressForm({ ...progressForm, remaining: e.target.value })} />
            </Field>
            <Field label="Number needing assistance (unverified)" error={progressErrors.unverified}>
              <Input type="number" min="0" value={progressForm.unverified} onChange={(e) => setProgressForm({ ...progressForm, unverified: e.target.value })} />
            </Field>
            <Field label="Notes">
              <Textarea value={progressForm.notes} onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })} />
            </Field>
            <Button className="w-full" onClick={submitProgress}>
              Save Progress
            </Button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">Progress update will be saved in demo mode.</p>
          </div>
        )}
      </Modal>

      {/* Complete task modal */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title={`Complete ${task.title}?`} wide>
        <div className="space-y-4">
          <Field label="People assisted">
            <Input type="number" min="0" value={completeForm.peopleAssisted} onChange={(e) => setCompleteForm({ ...completeForm, peopleAssisted: e.target.value })} />
          </Field>
          <Field label="People evacuated">
            <Input type="number" min="0" value={completeForm.peopleEvacuated} onChange={(e) => setCompleteForm({ ...completeForm, peopleEvacuated: e.target.value })} />
          </Field>
          <Field label="Resources used">
            <Input value={completeForm.resourcesUsed} onChange={(e) => setCompleteForm({ ...completeForm, resourcesUsed: e.target.value })} />
          </Field>
          <Field label="Incidents encountered">
            <Input type="number" min="0" value={completeForm.incidentsEncountered} onChange={(e) => setCompleteForm({ ...completeForm, incidentsEncountered: e.target.value })} />
          </Field>
          <Field label="Remaining issues">
            <Textarea value={completeForm.remainingIssues} onChange={(e) => setCompleteForm({ ...completeForm, remainingIssues: e.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea value={completeForm.notes} onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })} />
          </Field>
          <Button className="w-full" onClick={submitCompletion}>
            Submit Completion
          </Button>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">Task will be marked completed in demo mode and moved to Under Verification.</p>
        </div>
      </Modal>
    </div>
  )
}
