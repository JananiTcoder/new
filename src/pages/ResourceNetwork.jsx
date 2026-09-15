import { useMemo, useState } from 'react'
import { Warehouse, ShieldCheck, ShieldAlert, ShieldX, MapPin, AlertTriangle, HeartHandshake, Navigation2, Building2, CheckCircle2, XCircle, Send } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import DemoToast from '../components/ui/DemoToast'
import MetricCard from '../components/ui/MetricCard'
import GeoMap from '../components/map/GeoMap'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'
import { useAppState } from '../state/AppStateContext'
import { useProviderData } from '../provider/providerStore'
import { aggregateCapacity, availabilityStatus, markerColorForProvider, currentLoadPct, dataStatusLabel, isStale } from '../provider/capacityService'
import { computeDistrictBottlenecks, computeOverallShortage } from '../provider/bottleneckService'
import { VERIFICATION_STATUS, AVAILABILITY_STATUS } from '../types/provider'
import { haversineKm } from '../utils/geo'
import { pickCurrentTask } from './volunteer/volunteerLabels'

const VERIFICATION_TONE = {
  [VERIFICATION_STATUS.VERIFIED]: 'good',
  [VERIFICATION_STATUS.PENDING]: 'warning',
  [VERIFICATION_STATUS.NEEDS_CORRECTION]: 'warning',
  [VERIFICATION_STATUS.REJECTED]: 'danger',
}
const AVAILABILITY_TONE = {
  [AVAILABILITY_STATUS.AVAILABLE]: 'good',
  [AVAILABILITY_STATUS.LIMITED]: 'warning',
  [AVAILABILITY_STATUS.FULL]: 'danger',
  [AVAILABILITY_STATUS.UNAVAILABLE]: 'default',
  [AVAILABILITY_STATUS.NO_DATA]: 'default',
}

export default function ResourceNetwork() {
  const { role } = useAuth()
  const { habitations, selectedHabitationId, safeSites, volunteerTasks, assignResourceToOperation } = useAppState()
  const { providers, capacitiesById, detailsById, setVerificationStatus } = useProviderData()
  const [activeProvider, setActiveProvider] = useState(null)
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [taskFocus, setTaskFocus] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)
  const [toast, setToast] = useState('')

  const confirmAssign = (habitation) => {
    assignResourceToOperation(assignTarget.provider.id, assignTarget.provider.providerName, habitation.id, habitation.name)
    setAssignTarget(null)
    setToast('Resource assignment updated in demo mode.')
  }

  const isAuthority = role === ROLES.DISASTER_AUTHORITY
  const isCoordinator = role === ROLES.EMERGENCY_COORDINATOR
  const isVolunteer = role === ROLES.VOLUNTEERS
  const isCitizen = role === ROLES.CITIZEN

  const habitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]

  const totals = useMemo(() => aggregateCapacity(providers, capacitiesById), [providers, capacitiesById])
  const bottlenecks = useMemo(
    () => computeDistrictBottlenecks({ providers, capacitiesById, detailsById, habitations }),
    [providers, capacitiesById, detailsById, habitations]
  )
  const totalRequiredPopulation = useMemo(() => habitations.reduce((sum, h) => sum + h.population, 0), [habitations])
  const overallShortage = useMemo(
    () => computeOverallShortage({ providers, capacitiesById, requiredPopulation: totalRequiredPopulation }),
    [providers, capacitiesById, totalRequiredPopulation]
  )

  const snapshots = useMemo(
    () =>
      providers.map((p) => {
        const capacity = capacitiesById[p.id]
        return { provider: p, capacity, status: availabilityStatus(capacity), color: markerColorForProvider(p, capacity), loadPct: currentLoadPct(capacity) }
      }),
    [providers, capacitiesById]
  )

  const filteredForAuthority = useMemo(
    () => (verificationFilter === 'all' ? snapshots : snapshots.filter((s) => s.provider.verificationStatus === verificationFilter)),
    [snapshots, verificationFilter]
  )

  const activeSnapshots = snapshots.filter((s) => s.provider.verificationStatus !== VERIFICATION_STATUS.REJECTED)

  const currentTask = pickCurrentTask(volunteerTasks)
  const taskDestination = currentTask?.destinationSiteId ? safeSites.find((s) => s.id === currentTask.destinationSiteId) : null
  const volunteerSnapshots = useMemo(() => {
    if (!taskFocus || !taskDestination) return activeSnapshots
    return [...activeSnapshots]
      .map((s) => ({ ...s, distanceKm: haversineKm(taskDestination.position, { lat: s.provider.latitude, lng: s.provider.longitude }) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [activeSnapshots, taskFocus, taskDestination])
  const nearbyForCitizen = useMemo(() => {
    return activeSnapshots
      .filter((s) => s.status === AVAILABILITY_STATUS.AVAILABLE || s.status === AVAILABILITY_STATUS.LIMITED)
      .map((s) => ({ ...s, distanceKm: haversineKm(habitation.position, { lat: s.provider.latitude, lng: s.provider.longitude }) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [activeSnapshots, habitation])

  const shortageDistricts = bottlenecks.filter((b) => b.bottleneckType)
  const potentialDestinations = useMemo(
    () =>
      [...activeSnapshots]
        .filter((s) => s.capacity && s.capacity.availableCapacity > 0 && s.provider.verificationStatus !== VERIFICATION_STATUS.NEEDS_CORRECTION)
        .sort((a, b) => (b.capacity?.availableCapacity || 0) - (a.capacity?.availableCapacity || 0)),
    [activeSnapshots]
  )

  const resourceSupportTasks = useMemo(() => {
    const tasks = []
    shortageDistricts.forEach((b) => {
      tasks.push({
        id: `district-${b.district}`,
        title: `${b.district}: ${b.bottleneckType}`,
        detail: `Gap of ${Math.max(0, b.capacityGap).toLocaleString()} people vs. ${b.totalUsableCapacity.toLocaleString()} available capacity from ${b.activeProviderCount} active provider(s).`,
        tone: 'danger',
      })
    })
    activeSnapshots
      .filter((s) => s.provider.verificationStatus === VERIFICATION_STATUS.PENDING || s.provider.verificationStatus === VERIFICATION_STATUS.NEEDS_CORRECTION)
      .forEach((s) =>
        tasks.push({
          id: `verify-${s.provider.id}`,
          title: `${s.provider.providerName} is awaiting verification`,
          detail: `${s.provider.district} · Help confirm details so this capacity can count toward planning.`,
          tone: 'warning',
        })
      )
    activeSnapshots
      .filter((s) => s.capacity && (!s.capacity.foodAvailable || !s.capacity.waterAvailable))
      .forEach((s) =>
        tasks.push({
          id: `resource-${s.provider.id}`,
          title: `${s.provider.providerName} needs food/water support`,
          detail: `${s.provider.district} · Reported ${!s.capacity.foodAvailable ? 'no food' : ''}${!s.capacity.foodAvailable && !s.capacity.waterAvailable ? ' and ' : ''}${!s.capacity.waterAvailable ? 'no water' : ''} availability.`,
          tone: 'warning',
        })
      )
    return tasks
  }, [shortageDistricts, activeSnapshots])

  const markers = (isCitizen ? nearbyForCitizen : activeSnapshots).map((s) => ({
    id: s.provider.id,
    type: 'site',
    shape: 'box',
    color: s.color,
    position: { lat: s.provider.latitude, lng: s.provider.longitude },
    label: s.provider.providerName,
  }))

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Warehouse size={22} className="text-emerald-600 dark:text-emerald-400" /> Resource Network
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Capacity and resources submitted by hospitals, schools, community halls, shelters, NGOs and individual contributors through the Resource &
          Infrastructure Provider portal.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Registered Providers" value={providers.length} icon="Building2" trend={`${totals.providerCount} active`} />
        <MetricCard label="Total Registered Capacity" value={totals.totalCapacity} icon="Gauge" />
        <MetricCard label="Currently Available" value={totals.availableCapacity} icon="ShieldCheck" tone="good" />
        <MetricCard label="Occupied + Reserved" value={totals.occupiedCapacity + totals.reservedCapacity} icon="Users" tone="warning" />
      </div>

      {isAuthority && (
        <AuthoritySection
          snapshots={filteredForAuthority}
          verificationFilter={verificationFilter}
          setVerificationFilter={setVerificationFilter}
          bottlenecks={bottlenecks}
          onOpenProvider={setActiveProvider}
          setVerificationStatus={setVerificationStatus}
        />
      )}

      {isCoordinator && (
        <CoordinatorSection
          overallShortage={overallShortage}
          shortageDistricts={shortageDistricts}
          destinations={potentialDestinations}
          onOpenProvider={setActiveProvider}
          onAssign={setAssignTarget}
        />
      )}

      {isVolunteer && (
        <VolunteerSection
          tasks={resourceSupportTasks}
          onOpenProvider={setActiveProvider}
          snapshots={volunteerSnapshots}
          taskFocus={taskFocus}
          setTaskFocus={setTaskFocus}
          currentTask={currentTask}
          taskDestination={taskDestination}
        />
      )}

      {isCitizen && <CitizenSection nearby={nearbyForCitizen} onOpenProvider={setActiveProvider} />}

      <Card className="relative h-[420px] p-0 overflow-hidden">
        <GeoMap markers={markers} showHazards={false} onMarkerClick={(m) => setActiveProvider(snapshots.find((s) => s.provider.id === m.id))} />
        <div className="absolute bottom-4 left-4 z-[500] glass rounded-2xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-4 text-xs max-w-[90%]">
          <LegendBox color="#059669" label="Available" />
          <LegendBox color="#d97706" label="Limited" />
          <LegendBox color="#dc2626" label="Full" />
          <LegendBox color="#64748b" label="Unverified / Inactive" />
        </div>
      </Card>

      <DataStatusPanel />

      <Modal open={!!activeProvider} onClose={() => setActiveProvider(null)} title={activeProvider?.provider?.providerName} wide>
        {activeProvider && <ProviderDetail snapshot={activeProvider} hideContact={isCitizen} />}
      </Modal>

      <Modal open={!!assignTarget} onClose={() => setAssignTarget(null)} title={`Assign ${assignTarget?.provider?.providerName || ''} to an operation`}>
        <div className="space-y-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">Simulated frontend action only — no real provider is notified and no capacity actually moves.</p>
          {habitations.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No habitations available.</p>}
          {habitations.map((h) => (
            <button
              key={h.id}
              onClick={() => confirmAssign(h)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-left"
            >
              <div>
                <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{h.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{h.district}</div>
              </div>
              <Badge tone={h.risk.redZone ? 'danger' : 'default'}>{h.risk.status}</Badge>
            </button>
          ))}
        </div>
      </Modal>

      <DemoToast message={toast} onDismiss={() => setToast('')} />
    </div>
  )
}

function LegendBox({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[3px] border border-white" style={{ background: color }} />
      <span className="text-slate-600 dark:text-slate-300 font-medium">{label}</span>
    </div>
  )
}

function ProviderCard({ snapshot, onOpen, hideContact, onAssign }) {
  const { provider, capacity, status } = snapshot
  return (
    <Card hover className="p-5">
      <div className="cursor-pointer" onClick={() => onOpen(snapshot)}>
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{provider.providerName}</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {provider.accountType} · {provider.district}
            </span>
          </div>
          <Badge tone={AVAILABILITY_TONE[status]}>{status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs my-3">
          <div className="text-slate-500 dark:text-slate-400">
            Available: <b className="text-slate-800 dark:text-slate-200">{capacity ? capacity.availableCapacity.toLocaleString() : '—'}</b>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Total: <b className="text-slate-800 dark:text-slate-200">{capacity ? capacity.totalCapacity.toLocaleString() : '—'}</b>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <Badge tone={VERIFICATION_TONE[provider.verificationStatus]}>{provider.verificationStatus}</Badge>
          <span className="text-slate-400 dark:text-slate-500">{dataStatusLabel(provider)}</span>
        </div>
        {!hideContact && capacity && isStale(capacity.lastUpdated) && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">Capacity information may be outdated.</p>}
      </div>
      {onAssign && (
        <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => onAssign(snapshot)}>
          <Send size={13} /> Assign to Operation
        </Button>
      )}
    </Card>
  )
}

function ProviderDetail({ snapshot, hideContact }) {
  const { provider, capacity, status, loadPct } = snapshot
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={AVAILABILITY_TONE[status]}>{status}</Badge>
        <Badge tone={VERIFICATION_TONE[provider.verificationStatus]}>{provider.verificationStatus}</Badge>
        <Badge tone="default">{dataStatusLabel(provider)}</Badge>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <MapPin size={14} /> {provider.address}, {provider.city}, {provider.district}, {provider.state} {provider.pincode}
      </p>

      {!capacity ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Capacity not yet submitted.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <StatBox label="Total Capacity" value={capacity.totalCapacity} />
            <StatBox label="Available" value={capacity.availableCapacity} tone="good" />
            <StatBox label="Occupied + Reserved" value={capacity.occupiedCapacity + capacity.reservedCapacity} tone="warning" />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Current load</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{loadPct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full ${loadPct > 80 ? 'bg-red-500' : loadPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, loadPct)}%` }} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-1.5 text-xs">
            <FacilityFlag label="Water" ok={capacity.waterAvailable} />
            <FacilityFlag label="Toilets" ok={capacity.toiletsAvailable} />
            <FacilityFlag label="Electricity" ok={capacity.electricityAvailable} />
            <FacilityFlag label="Food" ok={capacity.foodAvailable} />
            <FacilityFlag label="Medical support" ok={capacity.medicalSupportAvailable} />
            <FacilityFlag label="Accessibility support" ok={capacity.accessibilityAvailable} />
            <FacilityFlag label="Women & child safety" ok={capacity.womenChildSupportAvailable} />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">Last updated {new Date(capacity.lastUpdated).toLocaleString('en-GB')}</p>
          {!hideContact && (
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-300">
              Contact: {capacity.contactPerson} · {capacity.contactPhone}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatBox({ label, value, tone = 'default' }) {
  const toneClass = { default: 'text-slate-900 dark:text-slate-100', good: 'text-emerald-600 dark:text-emerald-400', warning: 'text-amber-600 dark:text-amber-400' }[tone]
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">{label}</div>
      <div className={`text-xl font-bold ${toneClass}`}>{value.toLocaleString()}</div>
    </div>
  )
}

function FacilityFlag({ label, ok }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
      {ok ? <CheckCircle2 size={13} className="text-emerald-500" /> : <XCircle size={13} className="text-slate-300 dark:text-slate-600" />}
      {label}
    </div>
  )
}

function AuthoritySection({ snapshots, verificationFilter, setVerificationFilter, bottlenecks, onOpenProvider, setVerificationStatus }) {
  const filters = ['all', ...Object.values(VERIFICATION_STATUS)]
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
          <AlertTriangle size={16} className="text-amber-500" /> Bottleneck Summary by District
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 pr-3">District</th>
                <th className="py-2 pr-3">Required Population</th>
                <th className="py-2 pr-3">Usable Capacity</th>
                <th className="py-2 pr-3">Gap</th>
                <th className="py-2 pr-3">Bottleneck</th>
                <th className="py-2 pr-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {bottlenecks.map((b) => (
                <tr key={b.district} className="border-b border-slate-50 dark:border-slate-800/60">
                  <td className="py-2.5 pr-3 font-medium text-slate-800 dark:text-slate-200">{b.district}</td>
                  <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{b.requiredPopulation.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{b.totalUsableCapacity.toLocaleString()}</td>
                  <td className={`py-2.5 pr-3 font-semibold ${b.capacityGap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{b.capacityGap.toLocaleString()}</td>
                  <td className="py-2.5 pr-3">{b.bottleneckType ? <Badge tone="danger">{b.bottleneckType}</Badge> : <Badge tone="good">None</Badge>}</td>
                  <td className="py-2.5 pr-3 text-slate-400 dark:text-slate-500">{b.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Provider Registry</h2>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setVerificationFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  verificationFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {snapshots.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">No providers match this filter.</p>}
          {snapshots.map((s) => (
            <div key={s.provider.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5">
              <button onClick={() => onOpenProvider(s)} className="text-left min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{s.provider.providerName}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {s.provider.accountType} · {s.provider.district} · {s.capacity ? `${s.capacity.availableCapacity.toLocaleString()} available` : 'No capacity data'}
                </div>
              </button>
              <Badge tone={VERIFICATION_TONE[s.provider.verificationStatus]}>{s.provider.verificationStatus}</Badge>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => setVerificationStatus(s.provider.id, VERIFICATION_STATUS.VERIFIED, 'Verified by Disaster Authority (demo review).')}>
                  <ShieldCheck size={13} /> Verify
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setVerificationStatus(s.provider.id, VERIFICATION_STATUS.NEEDS_CORRECTION, 'Please review and correct submitted details.')}>
                  <ShieldAlert size={13} /> Needs Correction
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setVerificationStatus(s.provider.id, VERIFICATION_STATUS.REJECTED, 'Rejected by Disaster Authority (demo review).')}>
                  <ShieldX size={13} /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
          Approve/reject actions are a prototype workflow only — they are not connected to any real government verification system.
        </p>
      </Card>
    </div>
  )
}

function CoordinatorSection({ overallShortage, shortageDistricts, destinations, onOpenProvider, onAssign }) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
          <Navigation2 size={16} /> Network-Wide Capacity vs. Required Population
        </h2>
        <div className="grid sm:grid-cols-4 gap-3 mb-3">
          <StatBox label="Required Population" value={overallShortage.requiredPopulation} />
          <StatBox label="Available Capacity" value={overallShortage.availableCapacity} tone="good" />
          <StatBox label="Gap" value={Math.max(0, overallShortage.capacityShortage)} tone={overallShortage.capacityShortage > 0 ? 'warning' : 'good'} />
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">Status</div>
            <Badge tone={overallShortage.capacityShortage > 0 ? 'danger' : 'good'}>{overallShortage.label}</Badge>
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Based on {overallShortage.providerCount} active, non-rejected providers across all districts.</p>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Bottleneck Locations</h2>
        {shortageDistricts.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No active bottlenecks detected from current provider data.</p>}
        <div className="space-y-2">
          {shortageDistricts.map((b) => (
            <div key={b.district} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{b.district}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Gap {Math.max(0, b.capacityGap).toLocaleString()} · {b.confidence}</div>
              </div>
              <Badge tone="danger">{b.bottleneckType}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Potential Relocation Destinations</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.slice(0, 9).map((s) => (
            <ProviderCard key={s.provider.id} snapshot={s} onOpen={onOpenProvider} onAssign={onAssign} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function VolunteerSection({ tasks, onOpenProvider, snapshots, taskFocus, setTaskFocus, currentTask, taskDestination }) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
          <HeartHandshake size={16} /> Where Support Is Needed
        </h2>
        {tasks.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No urgent resource tasks right now.</p>}
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${t.tone === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.title}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Building2 size={16} /> {taskFocus && currentTask ? `Resources Near ${currentTask.title}` : 'All Registered Locations'}
          </h2>
          <button
            onClick={() => setTaskFocus((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${taskFocus ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}
          >
            Filter to my current task's destination
          </button>
        </div>
        {taskFocus && !taskDestination ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">No active task with a destination site is selected.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshots.map((s) => (
              <div key={s.provider.id}>
                <ProviderCard snapshot={s} onOpen={onOpenProvider} />
                {taskFocus && s.distanceKm != null && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{s.distanceKm.toFixed(1)} km from destination</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function CitizenSection({ nearby, onOpenProvider }) {
  return (
    <Card className="p-5">
      <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Nearby Available Safe Sites</h2>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Sorted by distance from your selected area. Contact details are withheld for privacy.</p>
      {nearby.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">No providers currently report available capacity near you.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nearby.map((s) => (
          <div key={s.provider.id}>
            <ProviderCard snapshot={s} onOpen={onOpenProvider} hideContact />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              <MapPin size={11} /> {s.distanceKm.toFixed(1)} km away
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
