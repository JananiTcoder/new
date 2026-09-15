import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { canAccessPage, PAGE_LABELS } from './roleConfig'
import AccessRestricted from '../components/ui/AccessRestricted'

// No session at all (never logged in, logged out, or an invalid/unknown role
// was found in storage) -> bounce to the public role-select/login page.
export function RequireSession({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/disaster-authority/login" state={{ from: location }} replace />
  return children
}

// Authenticated but this role isn't allowed on this page -> render an
// explanatory Access Restricted screen in place of the page, instead of a
// silent redirect.
export function RoleRoute({ pageId, children }) {
  const { role } = useAuth()
  if (!canAccessPage(role, pageId)) return <AccessRestricted pageLabel={PAGE_LABELS[pageId]} />
  return children
}
