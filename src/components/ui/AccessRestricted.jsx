import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import { useAuth } from '../../auth/AuthContext'
import { ROLE_LABELS } from '../../auth/roleConfig'

export default function AccessRestricted({ pageLabel }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const roleLabel = ROLE_LABELS[user?.role] || 'current'

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto flex flex-col items-center text-center py-20 lg:py-28">
      <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-5">
        <ShieldOff size={26} className="text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Access restricted</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-1">
        {pageLabel ? `${pageLabel} is not available for the ${roleLabel} role.` : `This page is not available for the ${roleLabel} role.`}
      </p>
      <p className="text-slate-400 dark:text-slate-500 text-xs mb-8">Please return to your dashboard or switch to an authorized role.</p>
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate('/app')}>Return to dashboard</Button>
        <Button variant="secondary" onClick={() => navigate('/role-select')}>
          Switch role
        </Button>
      </div>
    </div>
  )
}
