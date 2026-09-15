import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { LogOut } from 'lucide-react'
import { getMobileNavigationForRole, getNavigationForRole } from '../../data/nav'
import { useAuth } from '../../auth/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { ROLES } from '../../auth/roleConfig'
import { NAV_ID_TO_KEY } from '../../i18n/translations'
import { useAppState } from '../../state/AppStateContext'
import { isTaskActive } from '../../pages/volunteer/volunteerLabels'
import RoleBadge from '../ui/RoleBadge'

export default function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()
  const { user, role, logout } = useAuth()
  const { t } = useLanguage()
  const isCitizen = role === ROLES.CITIZEN
  const isVolunteer = role === ROLES.VOLUNTEERS
  const { volunteerTasks } = useAppState()
  const activeTaskCount = isVolunteer ? volunteerTasks.filter(isTaskActive).length : 0
  const bottomItems = getMobileNavigationForRole(role)
  const allItems = getNavigationForRole(role)
  const navLabel = (item) => (isCitizen && NAV_ID_TO_KEY[item.id] ? t(NAV_ID_TO_KEY[item.id]) : item.label)

  const handleLogout = () => {
    setMoreOpen(false)
    logout()
    navigate('/disaster-authority/login')
  }

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-stretch h-16 pb-[env(safe-area-inset-bottom)]">
        {bottomItems.map((item) => {
          const Icon = Icons[item.icon]
          if (item.id === 'more') {
            return (
              <button
                key={item.id}
                onClick={() => setMoreOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500"
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{navLabel(item)}</span>
              </button>
            )
          }
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <span className="relative">
                <Icon size={20} />
                {isVolunteer && item.id === 'tasks' && activeTaskCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{activeTaskCount}</span>
                )}
              </span>
              <span className="text-[10px] font-medium">{navLabel(item)}</span>
            </NavLink>
          )
        })}
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl p-4 pb-8 max-h-[75vh] overflow-y-auto animate-[slideUp_0.25s_ease-out]">
            <div className="h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-4" />
            <div className="flex items-center gap-2.5 px-1 mb-4">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</span>
              <RoleBadge role={role} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {allItems.map((item) => {
                const Icon = Icons[item.icon]
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path)
                      setMoreOpen(false)
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400"
                  >
                    <Icon size={20} />
                    <span className="text-[11px] font-medium text-center leading-tight">{navLabel(item)}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
      )}
    </>
  )
}
