import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ShieldCheck, XCircle, CheckCircle2, Users, MapPin, Building2, UserCog, Route as RouteIcon, ClipboardCheck } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import AssignmentBreadcrumb from '../components/ui/AssignmentBreadcrumb'
import { getSafeSite } from '../data/safeSites'
import { useAppState } from '../state/AppStateContext'
import { useProviderData } from '../provider/providerStore'
import { validateHabitation, validateSafeSite, validateCoordinator, validateRoute } from '../utils/assignmentCalculations'

export default function Validation() {
  const navigate = useNavigate()
  const { habitations, selectedHabitationId, coordinators, volunteers, operations, getOperationForHabitation, createAssignment } = useAppState()
  const { getProvider } = useProviderData()
  const habitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const operation = getOperationForHabitation(habitation.id)

  if (!operation) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">No relocation is currently being planned for {habitation.name}.</p>
          <Button size="sm" className="mt-4" onClick={() => navigate('/app/relocation')}>
            Start Planning
          </Button>
        </Card>
      </div>
    )
  }

  const site = operation.safeSiteId ? getSafeSite(operation.safeSiteId) : null
  const infrastructure = operation.infrastructureId ? getProvider(operation.infrastructureId) : null
  const coordinator = coordinators.find((c) => c.id === operation.coordinatorId)
  const assignedVolunteers = (operation.volunteerIds || []).map((id) => volunteers.find((v) => v.id === id)).filter(Boolean)

  const habitationCheck = validateHabitation(habitation)
  const safeSiteCheck = validateSafeSite(site, operation.populationRequiring, !!operation.infrastructureId)
  const coordinatorCheck = validateCoordinator(coordinator, operations)
  const routeCheck = validateRoute(operation.routeId, operation.routeStatus)
  const categories = [
    { title: 'Habitation', result: habitationCheck },
    { title: 'Safe Site', result: safeSiteCheck },
    { title: 'Coordinator / Rescue Team', result: coordinatorCheck },
    { title: 'Route', result: routeCheck },
  ]
  const allOk = categories.every((c) => c.result.ok)

  const handleCreateAssignment = () => {
    if (!allOk) return
    createAssignment(habitation.id)
    navigate(`/app/operations/${habitation.id}`)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1000px] mx-auto space-y-6">
      <button onClick={() => navigate('/app/routes')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> Route
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ClipboardCheck size={22} className="text-blue-600 dark:text-blue-400" /> Pre-Assignment Validation
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review the assignment summary below, then validate every category before it can be created.</p>
      </div>

      <AssignmentBreadcrumb operation={operation} />

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Confirmation Summary</h3>
        <div className="grid sm:grid-cols-2 gap-3.5 text-sm">
          <SummaryRow icon={Users} label="Habitation" value={habitation.name} />
          <SummaryRow icon={MapPin} label="Safe Site" value={site?.name || 'Not selected'} />
          <SummaryRow icon={Building2} label="Infrastructure" value={infrastructure?.providerName || 'Not selected'} />
          <SummaryRow icon={Users} label="Population Requiring Relocation" value={operation.populationRequiring.toLocaleString()} />
          <SummaryRow icon={RouteIcon} label="Selected Route" value={operation.routeId || 'Not generated'} />
          <SummaryRow icon={UserCog} label="Selected Coordinator" value={coordinator?.name || 'Not assigned'} />
          <SummaryRow icon={Users} label="Selected Volunteers" value={assignedVolunteers.length > 0 ? assignedVolunteers.map((v) => v.name).join(', ') : 'None selected'} />
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        {categories.map((c) => (
          <Card key={c.title} className={`p-5 border ${c.result.ok ? 'border-emerald-200 dark:border-emerald-500/30' : 'border-red-200 dark:border-red-500/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{c.title}</h4>
              {c.result.ok ? <Badge tone="good" icon={CheckCircle2}>Passed</Badge> : <Badge tone="danger" icon={XCircle}>Failed</Badge>}
            </div>
            {c.result.ok ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No issues found.</p>
            ) : (
              <div className="space-y-2.5">
                {c.result.issues.map((issue, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-red-600 dark:text-red-400 mb-1">{issue.message}</p>
                    <button onClick={() => navigate(issue.correctionPath)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:gap-1.5 transition-all">
                      {issue.correctionLabel} <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="lg" disabled={!allOk} onClick={handleCreateAssignment}>
          <ShieldCheck size={16} /> Review and Validate Assignment
        </Button>
      </div>
    </div>
  )
}

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">{label}</div>
        <div className="text-slate-800 dark:text-slate-200 font-semibold">{value}</div>
      </div>
    </div>
  )
}
