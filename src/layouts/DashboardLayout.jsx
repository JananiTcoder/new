import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import MobileNav from '../components/layout/MobileNav'
import EOCBanner from '../components/layout/EOCBanner'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'

export default function DashboardLayout() {
  const { role } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleMenuClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileNavOpen(true)
    } else {
      setCollapsed((v) => !v)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fc] dark:bg-slate-950">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={handleMenuClick} />
        {role === ROLES.EMERGENCY_COORDINATOR && <EOCBanner />}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0 flex flex-col">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
