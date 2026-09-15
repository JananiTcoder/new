import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, Lock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/FormField'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../auth/roleConfig'
import { validateDisasterAuthorityCredentials } from '../../auth/disasterAuthorityAuth'
import { Compass } from 'lucide-react'

export default function DisasterAuthorityLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await validateDisasterAuthorityCredentials(userId, password)
      if (result.success) {
        login(ROLES.DISASTER_AUTHORITY)
        navigate('/app')
      } else {
        setError(result.error || 'Invalid User ID or Password.')
      }
    } catch {
      setError('Invalid User ID or Password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium pr-4 border-r border-slate-300 dark:border-slate-700"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            {/* Government Branding */}
            <div className="hidden sm:flex items-center gap-4 pr-6 border-r border-slate-300 dark:border-slate-700">
              <div className="flex items-center justify-center shrink-0 w-8">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                  alt="Emblem of India"
                  className="h-10 w-auto grayscale contrast-125 dark:invert"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#112a46] dark:text-slate-200 text-xs leading-tight">Government of India</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">Ministry of Home Affairs</span>
              </div>
            </div>

            {/* GeoSentra Branding */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Compass size={20} className="text-white" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-[#1a4b85] dark:text-blue-400 leading-none tracking-tight">GeoSentra</span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  National Disaster Management Authority
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LOGIN CARD */}
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <Card className="w-full max-w-md p-8 shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-6">
            <div className="h-12 w-12 rounded-xl bg-[#153a6b] text-white flex items-center justify-center shadow-md">
              <ShieldAlert size={26} strokeWidth={1.8} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
              <Lock size={12} />
              Authorized Personnel Only
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Disaster Authority Login
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Enter your official credentials to access the risk assessment, monitoring & response dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Field label="User ID" required>
              <Input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID (e.g. DA001)"
                autoComplete="username"
                autoFocus
              />
            </Field>

            <Field label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 font-medium flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#153a6b] hover:bg-[#112a46] text-white py-3 font-semibold shadow-sm transition-colors"
              size="lg"
            >
              {isSubmitting ? 'Authenticating...' : 'Login'}
            </Button>
          </form>

          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Demo Credentials: <span className="font-semibold text-slate-600 dark:text-slate-300">DA001</span> / <span className="font-semibold text-slate-600 dark:text-slate-300">GeoSentra@123</span>
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}
