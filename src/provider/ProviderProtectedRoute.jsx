import { Navigate, useLocation } from 'react-router-dom'
import { useProviderAuth } from './ProviderAuthContext'

export function RequireProviderSession({ children }) {
  const { isAuthenticated } = useProviderAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/provider/login" state={{ from: location }} replace />
  return children
}
