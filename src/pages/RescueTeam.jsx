import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, UserCog, Users, RotateCcw, ClipboardList, Home, CheckSquare, Square } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import AssignmentBreadcrumb from '../components/ui/AssignmentBreadcrumb'
import { useAppState } from '../state/AppStateContext'
import { isCoordinatorAvailable, openOperationsForCoordinator, isVolunteerAvailable, openOperationsForVolunteer } from '../utils/assignmentCalculations'

export default function RescueTeam() {
  const navigate = useNavigate()
  const { habitations, selectedHabitationId, coordinators, volunteers, operations, getOperationForHabitation, updateOperationField } = useAppState()
  const habitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const operation = getOperationForHabitation(habitation.id)

  const availableCoordinators = coordinators.filter((c) => isCoordinatorAvailable(c, operations) || c.id === operation?.coordinatorId)
  const availableVolunteers = volunteers.filter((v) => isVolunteerAvailable(v, operations) || (operation?.volunteerIds || []).includes(v.id))

  const pickCoordinator = (coordinatorId) => {
    updateOperationField(habitation.id, { coordinatorId })
  }

  const toggleVolunteer = (volunteerId) => {
    const current = operation?.volunteerIds || []
    const next = current.includes(volunteerId) ? current.filter((v) => v !== volunteerId) : [...current, volunteerId]
    updateOperationField(habitation.id, { volunteerIds: next })
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <button onClick={() => navigate('/app/infrastructure')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> Infrastructure
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserCog size={22} className="text-blue-600 dark:text-blue-400" /> Select a Rescue Team
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">For {habitation.name} — only Emergency Coordinators currently Available with open case capacity are shown.</p>
      </div>

      {operation && <AssignmentBreadcrumb operation={operation} />}

      {availableCoordinators.length === 0 ? (
        <Card className="p-8 text-center">
          <UserCog size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No Emergency Coordinator is currently available.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Every coordinator is off duty or already at their concurrent-case limit.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={() => navigate(0)}>
              <RotateCcw size={14} /> Try again
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/operations')}>
              <ClipboardList size={14} /> View pending operations
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/habitations')}>
              <Home size={14} /> Return to Habitations
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {availableCoordinators.map((c) => {
            const openCount = openOperationsForCoordinator(operations, c.id).length
            const selected = operation?.coordinatorId === c.id
            return (
              <Card key={c.id} hover className={`p-5 flex flex-col cursor-pointer ${selected ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/20' : ''}`} onClick={() => pickCoordinator(c.id)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{c.name}</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{c.region}</span>
                  </div>
                  <Badge tone="good">{c.status}</Badge>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Open cases: <b className="text-slate-800 dark:text-slate-200">{openCount}</b> / {c.maxConcurrentCases}
                </div>
                <Button size="sm" variant={selected ? 'primary' : 'secondary'} className="mt-auto w-full" onClick={() => pickCoordinator(c.id)}>
                  {selected ? 'Selected' : 'Select This Coordinator'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {operation?.coordinatorId && (
        <Card className="p-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
            <Users size={16} className="text-blue-600 dark:text-blue-400" /> Select Volunteers
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Optional — only volunteers currently Available and not already committed are shown.</p>
          {availableVolunteers.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No volunteers are currently available.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {availableVolunteers.map((v) => {
                const checked = (operation.volunteerIds || []).includes(v.id)
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVolunteer(v.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      checked ? 'border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {checked ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400 shrink-0" /> : <Square size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{v.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {v.skill} · {v.region}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-end">
        <Button disabled={!operation?.coordinatorId} onClick={() => navigate('/app/routes')}>
          Continue to Route <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
