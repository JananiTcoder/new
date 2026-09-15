import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Brand from '../../components/ui/Brand'
import { Field, Input, Select, Checkbox } from '../../components/ui/FormField'
import { useProviderAuth } from '../../provider/ProviderAuthContext'
import { validateSignup, hasErrors } from '../../provider/providerValidation'
import { ACCOUNT_TYPE_LIST } from '../../types/provider'

const EMPTY_FORM = {
  accountType: '',
  providerName: '',
  contactPerson: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  address: '',
  district: '',
  city: '',
  state: '',
  pincode: '',
  latitude: '',
  longitude: '',
  infrastructureType: '',
  consent: false,
}

export default function ProviderSignup() {
  const navigate = useNavigate()
  const { signup, isUsernameTaken } = useProviderAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const fieldErrors = validateSignup(form, { isUsernameTaken })
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) return
    signup(form)
    navigate('/provider/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950 flex flex-col">
      <header className="px-5 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/provider/login')} className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <Brand iconGradient="from-emerald-500 to-teal-400" />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <Card className="w-full max-w-2xl p-8 animate-fade-up">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
            <UserPlus size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Register as a Resource & Infrastructure Provider</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Hospitals, schools, colleges, community halls, shelters, NGOs and individual contributors can register here to submit real capacity data.
          </p>

          <form onSubmit={submit} className="space-y-6" noValidate>
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Account Type</h2>
              <Field label="Account type" required error={errors.accountType}>
                <Select value={form.accountType} onChange={set('accountType')} error={errors.accountType}>
                  <option value="">Select account type</option>
                  {ACCOUNT_TYPE_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
            </section>

            <section className="grid sm:grid-cols-2 gap-4">
              <Field label="Infrastructure / Organization / Contributor name" required error={errors.providerName} className="sm:col-span-2" hint="Used as your login username — e.g. “Government General Hospital, Chennai” or “Individual Contributor - Janani”.">
                <Input value={form.providerName} onChange={set('providerName')} placeholder="e.g. Corporation Higher Secondary School, Chennai" error={errors.providerName} />
              </Field>
              <Field label="Authorized contact person" required error={errors.contactPerson}>
                <Input value={form.contactPerson} onChange={set('contactPerson')} error={errors.contactPerson} />
              </Field>
              <Field label="Infrastructure type" hint="Defaults to account type if left blank.">
                <Input value={form.infrastructureType} onChange={set('infrastructureType')} placeholder={form.accountType || 'e.g. Hospital, School...'} />
              </Field>
              <Field label="Email" required error={errors.email}>
                <Input type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
              </Field>
              <Field label="Phone number" required error={errors.phone}>
                <Input type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
              </Field>
              <Field label="Password" required error={errors.password}>
                <Input type="password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
              </Field>
              <Field label="Confirm password" required error={errors.confirmPassword}>
                <Input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
              </Field>
            </section>

            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Location</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full address" required error={errors.address} className="sm:col-span-2">
                  <Input value={form.address} onChange={set('address')} error={errors.address} />
                </Field>
                <Field label="District" required error={errors.district}>
                  <Input value={form.district} onChange={set('district')} error={errors.district} />
                </Field>
                <Field label="City" required error={errors.city}>
                  <Input value={form.city} onChange={set('city')} error={errors.city} />
                </Field>
                <Field label="State" required error={errors.state}>
                  <Input value={form.state} onChange={set('state')} error={errors.state} />
                </Field>
                <Field label="Pincode" required error={errors.pincode}>
                  <Input value={form.pincode} onChange={set('pincode')} error={errors.pincode} />
                </Field>
                <Field label="Latitude" required error={errors.latitude} hint="Needed to place this location on the map.">
                  <Input type="number" step="any" value={form.latitude} onChange={set('latitude')} error={errors.latitude} placeholder="e.g. 12.9716" />
                </Field>
                <Field label="Longitude" required error={errors.longitude}>
                  <Input type="number" step="any" value={form.longitude} onChange={set('longitude')} error={errors.longitude} placeholder="e.g. 80.2081" />
                </Field>
              </div>
            </section>

            <Checkbox
              label="I confirm the information above is accurate to the best of my knowledge and consent to it being shared with the Disaster Authority for verification."
              checked={form.consent}
              onChange={(v) => setForm((f) => ({ ...f, consent: v }))}
            />
            {errors.consent && <p className="text-xs text-red-600 dark:text-red-400 -mt-4">{errors.consent}</p>}

            <p className="text-xs text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-3.5 py-2.5 leading-relaxed">
              This is a frontend prototype. Registering here does not create a real government-verified account — your submission starts as{' '}
              <b>Pending Verification</b> until reviewed inside the Disaster Authority portal.
            </p>

            <Button type="submit" className="w-full" size="lg">
              Create Provider Account
            </Button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
            Already registered?{' '}
            <Link to="/provider/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Log in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  )
}
