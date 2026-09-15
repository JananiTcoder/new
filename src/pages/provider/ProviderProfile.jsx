import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Field, Input } from '../../components/ui/FormField'
import { useProviderAuth } from '../../provider/ProviderAuthContext'
import { useProviderData } from '../../provider/providerStore'
import { VERIFICATION_STATUS } from '../../types/provider'

const VERIFICATION_TONE = {
  [VERIFICATION_STATUS.VERIFIED]: 'good',
  [VERIFICATION_STATUS.PENDING]: 'warning',
  [VERIFICATION_STATUS.NEEDS_CORRECTION]: 'warning',
  [VERIFICATION_STATUS.REJECTED]: 'danger',
}

const EDITABLE_FIELDS = [
  { key: 'contactPerson', label: 'Authorized contact person' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone number' },
  { key: 'address', label: 'Full address' },
  { key: 'district', label: 'District' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'latitude', label: 'Latitude', type: 'number' },
  { key: 'longitude', label: 'Longitude', type: 'number' },
  { key: 'infrastructureType', label: 'Infrastructure type' },
]

export default function ProviderProfile() {
  const { provider } = useProviderAuth()
  const { updateProvider } = useProviderData()
  const [form, setForm] = useState(provider)
  const [saved, setSaved] = useState(false)

  const set = (k) => (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const submit = (e) => {
    e.preventDefault()
    updateProvider(provider.id, {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    })
    setSaved(true)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[900px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Provider Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{provider.providerName} · {provider.accountType}</p>
        </div>
        <Badge tone={VERIFICATION_TONE[provider.verificationStatus]}>{provider.verificationStatus}</Badge>
      </div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Infrastructure / Organization name">
              <Input value={form.providerName} disabled className="opacity-60 cursor-not-allowed" />
            </Field>
            <Field label="Login username" hint="Fixed at signup — matches your registered name.">
              <Input value={form.username} disabled className="opacity-60 cursor-not-allowed" />
            </Field>
            {EDITABLE_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <Input type={f.type || 'text'} step={f.type === 'number' ? 'any' : undefined} value={form[f.key] ?? ''} onChange={set(f.key)} />
              </Field>
            ))}
          </div>

          {provider.verificationNote && (
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Disaster Authority note: </span>
              {provider.verificationNote}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit">Save changes</Button>
            {saved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Editing your profile after verification may return your account to Pending Verification, at the Disaster Authority's discretion. This prototype does not enforce that automatically.
      </p>
    </div>
  )
}
