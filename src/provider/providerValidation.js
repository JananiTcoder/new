// Form validation for the Provider portal. Returns a plain { fieldName: message }
// error map — pages render whichever keys are present. Kept dependency-free
// (no form library) to match the rest of the project.
import { ACCOUNT_TYPE_LIST } from '../types/provider'

const REQUIRED = 'This field is required.'
const isBlank = (v) => v === undefined || v === null || String(v).trim() === ''

export function validateSignup(form, { isUsernameTaken } = {}) {
  const errors = {}
  if (isBlank(form.accountType) || !ACCOUNT_TYPE_LIST.includes(form.accountType)) errors.accountType = 'Select an account type.'
  if (isBlank(form.providerName)) errors.providerName = REQUIRED
  if (isBlank(form.contactPerson)) errors.contactPerson = REQUIRED
  if (isBlank(form.email)) errors.email = REQUIRED
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.'
  if (isBlank(form.phone)) errors.phone = REQUIRED
  else if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone)) errors.phone = 'Enter a valid phone number.'
  if (isBlank(form.password)) errors.password = REQUIRED
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.'
  if (isBlank(form.address)) errors.address = REQUIRED
  if (isBlank(form.district)) errors.district = REQUIRED
  if (isBlank(form.city)) errors.city = REQUIRED
  if (isBlank(form.state)) errors.state = REQUIRED
  if (isBlank(form.pincode)) errors.pincode = REQUIRED
  else if (!/^[0-9]{4,10}$/.test(form.pincode)) errors.pincode = 'Enter a valid pincode.'
  if (isBlank(form.latitude) || Number.isNaN(Number(form.latitude))) errors.latitude = 'Latitude is required so this location can appear on the map.'
  else if (Number(form.latitude) < -90 || Number(form.latitude) > 90) errors.latitude = 'Latitude must be between -90 and 90.'
  if (isBlank(form.longitude) || Number.isNaN(Number(form.longitude))) errors.longitude = 'Longitude is required so this location can appear on the map.'
  else if (Number(form.longitude) < -180 || Number(form.longitude) > 180) errors.longitude = 'Longitude must be between -180 and 180.'
  if (!form.consent) errors.consent = 'You must accept the terms to continue.'
  if (isUsernameTaken && isUsernameTaken(form.providerName)) errors.providerName = 'A provider is already registered under this name. Use a more specific name (e.g. add area/branch).'
  return errors
}

export function validateLogin(form) {
  const errors = {}
  if (isBlank(form.username)) errors.username = 'Enter your registered infrastructure/organization name.'
  if (isBlank(form.password)) errors.password = REQUIRED
  return errors
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

export function validateCapacity(form) {
  const errors = {}
  const fields = ['totalCapacity', 'availableCapacity', 'occupiedCapacity', 'reservedCapacity']
  fields.forEach((f) => {
    if (isBlank(form[f])) {
      errors[f] = REQUIRED
      return
    }
    const n = num(form[f])
    if (Number.isNaN(n) || n < 0) errors[f] = 'Enter a valid non-negative number.'
  })
  if (Object.keys(errors).length) return errors

  const total = num(form.totalCapacity)
  const available = num(form.availableCapacity)
  const occupied = num(form.occupiedCapacity)
  const reserved = num(form.reservedCapacity)

  if (available > total) errors.availableCapacity = 'Available capacity cannot exceed total capacity.'
  if (occupied > total) errors.occupiedCapacity = 'Occupied capacity cannot exceed total capacity.'
  if (reserved > total) errors.reservedCapacity = 'Reserved capacity cannot exceed total capacity.'
  if (!errors.availableCapacity && !errors.occupiedCapacity && !errors.reservedCapacity && available + occupied + reserved > total) {
    errors.availableCapacity = 'Available + occupied + reserved capacity should not exceed total capacity.'
  }

  if (isBlank(form.infrastructureCategory)) errors.infrastructureCategory = 'Select an infrastructure category.'
  if (isBlank(form.contactPerson)) errors.contactPerson = REQUIRED
  if (isBlank(form.contactPhone)) errors.contactPhone = REQUIRED

  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}
