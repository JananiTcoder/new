import { useNavigate } from 'react-router-dom'
import { Droplet, Bath, Zap, UtensilsCrossed, HeartPulse, Accessibility, Users, Package, CheckCircle2, XCircle, Pencil } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/FormField'
import { useProviderAuth } from '../../provider/ProviderAuthContext'
import { useProviderData } from '../../provider/providerStore'
import { OPERATING_STATUS_LIST, DETAIL_CATEGORY } from '../../types/provider'

const FACILITIES = [
  { key: 'waterAvailable', label: 'Water availability', icon: Droplet },
  { key: 'toiletsAvailable', label: 'Toilet availability', icon: Bath },
  { key: 'electricityAvailable', label: 'Electricity availability', icon: Zap },
  { key: 'foodAvailable', label: 'Food availability', icon: UtensilsCrossed },
  { key: 'medicalSupportAvailable', label: 'Medical support', icon: HeartPulse },
  { key: 'accessibilityAvailable', label: 'Accessibility support', icon: Accessibility },
  { key: 'womenChildSupportAvailable', label: 'Women & child safety facilities', icon: Users },
]

const NGO_RESOURCE_LABELS = {
  volunteersAvailable: 'Volunteers available',
  foodPackets: 'Food packets',
  waterPackets: 'Water packets',
  medicalKits: 'Medical kits',
  vehiclesAvailable: 'Vehicles available',
  temporaryShelterCapacity: 'Temporary shelter capacity',
}

function FacilityRow({ icon: Icon, label, ok }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
        <Icon size={15} className="text-slate-400 dark:text-slate-500" /> {label}
      </span>
      {ok ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={14} /> Available
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <XCircle size={14} /> Not available
        </span>
      )}
    </div>
  )
}

export default function ProviderResources() {
  const navigate = useNavigate()
  const { provider } = useProviderAuth()
  const { getCapacity, getDetails, getDetailCategory, upsertCapacity } = useProviderData()
  const capacity = getCapacity(provider.id)
  const category = getDetailCategory(provider.id)
  const ngoDetails = category === DETAIL_CATEGORY.NGO ? getDetails(provider.id)?.ngo : null

  if (!capacity) {
    return (
      <div className="p-4 lg:p-8 max-w-[900px] mx-auto">
        <Card className="p-8 text-center">
          <Package size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-1">No capacity data submitted yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Submit your capacity first — resource availability is drawn from that same record.</p>
          <Button onClick={() => navigate('/provider/capacity')}>Go to Capacity Management</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-[900px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resource Availability</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">What this location currently offers, and its live operating status.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/provider/capacity')}>
          <Pencil size={14} /> Edit full capacity form
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Operating Status</h2>
        </div>
        <Select
          value={capacity.operatingStatus}
          onChange={(e) => upsertCapacity(provider.id, { operatingStatus: e.target.value })}
          className="max-w-xs"
        >
          {OPERATING_STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Changes save immediately and are reflected on the map and in the other portals right away.</p>
        {(capacity.availableFrom || capacity.availableUntil) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Available window: <b>{capacity.availableFrom || 'not set'}</b> to <b>{capacity.availableUntil || 'open-ended'}</b>
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Facilities</h2>
        <div>
          {FACILITIES.map((f) => (
            <FacilityRow key={f.key} icon={f.icon} label={f.label} ok={!!capacity[f.key]} />
          ))}
        </div>
      </Card>

      {ngoDetails && (
        <Card className="p-6">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Relief Resources</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(NGO_RESOURCE_LABELS).map(([key, label]) => (
              <div key={key} className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5">
                <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">{label}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{(ngoDetails[key] ?? 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {capacity.notes && (
        <Card className="p-6">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Additional Notes</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{capacity.notes}</p>
        </Card>
      )}
    </div>
  )
}
