import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, MapPin, Users, Clock, Wrench } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { PriorityBadge, StatusBadge } from '../../components/ui/TaskComponents'
import { EmptyState } from '../../components/ui/DataStates'
import { useAppState } from '../../state/AppStateContext'
import { taskTypeLabel, primaryActionForStatus, isTaskActive } from './volunteerLabels'
import { TASK_STATUS } from '../../data/volunteerTasks'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'high-priority', label: 'High priority' },
  { id: 'completed', label: 'Completed' },
  { id: 'waiting', label: 'Waiting for action' },
]

const WAITING_STATUSES = [TASK_STATUS.ASSIGNED, TASK_STATUS.WAITING_FOR_CHECKIN, TASK_STATUS.UNDER_VERIFICATION]

export default function VolunteerTasks() {
  const navigate = useNavigate()
  const { habitations, volunteerTasks } = useAppState()
  const [filter, setFilter] = useState('all')

  const activeCount = volunteerTasks.filter(isTaskActive).length

  const filtered = useMemo(() => {
    switch (filter) {
      case 'active':
        return volunteerTasks.filter(isTaskActive)
      case 'high-priority':
        return volunteerTasks.filter((t) => t.priority === 'critical' || t.priority === 'high')
      case 'completed':
        return volunteerTasks.filter((t) => t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.UNDER_VERIFICATION)
      case 'waiting':
        return volunteerTasks.filter((t) => WAITING_STATUSES.includes(t.status))
      default:
        return volunteerTasks
    }
  }, [volunteerTasks, filter])

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck size={22} className="text-blue-600 dark:text-blue-400" /> My Tasks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{activeCount} active task{activeCount === 1 ? '' : 's'} assigned to you.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              filter === f.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8">
          <EmptyState message="No tasks are currently assigned to you." />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((task) => {
            const habitation = habitations.find((h) => h.id === task.habitationId)
            return (
              <Card key={task.id} hover className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <PriorityBadge priority={task.priority} className="mb-2" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{task.title}</h3>
                  </div>
                  <StatusBadge status={task.status} className="shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300 mb-3">
                  <span>{taskTypeLabel(task.type)}</span>
                  {task.affectedPeople > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-slate-400" /> {task.affectedPeople.toLocaleString()} people
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" /> {habitation ? `${habitation.name}, ${habitation.district}` : 'Location unavailable'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" /> {task.estimatedDurationMin ? `${task.estimatedDurationMin} min` : 'Duration unavailable'}
                  </span>
                </div>

                {task.requiredSkills?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-3">
                    <Wrench size={12} /> Requires: {task.requiredSkills.join(', ')}
                  </div>
                )}

                <Button size="sm" onClick={() => navigate(`/app/tasks/${task.id}`)}>
                  {primaryActionForStatus(task.status).toUpperCase()}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
