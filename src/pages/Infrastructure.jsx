import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, BedDouble, DoorOpen, Gauge, ShieldQuestion, AlertTriangle, Phone, Clock } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SelectedHabitationBar from '../components/ui/SelectedHabitationBar'
import AssignmentBreadcrumb from '../components/ui/AssignmentBreadcrumb'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import { getSafeSite } from '../data/safeSites'
import { useAppState } from '../state/AppStateContext'
import { useProviderData } from '../provider/providerStore'
import { getInfrastructureForSafeSite } from '../provider/capacityService'
import { VERIFICATION_STATUS, AVAILABILITY_STATUS, OPERATING_STATUS } from '../types/provider'

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

function bottleneckLimitations(capacity) {
  if (!capacity) return 'Capacity not yet submitted'
  const missing = []
  if (!capacity.waterAvailable) missing.push('water')
  if (!capacity.toiletsAvailable) missing.push('toilets')
  if (!capacity.electricityAvailable) missing.push('electricity')
  if (!capacity.medicalSupportAvailable) missing.push('medical support')
  if (missing.length === 0) return 'None reported'
  return `No ${missing.join(', ')}`
}

/** Selection guardrails per the capacity-validation rules — never let the
 * authority pick infrastructure that is closed, unverified-as-operational,
 * or has no submitted capacity. */
function selectionBlockedReason(provider, capacity) {
  if (provider.verificationStatus === VERIFICATION_STATUS.REJECTED) return 'This provider has been rejected and cannot be selected.'
  if (!capacity) return 'Capacity has not been submitted for this infrastructure yet.'
  if (capacity.operatingStatus === OPERATING_STATUS.CLOSED) return 'This infrastructure is Closed / Inactive.'
  if (provider.verificationStatus === VERIFICATION_STATUS.PENDING || provider.verificationStatus === VERIFICATION_STATUS.NEEDS_CORRECTION) {
    return 'This infrastructure is Pending Verification — it cannot be selected as verified operational capacity.'
  }
  return null
}

export default function Infrastructure() {
  const navigate = useNavigate()
  const { habitations, selectedHabitationId, selectedSiteId, getOperationForHabitation, updateOperationField } = useAppState()
  const { providers, capacitiesById } = useProviderData()
  const habitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const operation = getOperationForHabitation(habitation.id)
  const site = getSafeSite(operation?.safeSiteId || selectedSiteId)
  const requiredPopulation = operation?.populationRequiring ?? habitation.population

  const infrastructure = getInfrastructureForSafeSite(site, providers, capacitiesById)

  const selectInfrastructure = (snapshot) => {
    const { provider } = snapshot
    if (operation) updateOperationField(habitation.id, { infrastructureId: provider.id })
    navigate('/app/relocation/team')
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <button onClick={() => navigate('/app/relocation')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> Safe Site
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 size={22} className="text-blue-600 dark:text-blue-400" /> Infrastructure at {site?.name || 'Selected Safe Site'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Provider-registered buildings serving {site?.district || 'this district'} — hospitals, schools, community halls, shelters and relief centres.</p>
      </div>

      {operation && <AssignmentBreadcrumb operation={operation} />}

      <SelectedHabitationBar />

      {infrastructure.length === 0 ? (
        <Card className="p-8 text-center">
          <ShieldQuestion size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No verified infrastructure is available for this location.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No provider has registered infrastructure in {site?.district || 'this district'} yet.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/app/relocation')}>
            Choose a Different Safe Site
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {infrastructure.map((snap) => {
            const { provider, capacity } = snap
            const blockedReason = selectionBlockedReason(provider, capacity)
            const insufficient = capacity && capacity.availableCapacity < requiredPopulation
            return (
              <Card key={provider.id} hover className="p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{provider.providerName}</h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <MapPin size={11} /> {provider.accountType} · {provider.city || provider.district}
                    </span>
                  </div>
                  {provider.isDemo && <Badge tone="default">Prototype demo data</Badge>}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge tone={VERIFICATION_TONE[provider.verificationStatus]}>{provider.verificationStatus}</Badge>
                  <Badge tone={AVAILABILITY_TONE[snap.status]}>{snap.status}</Badge>
                  <Badge tone="default">{capacity?.operatingStatus || 'Status unknown'}</Badge>
                </div>

                {capacity ? (
                  <div className="grid grid-cols-2 gap-2.5 text-xs mb-3">
                    <Stat label="Total Capacity" value={capacity.totalCapacity.toLocaleString()} />
                    <Stat label="Current Utilization" value={capacity.occupiedCapacity.toLocaleString()} />
                    <Stat label="Available" value={capacity.availableCapacity.toLocaleString()} tone="good" />
                    <Stat label="Reserved Emergency" value={(capacity.reservedCapacity || 0).toLocaleString()} />
                    {capacity.roomCount != null && <Stat icon={DoorOpen} label="Rooms / Halls" value={capacity.roomCount} />}
                    {capacity.usableBeds != null && <Stat icon={BedDouble} label="Usable Beds" value={capacity.usableBeds} />}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400 dark:text-slate-500 mb-3">Capacity not yet submitted</p>
                )}

                {capacity && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Updated {new Date(capacity.lastUpdated).toLocaleDateString('en-GB')}
                    </span>
                    {capacity.contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} /> {capacity.contactPhone}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-400 dark:text-slate-500 mb-4 flex items-start gap-1.5">
                  <Gauge size={12} className="mt-0.5 shrink-0" />
                  Bottleneck limitations: <b className="text-slate-600 dark:text-slate-300">{bottleneckLimitations(capacity)}</b>
                </div>

                {insufficient && !blockedReason && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400 mb-3 space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Insufficient Capacity
                    </div>
                    <div>Required: {requiredPopulation.toLocaleString()}</div>
                    <div>Available: {capacity.availableCapacity.toLocaleString()}</div>
                    <div>Shortage: {(requiredPopulation - capacity.availableCapacity).toLocaleString()}</div>
                  </div>
                )}

                {blockedReason && <p className="text-xs text-red-600 dark:text-red-400 mb-3">{blockedReason}</p>}

                <Button size="sm" className="mt-auto w-full" disabled={!!blockedReason || insufficient} onClick={() => selectInfrastructure(snap)}>
                  Select This Infrastructure
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      <DataStatusPanel />
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone }) {
  const toneClass = tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-2.5">
      <div className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5 flex items-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </div>
      <div className={`text-sm font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}
