import { useNavigate } from 'react-router-dom'
import { Building2, Gauge, Users, Clock, MapPin, ShieldCheck, Info } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useProviderAuth } from '../../provider/ProviderAuthContext'
import { useProviderData } from '../../provider/providerStore'
import { availabilityStatus, currentLoadPct, dataStatusLabel, isStale } from '../../provider/capacityService'
import { VERIFICATION_STATUS, AVAILABILITY_STATUS } from '../../types/provider'

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

function StatTile({ label, value, tone = 'default' }) {
  const toneClass = { default: 'text-slate-900 dark:text-slate-100', good: 'text-emerald-600 dark:text-emerald-400', warning: 'text-amber-600 dark:text-amber-400', danger: 'text-red-600 dark:text-red-400' }[tone]
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { provider } = useProviderAuth()
  const { getCapacity } = useProviderData()
  const capacity = getCapacity(provider.id)
  const status = availabilityStatus(capacity)
  const loadPct = currentLoadPct(capacity)

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{provider.providerName}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
            <MapPin size={13} /> {provider.city}, {provider.district}, {provider.state}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={VERIFICATION_TONE[provider.verificationStatus]} icon={ShieldCheck}>
            {provider.verificationStatus}
          </Badge>
          <Badge tone={AVAILABILITY_TONE[status]}>{status}</Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4 flex gap-3">
        <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
          Capacity information is self-reported until verified by the Disaster Authority. Data status: <b>{dataStatusLabel(provider)}</b>.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Infrastructure Name" value={<span className="text-base font-bold leading-snug">{provider.providerName}</span>} />
        <StatTile label="Account Type" value={<span className="text-base font-bold leading-snug">{provider.accountType}</span>} />
        <StatTile label="Total Registered Capacity" value={capacity ? capacity.totalCapacity.toLocaleString() : '—'} />
        <StatTile label="Currently Available" value={capacity ? capacity.availableCapacity.toLocaleString() : '—'} tone="good" />
        <StatTile label="Occupied Capacity" value={capacity ? capacity.occupiedCapacity.toLocaleString() : '—'} />
        <StatTile label="Reserved Capacity" value={capacity ? capacity.reservedCapacity.toLocaleString() : '—'} />
        <StatTile label="Current Load" value={capacity ? `${loadPct}%` : '—'} tone={loadPct > 80 ? 'danger' : loadPct > 50 ? 'warning' : 'good'} />
        <StatTile label="Last Updated" value={capacity ? new Date(capacity.lastUpdated).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'} />
      </div>

      {!capacity && (
        <Card className="p-6 text-center">
          <Gauge size={26} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">You haven't submitted any capacity data yet. Other portals will show "Capacity not yet submitted" for your location until you do.</p>
          <Button onClick={() => navigate('/provider/capacity')}>Submit Capacity Now</Button>
        </Card>
      )}

      {capacity && isStale(capacity.lastUpdated) && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
          Capacity information may be outdated. Please review and update your figures.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Card hover className="p-5 cursor-pointer" onClick={() => navigate('/provider/capacity')}>
          <Gauge size={20} className="text-emerald-600 dark:text-emerald-400 mb-2" />
          <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">Update Capacity</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Total, available, occupied and reserved capacity.</div>
        </Card>
        <Card hover className="p-5 cursor-pointer" onClick={() => navigate('/provider/resources')}>
          <Building2 size={20} className="text-emerald-600 dark:text-emerald-400 mb-2" />
          <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">Resource Availability</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Facilities, operating status and category-specific resources.</div>
        </Card>
        <Card hover className="p-5 cursor-pointer" onClick={() => navigate('/provider/submissions')}>
          <Users size={20} className="text-emerald-600 dark:text-emerald-400 mb-2" />
          <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">Submission Status</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Track your verification status and any correction requests.</div>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <Clock size={13} /> Frontend prototype — no real government verification is performed here.
      </div>
    </div>
  )
}
