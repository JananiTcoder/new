import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { LogOut, X } from 'lucide-react'
import { getNavigationForRole } from '../../data/nav'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { ROLES } from '../../auth/roleConfig'
import { NAV_ID_TO_KEY } from '../../i18n/translations'
import { useAppState } from '../../state/AppStateContext'
import { isTaskActive } from '../../pages/volunteer/volunteerLabels'
import RoleBadge from '../ui/RoleBadge'
import Brand from '../ui/Brand'

function NavItems({ items, expanded, navLabel, isVolunteer, activeTaskCount, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {items.map((item) => {
        const Icon = Icons[item.icon]
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/app'}
            onClick={onNavigate}
            title={!expanded ? navLabel(item) : undefined}
            aria-label={!expanded ? navLabel(item) : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                expanded ? 'px-3.5 py-2.5' : 'justify-center px-2.5 py-2.5'
              } ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 dark:shadow-blue-900/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} className="shrink-0" />
            {expanded && <span className="flex-1 truncate">{navLabel(item)}</span>}
            {isVolunteer && item.id === 'tasks' && activeTaskCount > 0 && expanded && (
              <span className="h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{activeTaskCount}</span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function Sidebar({ collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile }) {
  const navigate = useNavigate()
  const { user, role, logout } = useAuth()
  const { t } = useLanguage()
  const isCitizen = role === ROLES.CITIZEN
  const isVolunteer = role === ROLES.VOLUNTEERS
  const { volunteerTasks } = useAppState()
  const activeTaskCount = isVolunteer ? volunteerTasks.filter(isTaskActive).length : 0
  const items = getNavigationForRole(role)
  const navLabel = (item) => (isCitizen && NAV_ID_TO_KEY[item.id] ? t(NAV_ID_TO_KEY[item.id]) : item.label)

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseMobile?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen, onCloseMobile])

  const handleLogout = (closeMobile) => {
    closeMobile?.()
    logout()
    navigate('/disaster-authority/login')
  }

  return (
    <>
      {/* Desktop: collapsible, always visible */}
      <aside
        className={`hidden lg:flex flex-col ${collapsed ? 'w-20' : 'w-64'} shrink-0 h-screen sticky top-0 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-300 border-r border-slate-200 dark:border-transparent transition-[width] duration-200 ease-out`}
      >
        <div className={`flex items-center gap-2 h-16 border-b border-slate-100 dark:border-white/10 shrink-0 ${collapsed ? 'justify-center px-2' : 'px-6'}`}>
          <Brand collapsed={collapsed} />
        </div>
        <NavItems items={items} expanded={!collapsed} navLabel={navLabel} isVolunteer={isVolunteer} activeTaskCount={activeTaskCount} />
        <div className={`p-3 border-t border-slate-100 dark:border-white/10 space-y-2 ${collapsed ? 'px-2' : ''}`}>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-pressed={collapsed}
            className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5'
            }`}
          >
            <Icons.PanelLeftClose size={16} className={`shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
          {!collapsed && (
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="text-slate-900 dark:text-white font-semibold block mb-1 truncate">{user?.name}</span>
              <RoleBadge role={role} />
            </div>
          )}
          <button
            onClick={() => handleLogout()}
            title={collapsed ? 'Sign out' : undefined}
            aria-label="Sign out"
            className={`w-full flex items-center gap-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5'
            }`}
          >
            <LogOut size={16} strokeWidth={2} className="shrink-0" /> {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Mobile: left-side drawer, opens over the page */}
      <div className={`lg:hidden fixed inset-0 z-[100] ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-slate-900/40 dark:bg-black/60 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onCloseMobile}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white dark:bg-slate-950 flex flex-col shadow-2xl transform transition-transform duration-200 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-slate-100 dark:border-white/10 shrink-0">
            <Brand size="sm" />
            <button
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <X size={18} />
            </button>
          </div>
          <NavItems items={items} expanded navLabel={navLabel} isVolunteer={isVolunteer} activeTaskCount={activeTaskCount} onNavigate={onCloseMobile} />
          <div className="p-3 border-t border-slate-100 dark:border-white/10 space-y-2">
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="text-slate-900 dark:text-white font-semibold block mb-1 truncate">{user?.name}</span>
              <RoleBadge role={role} />
            </div>
            <button
              onClick={() => handleLogout(onCloseMobile)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <LogOut size={16} strokeWidth={2} /> Sign out
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
