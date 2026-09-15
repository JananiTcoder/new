import { useNavigate } from 'react-router-dom'
import { Shield, HeartHandshake, ArrowLeft } from 'lucide-react'
import Card from '../components/ui/Card'
import Brand from '../components/ui/Brand'
import { useAuth } from '../auth/AuthContext'
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../auth/roleConfig'

// Citizen, Emergency Coordinator and Resource & Infrastructure Provider login
// options have been removed from this public role-select screen — their
// pages/routes/permissions (CitizenOverview, OperationDetail's coordinator
// accept/reject flow, /provider/login, etc.) are untouched and still fully
// functional, they are just no longer offered as a public entry point here.
const roles = [
  { id: ROLES.DISASTER_AUTHORITY, icon: Shield, accent: 'from-blue-600 to-blue-500' },
  { id: ROLES.VOLUNTEERS, icon: HeartHandshake, accent: 'from-cyan-600 to-cyan-500' },
]

export default function RoleSelect() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const chooseRole = (roleId) => {
    // Mock frontend-only login: no password, no backend call — this just
    // creates a local session and routes to the shared, role-aware dashboard.
    login(roleId)
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950 flex flex-col">
      <header className="px-5 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <Brand />
        <div className="w-16" />
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12 animate-fade-up">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">How are you using GEOSENTRA?</h1>
            <p className="text-slate-500 dark:text-slate-400">Choose an experience to enter the corresponding dashboard.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {roles.map((role, i) => (
              <Card
                key={role.id}
                hover
                onClick={() => chooseRole(role.id)}
                className="p-7 cursor-pointer animate-fade-up group"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${role.accent} flex items-center justify-center mb-5 shadow-lg shadow-blue-900/10 group-hover:scale-105 transition-transform`}
                >
                  <role.icon size={22} className="text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5">{ROLE_LABELS[role.id]}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{ROLE_DESCRIPTIONS[role.id]}</p>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-10">
            Frontend prototype — selecting a role above creates a mock local session only. No real accounts, passwords or backend authentication are
            involved anywhere in this demo.
          </p>
        </div>
      </main>
    </div>
  )
}
