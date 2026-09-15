import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useProviderData } from './providerStore'
import { CURRENT_PROVIDER_STORAGE_KEY } from '../types/provider'

// Separate, frontend-only mock auth flow for the provider portal — deliberately
// independent from src/auth/AuthContext.jsx (the 4-role session), since a
// provider account and a portal-role session are different identities that
// can be signed in at the same time in the same browser.
const ProviderAuthContext = createContext(null)

function readSessionProviderId() {
  try {
    return localStorage.getItem(CURRENT_PROVIDER_STORAGE_KEY) || null
  } catch {
    return null
  }
}

export function ProviderAuthProvider({ children }) {
  const { verifyCredentials, getProvider, registerProvider, isUsernameTaken } = useProviderData()
  const [providerId, setProviderId] = useState(readSessionProviderId)

  useEffect(() => {
    if (providerId && !getProvider(providerId)) setProviderId(null)
  }, [providerId, getProvider])

  const login = useCallback(
    (username, password) => {
      const match = verifyCredentials(username, password)
      if (!match) return { ok: false, error: 'No provider account matches that name and password.' }
      try {
        localStorage.setItem(CURRENT_PROVIDER_STORAGE_KEY, match.id)
      } catch {
        // in-memory only for this tab
      }
      setProviderId(match.id)
      return { ok: true, provider: match }
    },
    [verifyCredentials]
  )

  const signup = useCallback(
    (form) => {
      const provider = registerProvider(form)
      try {
        localStorage.setItem(CURRENT_PROVIDER_STORAGE_KEY, provider.id)
      } catch {
        // in-memory only for this tab
      }
      setProviderId(provider.id)
      return { ok: true, provider }
    },
    [registerProvider]
  )

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(CURRENT_PROVIDER_STORAGE_KEY)
    } catch {
      // ignore
    }
    setProviderId(null)
  }, [])

  const provider = providerId ? getProvider(providerId) : null

  return (
    <ProviderAuthContext.Provider value={{ provider, providerId, isAuthenticated: !!provider, login, signup, logout, isUsernameTaken }}>
      {children}
    </ProviderAuthContext.Provider>
  )
}

export function useProviderAuth() {
  const ctx = useContext(ProviderAuthContext)
  if (!ctx) throw new Error('useProviderAuth must be used within ProviderAuthProvider')
  return ctx
}
