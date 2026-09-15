import { useState } from 'react'
import { Siren, Phone, MapPin, ShieldCheck, AlertTriangle, Info, Flame, HeartPulse, Building2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { emergencyContacts } from '../../data/emergencyContacts'
import { getRelocationMatches } from '../../data/relocationMatches'
import { useAppState } from '../../state/AppStateContext'
import { useLanguage } from '../../context/LanguageContext'

const EMERGENCY_TYPES = [
  { id: 'medical', label: 'Medical', icon: HeartPulse },
  { id: 'fire', label: 'Fire', icon: Flame },
  { id: 'hazard', label: 'Hazard / Flood', icon: AlertTriangle },
  { id: 'shelter', label: 'Shelter Help', icon: Building2 },
]

export default function EmergencySOS() {
  const { t } = useLanguage()
  const { habitations, safeSites, selectedHabitationId } = useAppState()
  const myHabitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0]
  const [sosOpen, setSosOpen] = useState(false)
  const [emergencyType, setEmergencyType] = useState('hazard')

  const nearestSite = safeSites.find((s) => s.id === getRelocationMatches(myHabitation)[0]?.siteId)

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Siren size={22} className="text-red-600 dark:text-red-400" /> {t('emergencySOS')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Emergency contacts and instructions for this demo.</p>
      </div>

      <Card className="p-6 border-2 border-red-300 dark:border-red-500/50 text-center">
        <Button variant="danger" size="lg" className="w-full" onClick={() => setSosOpen(true)}>
          <Siren size={18} /> {t('iNeedHelp')}
        </Button>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">This opens a demo emergency screen. It does not place a real call or send a real dispatch.</p>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
          <Phone size={16} className="text-blue-600 dark:text-blue-400" /> {t('emergencyContacts')}
        </h3>
        <div className="space-y-2.5">
          {emergencyContacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{c.label}</span>
                  {c.isDemo && <Badge tone="default">{t('demoContact')}</Badge>}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{c.description}</div>
              </div>
              <a href={`tel:${c.number}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0 ml-3">
                {c.number}
              </a>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex gap-3">
        <Info size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">Live location sharing is unavailable in this demo. In a real emergency, always contact local emergency services directly.</p>
      </div>

      {sosOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/70" onClick={() => setSosOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <Siren size={22} className="text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('iNeedHelp')}</h2>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5 flex items-center gap-2.5">
              <MapPin size={16} className="text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Current area (demo)</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{myHabitation.name}, {myHabitation.district}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Emergency type</div>
              <div className="grid grid-cols-2 gap-2">
                {EMERGENCY_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setEmergencyType(t.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      emergencyType === t.id ? 'bg-red-600 border-red-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <t.icon size={15} /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {nearestSite && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3.5 flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold">Nearest safe site</div>
                  <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{nearestSite.name}</div>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Stay calm. Move away from immediate danger if you can. Use the contacts below if you need real help — this demo does not send an alert on your behalf.</p>

            <div className="space-y-2">
              {emergencyContacts.slice(0, 3).map((c) => (
                <a key={c.id} href={`tel:${c.number}`} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.label}</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{c.number}</span>
                </a>
              ))}
            </div>

            <Button variant="secondary" className="w-full" onClick={() => setSosOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
