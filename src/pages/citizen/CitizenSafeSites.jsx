import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Navigation2, Accessibility, ShieldCheck } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ConnectionStatus from '../../components/ui/ConnectionStatus'
import { safeSites } from '../../data/safeSites'
import { getRelocationMatches } from '../../data/relocationMatches'
import { computeCurrentLoadPct } from '../../utils/capacityCalculations'
import { useAppState } from '../../state/AppStateContext'
import { useLanguage } from '../../context/LanguageContext'
import { capacityStatusLabel, capacityToneForLabel } from './citizenLabels'

const ESTIMATE_TRAVEL_MIN = (distanceKm) => Math.max(4, Math.round((distanceKm / 30) * 60))

const FILTERS = [
  { id: 'nearest', label: 'Nearest' },
  { id: 'available', label: 'Available space' },
  { id: 'accessible', label: 'Accessible' },
]

export default function CitizenSafeSites() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { habitations, selectedHabitationId, selectSite, setCustomRoute } = useAppState()
  const myHabitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const [filter, setFilter] = useState('nearest')

  const matches = useMemo(() => getRelocationMatches(myHabitation), [myHabitation])

  const rows = useMemo(() => {
    let list = matches.map((m, i) => {
      const site = safeSites.find((s) => s.id === m.siteId)
      const loadPct = computeCurrentLoadPct(site)
      const statusLabel = capacityStatusLabel(loadPct)
      return { site, match: m, statusLabel, isRecommended: i === 0 }
    })
    if (filter === 'available') list = list.filter((r) => r.statusLabel === 'Space available' || r.statusLabel === 'Filling up')
    if (filter === 'accessible') list = list.filter((r) => r.site.accessibility?.wheelchairAccessible)
    if (filter === 'nearest') list = [...list].sort((a, b) => a.match.distanceKm - b.match.distanceKm)
    return list
  }, [matches, filter])

  const openDetail = (siteId) => {
    selectSite(siteId)
    navigate(`/app/safe-sites/${siteId}`)
  }

  const getRoute = (site) => {
    setCustomRoute({
      origin: { id: myHabitation.id, name: myHabitation.name, lat: myHabitation.position.lat, lng: myHabitation.position.lng },
      destination: { id: site.id, name: site.name, lat: site.position.lat, lng: site.position.lng },
    })
    navigate('/app/routes')
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('safeSites')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Places you can go if you need to leave your area.</p>
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

      <div className="space-y-4">
        {rows.map(({ site, match, statusLabel, isRecommended }) => (
          <Card key={site.id} hover className={`p-5 ${isRecommended ? 'border-2 border-blue-300 dark:border-blue-500/50' : ''}`}>
            {isRecommended && (
              <Badge tone="blue" icon={ShieldCheck} className="mb-3">
                RECOMMENDED SAFE SITE
              </Badge>
            )}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{site.name}</h3>
              <Badge tone={capacityToneForLabel(statusLabel)} className="shrink-0">
                {statusLabel}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300 mb-3">
              <span className="flex items-center gap-1.5">
                <Navigation2 size={14} className="text-slate-400" /> {match.distanceKm} km away
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" /> {ESTIMATE_TRAVEL_MIN(match.distanceKm)} min by road
              </span>
              {site.accessibility?.wheelchairAccessible && (
                <span className="flex items-center gap-1.5">
                  <Accessibility size={14} className="text-slate-400" /> Wheelchair accessible
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => openDetail(site.id)}>
                {t('viewDetails')}
              </Button>
              <Button size="sm" onClick={() => getRoute(site)}>
                {t('getRoute')}
              </Button>
            </div>
          </Card>
        ))}

        {rows.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">No safe sites match this filter right now.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setFilter('nearest')}>
              Show all
            </Button>
          </Card>
        )}
      </div>

      <ConnectionStatus />
    </div>
  )
}
