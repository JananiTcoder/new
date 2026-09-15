import { useState } from 'react'
import { FileWarning, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Field, Input, Select, Textarea, Checkbox } from '../../components/ui/FormField'
import { EmptyState } from '../../components/ui/DataStates'
import { useAppState } from '../../state/AppStateContext'

const INCIDENT_TYPES = ['Flooding', 'Blocked road', 'Injured person', 'Missing person', 'Building damage', 'Fire', 'Resource shortage', 'Unsafe route', 'Other']
const SEVERITIES = ['Low', 'Moderate', 'High', 'Critical']

const EMPTY_FORM = { incidentType: '', location: '', description: '', severity: '', peopleAffected: '', relatedTaskId: '', immediateAssistanceRequired: false }

const STATUS_TONE = { Draft: 'default', 'Submitted in demo': 'blue', 'Under review': 'warning', Escalated: 'danger', Resolved: 'good' }

export default function ReportIncident() {
  const { volunteerTasks, volunteerIncidents, reportVolunteerIncident } = useAppState()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [justSubmitted, setJustSubmitted] = useState(false)

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const validate = () => {
    const next = {}
    if (!form.incidentType) next.incidentType = 'Please select an incident type.'
    if (!form.location.trim()) next.location = 'Please enter a location.'
    if (!form.description.trim()) next.description = 'Please describe the incident.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setJustSubmitted(false)
    if (!validate()) return
    reportVolunteerIncident({ ...form, peopleAffected: form.peopleAffected ? Number(form.peopleAffected) : null, relatedTaskId: form.relatedTaskId || null })
    setForm(EMPTY_FORM)
    setJustSubmitted(true)
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileWarning size={22} className="text-blue-600 dark:text-blue-400" /> Report Incident
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">This is a frontend demo — incidents are recorded locally, not sent to a real coordinator.</p>
      </div>

      {justSubmitted && (
        <Card className="p-4 flex items-center gap-3 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
          <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Incident recorded in demo mode.</p>
        </Card>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Incident type" required error={errors.incidentType}>
            <Select value={form.incidentType} error={!!errors.incidentType} onChange={(e) => update('incidentType', e.target.value)}>
              <option value="">Select an incident type</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Location" required error={errors.location}>
            <Input value={form.location} error={!!errors.location} onChange={(e) => update('location', e.target.value)} placeholder="Where is this happening?" />
          </Field>

          <Field label="Description" required error={errors.description}>
            <Textarea value={form.description} error={!!errors.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe what you're seeing..." />
          </Field>

          <Field label="Severity (optional)">
            <Select value={form.severity} onChange={(e) => update('severity', e.target.value)}>
              <option value="">Not specified</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="People affected (optional)">
            <Input type="number" min="0" value={form.peopleAffected} onChange={(e) => update('peopleAffected', e.target.value)} />
          </Field>

          <Field label="Related task (optional)">
            <Select value={form.relatedTaskId} onChange={(e) => update('relatedTaskId', e.target.value)}>
              <option value="">Not related to a task</option>
              {volunteerTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>

          <Checkbox label="Immediate assistance required" checked={form.immediateAssistanceRequired} onChange={(v) => update('immediateAssistanceRequired', v)} />

          <p className="text-[11px] text-slate-400 dark:text-slate-500">Photo upload is not available in this prototype.</p>

          <Button type="submit" className="w-full">
            Submit Report
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Incident History</h3>
        {volunteerIncidents.length === 0 ? (
          <EmptyState message="No incidents reported yet." />
        ) : (
          <div className="space-y-2.5">
            {volunteerIncidents.map((i) => (
              <div key={i.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{i.incidentType}</span>
                  <Badge tone={STATUS_TONE[i.status] || 'default'}>{i.status}</Badge>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{i.location}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(i.createdAt).toLocaleString('en-GB')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
