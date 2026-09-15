import { useState } from 'react'
import { Siren, Phone, MapPin, AlertTriangle, Info, HeartPulse, ShieldAlert, UserX, Navigation2, HelpCircle, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Field, Select, Textarea, Checkbox } from '../../components/ui/FormField'
import { emergencyContacts } from '../../data/emergencyContacts'
import { useAppState } from '../../state/AppStateContext'
import { pickCurrentTask } from './volunteerLabels'

const EMERGENCY_TYPES = [
  { id: 'medical', label: 'Medical emergency', icon: HeartPulse },
  { id: 'unsafe-location', label: 'Unsafe location', icon: AlertTriangle },
  { id: 'team-injured', label: 'Team member injured', icon: HeartPulse },
  { id: 'threat', label: 'Threat or violence', icon: ShieldAlert },
  { id: 'route-blocked', label: 'Route blocked', icon: Navigation2 },
  { id: 'lost', label: 'Lost or separated', icon: UserX },
  { id: 'other', label: 'Other', icon: HelpCircle },
]

export default function VolunteerSOS() {
  const { habitations, volunteerTasks, volunteerSOSRequests, sendVolunteerSOS } = useAppState()
  const currentTask = pickCurrentTask(volunteerTasks)
  const habitation = currentTask ? habitations.find((h) => h.id === currentTask.habitationId) : null

  const [emergencyType, setEmergencyType] = useState('medical')
  const [description, setDescription] = useState('')
  const [immediate, setImmediate] = useState(true)
  const [justSent, setJustSent] = useState(false)

  const submit = () => {
    sendVolunteerSOS({ emergencyType, relatedTaskId: currentTask?.id || null, area: habitation?.name || null, description, immediateAssistanceRequired: immediate })
    setJustSent(true)
    setDescription('')
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Siren size={22} className="text-red-600 dark:text-red-400" /> SOS / Emergency
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Emergency contacts and instructions for this demo.</p>
      </div>

      {justSent && (
        <Card className="p-4 flex items-start gap-3 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
          <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">SOS recorded in demo mode.</p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">No real emergency dispatch was initiated.</p>
          </div>
        </Card>
      )}

      <Card className="p-6 border-2 border-red-300 dark:border-red-500/50">
        <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5 flex items-center gap-2.5 mb-4">
          <MapPin size={16} className="text-slate-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Current task & area (demo)</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentTask ? `${currentTask.title} — ${habitation?.name || 'Area unavailable'}` : 'No active task'}</div>
          </div>
        </div>

        <Field label="Emergency type" className="mb-4">
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
        </Field>

        <Field label="Description (optional)" className="mb-4">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the emergency..." />
        </Field>

        <Checkbox label="Immediate assistance required" checked={immediate} onChange={setImmediate} className="mb-4" />

        <Button variant="danger" size="lg" className="w-full" onClick={submit}>
          <Siren size={18} /> Send SOS
        </Button>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">This records a demo emergency request. It does not place a real call or send a real dispatch.</p>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
          <Phone size={16} className="text-blue-600 dark:text-blue-400" /> Emergency Contacts
        </h3>
        <div className="space-y-2.5">
          {emergencyContacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{c.label}</span>
                  {c.isDemo && <Badge tone="default">Demo contact</Badge>}
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

      {volunteerSOSRequests.length > 0 && (
        <Card className="p-5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Your SOS History</h3>
          <div className="space-y-2">
            {volunteerSOSRequests.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{EMERGENCY_TYPES.find((t) => t.id === s.emergencyType)?.label || s.emergencyType}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(s.createdAt).toLocaleString('en-GB')}</div>
                </div>
                <Badge tone="blue">{s.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex gap-3">
        <Info size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">Live location sharing is unavailable in this demo. In a real emergency, always contact local emergency services directly.</p>
      </div>
    </div>
  )
}
