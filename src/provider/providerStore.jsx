import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { demoProviders, demoCapacities, demoDetails } from '../data/providerSeed'
import { PROVIDERS_STORAGE_KEY, CAPACITIES_STORAGE_KEY, VERIFICATION_STATUS, detailCategoryForAccountType, DETAIL_CATEGORY } from '../types/provider'
import { readJSON, writeJSON } from '../utils/storage'

// Shared provider/capacity data layer — the single source of truth the
// fifth (Resource & Infrastructure Provider) portal writes to and the other
// four portals read from. Frontend-only: persisted to localStorage under
// geosentra_providers / geosentra_capacities, seeded once from the
// deterministic demo dataset in data/providerSeed.js.
//
// FUTURE BACKEND INTEGRATION: swap the localStorage read/write below for
// real API calls (e.g. FastAPI/Firebase/Supabase) — every consumer goes
// through the functions returned by useProviderData(), so no other file
// needs to change.
const ProviderDataContext = createContext(null)

function seedInitialProviders() {
  const stored = readJSON(PROVIDERS_STORAGE_KEY, null)
  if (stored && Array.isArray(stored) && stored.length > 0) return stored
  return demoProviders
}

function seedInitialCapacities() {
  const stored = readJSON(CAPACITIES_STORAGE_KEY, null)
  if (stored && typeof stored === 'object') {
    // details is stored inline on the same key as { capacities, details } since v1
    if (stored.capacities) return stored
  }
  return { capacities: demoCapacities, details: demoDetails }
}

let uidCounter = 0
function makeId(prefix) {
  uidCounter += 1
  return `${prefix}-${Date.now()}-${uidCounter}`
}

export function ProviderDataProvider({ children }) {
  const [providers, setProviders] = useState(seedInitialProviders)
  const [capacityState, setCapacityState] = useState(seedInitialCapacities)

  useEffect(() => writeJSON(PROVIDERS_STORAGE_KEY, providers), [providers])
  useEffect(() => writeJSON(CAPACITIES_STORAGE_KEY, capacityState), [capacityState])

  const isUsernameTaken = useCallback(
    (name, excludeId) => providers.some((p) => p.id !== excludeId && p.username.trim().toLowerCase() === String(name).trim().toLowerCase()),
    [providers]
  )

  const registerProvider = useCallback((form) => {
    const now = new Date().toISOString()
    const provider = {
      id: makeId('provider'),
      providerName: form.providerName.trim(),
      username: form.providerName.trim(),
      passwordDemo: btoa(form.password),
      accountType: form.accountType,
      contactPerson: form.contactPerson.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      infrastructureType: form.infrastructureType || form.accountType,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      verificationNote: 'Newly registered — awaiting Disaster Authority review.',
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    }
    setProviders((prev) => [...prev, provider])
    return provider
  }, [])

  const verifyCredentials = useCallback(
    (username, password) => {
      const match = providers.find((p) => p.username.trim().toLowerCase() === String(username).trim().toLowerCase())
      if (!match) return null
      if (match.passwordDemo !== btoa(password)) return null
      return match
    },
    [providers]
  )

  const updateProvider = useCallback((id, patch) => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)))
  }, [])

  const setVerificationStatus = useCallback(
    (id, status, note) => {
      updateProvider(id, { verificationStatus: status, verificationNote: note || '' })
    },
    [updateProvider]
  )

  const upsertCapacity = useCallback((providerId, patch) => {
    setCapacityState((prev) => ({
      ...prev,
      capacities: {
        ...prev.capacities,
        [providerId]: {
          ...(prev.capacities[providerId] || { providerId }),
          ...patch,
          providerId,
          lastUpdated: new Date().toISOString(),
        },
      },
    }))
  }, [])

  const upsertDetails = useCallback((providerId, category, patch) => {
    if (category === DETAIL_CATEGORY.NONE) return
    setCapacityState((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [providerId]: {
          ...(prev.details[providerId] || {}),
          [category]: { ...(prev.details[providerId]?.[category] || { providerId }), ...patch, providerId },
        },
      },
    }))
  }, [])

  const getProvider = useCallback((id) => providers.find((p) => p.id === id) || null, [providers])
  const getCapacity = useCallback((id) => capacityState.capacities[id] || null, [capacityState])
  const getDetails = useCallback((id) => capacityState.details[id] || null, [capacityState])
  const getDetailCategory = useCallback((id) => detailCategoryForAccountType(getProvider(id)?.accountType), [getProvider])

  const value = useMemo(
    () => ({
      providers,
      capacitiesById: capacityState.capacities,
      detailsById: capacityState.details,
      isUsernameTaken,
      registerProvider,
      verifyCredentials,
      updateProvider,
      setVerificationStatus,
      upsertCapacity,
      upsertDetails,
      getProvider,
      getCapacity,
      getDetails,
      getDetailCategory,
    }),
    [providers, capacityState, isUsernameTaken, registerProvider, verifyCredentials, updateProvider, setVerificationStatus, upsertCapacity, upsertDetails, getProvider, getCapacity, getDetails, getDetailCategory]
  )

  return <ProviderDataContext.Provider value={value}>{children}</ProviderDataContext.Provider>
}

export function useProviderData() {
  const ctx = useContext(ProviderDataContext)
  if (!ctx) throw new Error('useProviderData must be used within ProviderDataProvider')
  return ctx
}
