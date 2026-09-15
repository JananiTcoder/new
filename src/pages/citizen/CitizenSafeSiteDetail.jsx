import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Accessibility, Droplet, HeartPulse, Utensils, ShieldAlert, Phone } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import GeoMap from '../../components/map/GeoMap'
import { InfoUnavailable } from '../../components/ui/DataStates'
import { getSafeSite } from '../../data/safeSites'
import { computeCurrentLoadPct } from '../../utils/capacityCalculations'
import { emergencyContacts } from '../../data/emergencyContacts'
import { useAppState } from '../../state/AppStateContext'
import { useLanguage } from '../../context/LanguageContext'
import { capacityStatusLabel, capacityToneForLabel } from './citizenLabels'

const ACCESSIBILITY_LABELS = {
  wheelchairAccessible: 'Wheelchair accessible',
  rampAvailable: 'Ramp available',
  accessibleToilets: 'Accessible toilets',
  medicalAssistance: 'Medical assistance',
  priorityAssistance: 'Priority assistance',
  signLanguageSupport: 'Sign-language support',
  childFriendly: 'Child-friendly',
  elderlyFriendly: 'Elderly-friendly',
}

export default function CitizenSafeSiteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { habitations, selectedHabitationId, setCustomRoute } = useAppState()
  const myHabitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const site = getSafeSite(id)

  if (!site) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">This safe site could not be found.</p>
          <Button size="sm" className="mt-3" onClick={() => navigate('/app/safe-sites')}>
            Back to Safe Sites
          </Button>
        </Card>
      </div>
    )
  }

  const loadPct = computeCurrentLoadPct(site)
  const statusLabel = capacityStatusLabel(loadPct)
  const accessibilityEntries = site.accessibility ? Object.entries(site.accessibility) : []
  const hasAnyAccessibility = accessibilityEntries.some(([, v]) => v)

  const facilities = [
    site.capacity?.waterCapacity > 0 && { icon: Droplet, label: 'Drinking water available' },
    site.capacity?.medicalCapacity > 0 && { icon: HeartPulse, label: 'Medical support available' },
    site.capacity?.foodCapacity > 0 && { icon: Utensils, label: 'Food available' },
  ].filter(Boolean)

  const getRoute = () => {
    setCustomRoute({
      origin: { id: myHabitation.id, name: myHabitation.name, lat: myHabitation.position.lat, lng: myHabitation.position.lng },
      destination: { id: site.id, name: site.name, lat: site.position.lat, lng: site.position.lng },
    })
    navigate('/app/routes')
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
      <button onClick={() => navigate('/app/safe-sites')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <ArrowLeft size={15} /> Safe Sites
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{site.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
          <MapPin size={14} /> {site.district}
        </p>
      </div>

      <Badge tone={capacityToneForLabel(statusLabel)} className="text-sm px-3 py-1.5">
        {statusLabel}
      </Badge>

      <Card className="h-[220px] p-0 overflow-hidden">
        <GeoMap markers={[{ id: site.id, type: 'site', shape: 'box', position: site.position, label: site.name }]} showHazards={false} zoom={13} center={[site.position.lat, site.position.lng]} />
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
          <Accessibility size={16} className="text-blue-600 dark:text-blue-400" /> {t('accessibilityInfo')}
        </h3>
        {!hasAnyAccessibility ? (
          <InfoUnavailable message={t('accessibilityUnavailable')} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {accessibilityEntries
              .filter(([, v]) => v)
              .map(([key]) => (
                <div key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Accessibility size={13} className="text-emerald-500 shrink-0" /> {ACCESSIBILITY_LABELS[key] || key}
                </div>
              ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Facilities</h3>
        {facilities.length === 0 ? (
          <InfoUnavailable message="Facility information unavailable" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {facilities.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Icon size={13} className="text-blue-500 shrink-0" /> {label}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
          <ShieldAlert size={16} className="text-amber-500" /> Safety Instructions
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Bring identification and essential medication if possible. Follow directions from on-site staff or volunteers. Keep children and elderly family
          members close during entry.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        <Button onClick={getRoute}>{t('getRoute')}</Button>
        <Button variant="secondary" onClick={() => navigate('/app/emergency')}>
          <Phone size={15} /> Contact / help
        </Button>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">Emergency contacts: {emergencyContacts.length} available on the Emergency / SOS page.</p>
    </div>
  )
}
