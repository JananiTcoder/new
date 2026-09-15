import { useState } from 'react'
import { FileWarning, CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/FormField'
import { useAppState } from '../../state/AppStateContext'
import { useLanguage } from '../../context/LanguageContext'

const ISSUE_TYPES = ['Blocked road', 'Flooded road', 'Shelter full', 'Unsafe route', 'Missing emergency support', 'Damaged infrastructure', 'Other issue']
const SEVERITIES = ['Low', 'Moderate', 'High']

const EMPTY_FORM = { issueType: '', location: '', description: '', severity: '' }

const STATUS_TONE = { Draft: 'default', 'Submitted in demo': 'blue', 'Under review': 'warning', Resolved: 'good' }

export default function ReportIssue() {
  const { t } = useLanguage()
  const { citizenReports, reportIssue } = useAppState()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [justSubmitted, setJustSubmitted] = useState(false)

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const validate = () => {
    const next = {}
    if (!form.issueType) next.issueType = 'Please select an issue type.'
    if (!form.location.trim()) next.location = 'Please enter a location or area.'
    if (!form.description.trim()) next.description = 'Please describe the issue.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setJustSubmitted(false)
    if (!validate()) return
    reportIssue(form)
    setForm(EMPTY_FORM)
    setJustSubmitted(true)
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileWarning size={22} className="text-blue-600 dark:text-blue-400" /> {t('reportIssue')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tell us what you're seeing. This is a frontend demo — reports are recorded locally, not sent to a real authority.</p>
      </div>

      {justSubmitted && (
        <Card className="p-4 flex items-center gap-3 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
          <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Your report has been recorded in this demo.</p>
        </Card>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Issue type" required error={errors.issueType}>
            <Select value={form.issueType} error={!!errors.issueType} onChange={(e) => update('issueType', e.target.value)}>
              <option value="">Select an issue type</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Location / area" required error={errors.location} hint="e.g. a habitation name, street or landmark">
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

          <p className="text-[11px] text-slate-400 dark:text-slate-500">Photo upload is not available in this prototype.</p>

          <Button type="submit" className="w-full">
            {t('submitReport')}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">{t('myReports')}</h3>
        {citizenReports.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">You haven't submitted any reports yet.</p>
        ) : (
          <div className="space-y-2.5">
            {citizenReports.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{r.issueType}</span>
                  <Badge tone={STATUS_TONE[r.status] || 'default'}>{r.status}</Badge>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{r.location}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(r.createdAt).toLocaleString('en-GB')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
