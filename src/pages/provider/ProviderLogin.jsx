import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, LogIn } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Brand from '../../components/ui/Brand'
import { Field, Input } from '../../components/ui/FormField'
import { useProviderAuth } from '../../provider/ProviderAuthContext'
import { validateLogin, hasErrors } from '../../provider/providerValidation'

export default function ProviderLogin() {
  const navigate = useNavigate()
  const { login } = useProviderAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const fieldErrors = validateLogin(form)
    setErrors(fieldErrors)
    setFormError('')
    if (hasErrors(fieldErrors)) return
    const result = login(form.username, form.password)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    navigate('/provider/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950 flex flex-col">
      <header className="px-5 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <Brand iconGradient="from-emerald-500 to-teal-400" />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <Card className="w-full max-w-md p-8 animate-fade-up">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
            <LogIn size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Resource & Infrastructure Provider Login</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sign in with your registered infrastructure or organization name.</p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Infrastructure / Organization Name" required error={errors.username}>
              <Input value={form.username} onChange={set('username')} placeholder="e.g. Government General Hospital, Chennai" autoComplete="username" />
            </Field>
            <Field label="Password" required error={errors.password}>
              <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" autoComplete="current-password" />
            </Field>

            {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-3.5 py-2.5">{formError}</p>}

            <Button type="submit" className="w-full" size="lg">
              Log In
            </Button>

            <button type="button" onClick={() => setForgotOpen((v) => !v)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Forgot password?
            </button>
            {forgotOpen && (
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-xl px-3.5 py-2.5">
                Password recovery isn't wired to a backend in this prototype. Contact your Disaster Authority administrator, or register a new account below.
              </p>
            )}
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
            New provider?{' '}
            <Link to="/provider/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Register your infrastructure
            </Link>
          </p>
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 leading-relaxed">
            Prototype authentication only — no backend, no real password storage. Do not enter a real password you use elsewhere.
          </p>
        </Card>
      </main>
    </div>
  )
}
