import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { MOCK_USERS, ROLE_LIST, SESSION_STORAGE_KEY } from './roleConfig'

// Frontend-only mock session. Nothing here calls a backend — the "session" is
// just a JSON blob in localStorage so a refresh doesn't lose the selected
// role. There is no password and no token; this is a UI-demonstration of
// role-based access, not real authentication.
const AuthContext = createContext(null)

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Falls back safely to the login page if the role is missing/unknown.
    if (!parsed || !ROLE_LIST.includes(parsed.role)) return null
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  const login = useCallback((role) => {
    const mock = MOCK_USERS[role]
    if (!mock) return
    const session = { ...mock, loginTimestamp: new Date().toISOString() }
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch {
      // localStorage unavailable (private mode, etc.) — session still works in-memory for this tab.
    }
    setUser(session)
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // ignore
    }
    setUser(null)
  }, [])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SESSION_STORAGE_KEY) setUser(readSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return <AuthContext.Provider value={{ user, role: user?.role || null, isAuthenticated: !!user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
