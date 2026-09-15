import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Navigation2, MapPin, ChevronDown, Info } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import GeoMap from '../../components/map/GeoMap'
import { UnavailableState } from '../../components/ui/DataStates'
import { useAppState } from '../../state/AppStateContext'
import { generateRoutes } from '../../utils/routing'
import { rankRoutesForProfile } from '../../utils/routeCalculations'
import { routeConditionLabel, routeConditionTone } from '../citizen/citizenLabels'
import { pickCurrentTask, isTaskActive, taskTypeLabel } from './volunteerLabels'

export default function VolunteerRoute() {
  const navigate = useNavigate()
  const { habitations, safeSites, volunteerTasks } = useAppState()
  const activeTasks = volunteerTasks.filter(isTaskActive)
  const [selectedTaskId, setSelectedTaskId] = useState(() => pickCurrentTask(volunteerTasks)?.id || activeTasks[0]?.id || null)
  const [showOthers, setShowOthers] = useState(false)

  const task = volunteerTasks.find((t) => t.id === selectedTaskId)
  const habitation = task ? habitations.find((h) => h.id === task.habitationId) : null
  const destinationSite = task?.destinationSiteId ? safeSites.find((s) => s.id === task.destinationSiteId) : null

  const routes = habitation && destinationSite ? generateRoutes(habitation.position, destinationSite.position) : []
  const ranked = useMemo(() => (routes.length > 0 ? rankRoutesForProfile(routes, 'young-adult', {}) : []), [routes])

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Map / Safe Route</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Illustrative route for this demo — not a live routing engine.</p>
      </div>

      {activeTasks.length === 0 ? (
        <Card className="p-6">
          <UnavailableState title="No active task selected" hint="Accept a task from My Tasks to see its route." />
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeTasks.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTaskId(t.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                selectedTaskId === t.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      {!task ? null : !destinationSite || ranked.length === 0 ? (
        <Card className="p-6">
          <UnavailableState title="Route information unavailable" hint="This task has no destination site set." />
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5">
              <Navigation2 size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">From</div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{habitation.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5">
              <MapPin size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">To</div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{destinationSite.name}</div>
              </div>
            </div>
          </div>

          <Card className="h-[240px] p-0 overflow-hidden">
            <GeoMap
              markers={[
                { id: 'origin', type: 'origin', position: habitation.position, label: habitation.name },
                { id: 'destination', type: 'destination', position: destinationSite.position, label: destinationSite.name },
              ]}
              routes={[ranked[0].route]}
              showHazards={false}
            />
          </Card>

          {(() => {
            const primary = ranked[0]
            const primaryLabel = routeConditionLabel(primary.stats.tag, true)
            const others = ranked.slice(1)
            return (
              <>
                <Card className="p-5 border-2 border-blue-300 dark:border-blue-500/50">
                  <Badge tone="blue" className="mb-3">
                    RECOMMENDED ROUTE
                  </Badge>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{primary.route.name}</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">For: {task.title} ({taskTypeLabel(task.type)})</p>
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
                      <b>Road affected near a {primary.stats.dominantHazardLabel.toLowerCase()} zone.</b> Use an alternate route below.
                    </div>
                  )}

                  <Button className="w-full" onClick={() => navigate(`/app/tasks/${task.id}`)}>
                    Navigate to task location
                  </Button>
                </Card>

                {others.length > 0 && (
                  <div>
                    <button onClick={() => setShowOthers((v) => !v)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
                      <ChevronDown size={16} className={`transition-transform ${showOthers ? 'rotate-180' : ''}`} /> Other routes ({others.length})
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
              </>
            )
          })()}
        </>
      )}

      <div className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>Route condition is illustrative frontend prototype data — not a live traffic or hazard feed.</span>
      </div>
    </div>
  )
}
