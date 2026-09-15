// Shared localStorage read/write helpers. Frontend-only persistence — every
// consumer (provider store, app-wide case/assignment state) goes through
// these two functions so failure handling (private browsing, quota errors)
// lives in exactly one place.
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable — data still works in-memory for this tab.
  }
}
