import { ROLE_LABELS } from '../../auth/roleConfig'

export default function RoleBadge({ role, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 ${className}`}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}
