import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Compass, LayoutGrid, UserCircle, Gauge, Package, ClipboardList, LogOut, Sun, Moon } from 'lucide-react'
import { useProviderAuth } from './ProviderAuthContext'
import { useTheme } from '../context/ThemeContext'
import Badge from '../components/ui/Badge'
import Brand from '../components/ui/Brand'
import { VERIFICATION_STATUS } from '../types/provider'

const navItems = [
  { path: '/provider/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { path: '/provider/profile', label: 'Profile', icon: UserCircle },
  { path: '/provider/capacity', label: 'Capacity', icon: Gauge },
  { path: '/provider/resources', label: 'Resources', icon: Package },
  { path: '/provider/submissions', label: 'Submission Status', icon: ClipboardList },
]

const VERIFICATION_TONE = {
  [VERIFICATION_STATUS.VERIFIED]: 'good',
  [VERIFICATION_STATUS.PENDING]: 'warning',
  [VERIFICATION_STATUS.NEEDS_CORRECTION]: 'warning',
  [VERIFICATION_STATUS.REJECTED]: 'danger',
}

export default function ProviderLayout() {
  const { provider, logout } = useProviderAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/provider/login')
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fc] dark:bg-slate-950">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-300 border-r border-slate-200 dark:border-transparent">
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-100 dark:border-white/10 shrink-0">
          <Brand
            iconGradient="from-emerald-500 to-teal-400"
            extra={<span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Provider Portal</span>}
          />
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-white/10 space-y-2.5">
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <span className="text-slate-900 dark:text-white font-semibold block mb-1 truncate" title={provider?.providerName}>
              {provider?.providerName}
            </span>
            {provider && <Badge tone={VERIFICATION_TONE[provider.verificationStatus]}>{provider.verificationStatus}</Badge>}
          </div>
          <button onClick={toggleTheme} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Toggle theme
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <LogOut size={16} strokeWidth={2} /> Sign out
          </button>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-2 text-[11px] font-medium text-amber-800 dark:text-amber-400 leading-snug">
            Prototype data. Provider-submitted information must be verified before operational use.
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 shrink-0 glass border-b border-slate-200 dark:border-slate-800 flex lg:hidden items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
              <Compass size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-base">Provider Portal</span>
          </div>
          <button onClick={handleLogout} className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <LogOut size={16} /> Sign out
          </button>
        </header>
        <nav className="lg:hidden sticky top-16 z-10 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/10 flex overflow-x-auto px-2 py-2 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400'}`
              }
            >
              <item.icon size={14} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
