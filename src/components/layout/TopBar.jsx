import { useMemo, useState } from 'react'
import { Menu, Bell, ChevronDown, AlertTriangle, Sun, Moon, ShieldAlert, Info } from 'lucide-react'
import { currentEvent } from '../../data/dashboard'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAppState } from '../../state/AppStateContext'
import { useAuth } from '../../auth/AuthContext'
import RoleBadge from '../ui/RoleBadge'
import Brand from '../ui/Brand'
import { deriveAlerts, filterAlertsForRole } from '../../utils/alerts'

function initialsFor(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const SEVERITY_DOT = { critical: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500' }
const SEVERITY_ICON = { critical: ShieldAlert, warning: AlertTriangle, info: Info }

export default function TopBar({ onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user, role, logout } = useAuth()
  const { habitations, safeSites, institutions, scenario, readAlertIds, markAlertRead } = useAppState()

  const alerts = useMemo(() => filterAlertsForRole(deriveAlerts({ habitations, safeSites, institutions, scenario }), role), [habitations, safeSites, institutions, scenario, role])
  const unreadCount = alerts.filter((a) => !readAlertIds.has(a.id)).length

  return (
    <header className="sticky top-0 z-20 h-16 shrink-0 glass border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <Menu size={20} />
      </button>

      <div className="lg:hidden min-w-0">
        <Brand size="sm" />
      </div>

      <div className="flex-1" />

      <button
        onClick={() => navigate('/app/hazard-intelligence')}
        className="hidden sm:flex items-center gap-2 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
      >
        <AlertTriangle size={13} />
        {currentEvent.name}
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      </button>

      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative">
        <button onClick={() => setNotifOpen((v) => !v)} className="relative h-10 w-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />}
        </button>
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 animate-fade-up z-30">
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Alerts</span>
              <button
                onClick={() => {
                  setNotifOpen(false)
                  navigate('/app/alerts')
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                View all
              </button>
            </div>
            {alerts.length === 0 && <div className="px-3 py-3 text-sm text-slate-400 dark:text-slate-500">No active alerts.</div>}
            {alerts.slice(0, 5).map((n) => {
              const Icon = SEVERITY_ICON[n.severity]
              return (
                <button key={n.id} onClick={() => markAlertRead(n.id)} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-start gap-2.5">
                  <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[n.severity]}`} />
                  <div className="min-w-0">
                    <div className="text-sm text-slate-700 dark:text-slate-200 leading-snug flex items-center gap-1.5">
                      <Icon size={12} className="shrink-0" /> {n.type}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{n.message}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">{initialsFor(user?.name)}</div>
          <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 animate-fade-up z-30">
            <div className="px-3 py-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">{user?.email}</div>
              <RoleBadge role={role} />
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
            <button onClick={() => navigate('/app/settings')} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-slate-300">
              Settings
            </button>
            <button
              onClick={() => {
                logout()
                navigate('/role-select')
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-sm text-slate-600 dark:text-slate-300"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
