import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Droplet, HeartPulse, Car, Briefcase, Gauge, ShieldCheck, Warehouse, ArrowUpRight } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SelectedHabitationBar from '../components/ui/SelectedHabitationBar'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import AssignmentBreadcrumb from '../components/ui/AssignmentBreadcrumb'
import { safeSites } from '../data/safeSites'
import { CAPACITY_DIMENSIONS, computeEffectiveCapacity, computeAvailableCapacity, computeCurrentLoadPct, computeSuitabilityScore } from '../utils/capacityCalculations'
import { useAppState } from '../state/AppStateContext'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'
import { useProviderData } from '../provider/providerStore'
import { availabilityStatus } from '../provider/capacityService'
import { VERIFICATION_STATUS, AVAILABILITY_STATUS } from '../types/provider'
import { OPERATION_STATUS } from '../types/geosentra'

export default function SafeSites() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { habitations, selectedHabitationId, selectSite, getOperationForHabitation, updateOperationField } = useAppState()
  const habitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const operation = getOperationForHabitation(habitation.id)
  const inFlow = !!operation && operation.status === OPERATION_STATUS.PLANNING
  const [activeSite, setActiveSite] = useState(null)
  const isCitizen = role === ROLES.CITIZEN
  const isAuthority = role === ROLES.DISASTER_AUTHORITY
  const canPlanRelocation = role === ROLES.DISASTER_AUTHORITY || role === ROLES.EMERGENCY_COORDINATOR

  const { providers, capacitiesById } = useProviderData()
  const providerSnapshots = providers
    .filter((p) => p.verificationStatus !== VERIFICATION_STATUS.REJECTED)
    .map((p) => ({ provider: p, status: availabilityStatus(capacitiesById[p.id]) }))
  const availableProviderCount = providerSnapshots.filter((s) => s.status === AVAILABILITY_STATUS.AVAILABLE).length

  const selectForCase = (siteId) => {
    selectSite(siteId)
    if (inFlow) {
      updateOperationField(habitation.id, { safeSiteId: siteId })
      navigate('/app/infrastructure')
    } else {
      navigate('/app/routes')
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Relief Site Intelligence</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Effective relief capacity is bound by the weakest supporting-infrastructure dimension — safety score, suitability and available capacity are three
          distinct numbers, not one.
        </p>
      </div>

      {inFlow && <AssignmentBreadcrumb operation={operation} />}

      <SelectedHabitationBar />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {safeSites.map((site) => {
          const { effectiveCapacity, bottleneckLabel } = computeEffectiveCapacity(site)
          const availableCapacity = computeAvailableCapacity(site)
          const loadPct = computeCurrentLoadPct(site)
          const suitability = computeSuitabilityScore(site, habitation, availableCapacity)
          return (
            <Card key={site.id} hover className="p-6 flex flex-col animate-fade-up">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{site.name}</h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{site.type}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{site.safetyScoreBase}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Safety Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4 text-sm">
                <MiniStat label="Effective Capacity" value={effectiveCapacity.toLocaleString()} />
                <MiniStat label="Current Load" value={`${loadPct}%`} tone={loadPct > 80 ? 'danger' : loadPct > 50 ? 'warning' : 'good'} />
                <MiniStat label="Available Capacity" value={availableCapacity.toLocaleString()} />
                <MiniStat label={`Suitability for ${habitation.name}`} value={`${suitability}%`} tone={suitability >= 75 ? 'good' : suitability >= 55 ? 'warning' : 'danger'} />
              </div>

              {!isCitizen && (
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs text-slate-500 dark:text-slate-400 mb-5">
                  <InfraTag icon={Droplet} label="Water" value={`${site.capacity.waterCapacity.toLocaleString()}`} />
                  <InfraTag icon={HeartPulse} label="Medical" value={`${site.capacity.medicalCapacity.toLocaleString()}`} />
                  <InfraTag icon={Car} label="Roads" value={site.roadAccess} />
                  <InfraTag icon={Briefcase} label="Livelihood" value={site.livelihoodAccess} />
                </div>
              )}

              {!isCitizen && (
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                  Bottleneck limitations: <b className="text-red-600 dark:text-red-400">{bottleneckLabel}</b>
                </div>
              )}

              <div className="mt-auto flex items-center gap-2">
                {!isCitizen && (
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setActiveSite(site)}>
                    <Gauge size={14} /> Capacity Breakdown
                  </Button>
                )}
                {canPlanRelocation && (
                  <Button size="sm" className="flex-1" onClick={() => navigate(`/app/assign-coordinator/${habitation.id}`)}>
                    Assign Coordinator
                  </Button>
                )}
              </div>
              {(!isAuthority || inFlow) && (
                <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => selectForCase(site.id)}>
                  <ShieldCheck size={14} /> {inFlow ? 'Select This Relief Site' : 'Route to This Site'}
                </Button>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Warehouse size={16} className="text-emerald-600 dark:text-emerald-400" /> Provider-Submitted Resources
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {providerSnapshots.length} provider{providerSnapshots.length === 1 ? '' : 's'} registered · {availableProviderCount} currently available
          </p>
        </div>
        <Link to="/app/resource-network" className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:gap-1.5 transition-all shrink-0">
          Open Resource Network <ArrowUpRight size={14} />
        </Link>
      </Card>

      <DataStatusPanel />

      <Modal open={!!activeSite} onClose={() => setActiveSite(null)} title={activeSite?.name} wide>
        {activeSite && (
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Effective capacity is constrained by physical space, water, medical support, sanitation, food and accessibility — not land area alone. The
              weakest dimension below is the real ceiling on how many people this site can safely support.
            </p>
            <div className="space-y-4 mb-6">
              {CAPACITY_DIMENSIONS.map((d) => {
                const val = activeSite.capacity[d.key]
                const max = Math.max(...Object.values(activeSite.capacity))
                const isBottleneck = val === Math.min(...Object.values(activeSite.capacity))
                return (
                  <div key={d.key}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className={`font-medium ${isBottleneck ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {d.label} {isBottleneck && '(bottleneck)'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{val.toLocaleString()}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${isBottleneck ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(val / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4">
                <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Effective Capacity</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{computeEffectiveCapacity(activeSite).effectiveCapacity.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-4">
                <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Current Occupancy + Reserved</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{(activeSite.currentOccupancy + activeSite.reservedCapacity).toLocaleString()}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700 p-4">
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Available Capacity</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{computeAvailableCapacity(activeSite).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function MiniStat({ label, value, tone }) {
  const toneClass = tone ? { good: 'text-emerald-600 dark:text-emerald-400', warning: 'text-amber-600 dark:text-amber-400', danger: 'text-red-600 dark:text-red-400' }[tone] : 'text-slate-900 dark:text-slate-100'
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5 truncate" title={label}>
        {label}
      </div>
      <div className={`text-base font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}

function InfraTag({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
      <span>
        {label}: <b className="text-slate-700 dark:text-slate-300">{value}</b>
      </span>
    </div>
  )
}
