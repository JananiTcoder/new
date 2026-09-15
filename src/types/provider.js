// Shared constants for the Resource & Infrastructure Provider portal.
// Mirrors the enum-style convention used in types/geosentra.js (plain JS +
// JSDoc, no TypeScript build step in this project).

export const ACCOUNT_TYPES = {
  GOVERNMENT_HOSPITAL: 'Government Hospital',
  GOVERNMENT_SCHOOL: 'Government School',
  COLLEGE_UNIVERSITY: 'College/University',
  COMMUNITY_HALL: 'Community Hall',
  SHELTER_PROVIDER: 'Shelter Provider',
  NGO_RELIEF: 'NGO/Relief Organization',
  PRIVATE_INFRASTRUCTURE: 'Private Infrastructure Provider',
  INDIVIDUAL_CONTRIBUTOR: 'Individual Contributor',
  OTHER: 'Other',
}
export const ACCOUNT_TYPE_LIST = Object.values(ACCOUNT_TYPES)

export const VERIFICATION_STATUS = {
  PENDING: 'Pending Verification',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  NEEDS_CORRECTION: 'Needs Correction',
}
export const VERIFICATION_STATUS_LIST = Object.values(VERIFICATION_STATUS)

export const OPERATING_STATUS = {
  ACTIVE: 'Active',
  LIMITED: 'Limited Operation',
  CLOSED: 'Closed / Inactive',
}
export const OPERATING_STATUS_LIST = Object.values(OPERATING_STATUS)

// Which type-specific detail form (and Capacity/*Details record) an account
// type maps to. Individual contributors only fill the base capacity form.
export const DETAIL_CATEGORY = {
  HOSPITAL: 'hospital',
  SCHOOL: 'school',
  COMMUNITY_HALL: 'communityHall',
  NGO: 'ngo',
  NONE: 'none',
}

export function detailCategoryForAccountType(accountType) {
  switch (accountType) {
    case ACCOUNT_TYPES.GOVERNMENT_HOSPITAL:
      return DETAIL_CATEGORY.HOSPITAL
    case ACCOUNT_TYPES.GOVERNMENT_SCHOOL:
    case ACCOUNT_TYPES.COLLEGE_UNIVERSITY:
      return DETAIL_CATEGORY.SCHOOL
    case ACCOUNT_TYPES.NGO_RELIEF:
      return DETAIL_CATEGORY.NGO
    case ACCOUNT_TYPES.COMMUNITY_HALL:
    case ACCOUNT_TYPES.SHELTER_PROVIDER:
    case ACCOUNT_TYPES.PRIVATE_INFRASTRUCTURE:
    case ACCOUNT_TYPES.OTHER:
      return DETAIL_CATEGORY.COMMUNITY_HALL
    case ACCOUNT_TYPES.INDIVIDUAL_CONTRIBUTOR:
    default:
      return DETAIL_CATEGORY.NONE
  }
}

// Data-confidence / transparency labels shown throughout the app wherever a
// capacity number is displayed — see PROJECT policy: never present a number
// without saying where it came from.
export const DATA_STATUS = {
  VERIFIED: 'Verified provider data',
  SELF_REPORTED: 'Self-reported provider data',
  DEMO: 'Demo data',
  AWAITING_VERIFICATION: 'Awaiting verified provider data',
  STALE: 'Capacity information may be outdated.',
  MISSING: 'Capacity not yet submitted',
}

export const AVAILABILITY_STATUS = {
  AVAILABLE: 'Available',
  LIMITED: 'Limited Capacity',
  FULL: 'Full',
  UNAVAILABLE: 'Unavailable',
  NO_DATA: 'Capacity Not Submitted',
}

// Marker/status colors, matched to the SAFE SITE AND MAP INTEGRATION spec
// (Green/Amber/Red/Grey).
export const STATUS_COLOR = {
  [AVAILABILITY_STATUS.AVAILABLE]: '#059669',
  [AVAILABILITY_STATUS.LIMITED]: '#d97706',
  [AVAILABILITY_STATUS.FULL]: '#dc2626',
  [AVAILABILITY_STATUS.UNAVAILABLE]: '#64748b',
  [AVAILABILITY_STATUS.NO_DATA]: '#94a3b8',
}

// Number of days after which self-reported capacity is flagged as possibly
// outdated (configurable in one place, per the STALE-DATA RULE).
export const STALE_AFTER_DAYS = 14

export const PROVIDERS_STORAGE_KEY = 'geosentra_providers'
export const CAPACITIES_STORAGE_KEY = 'geosentra_capacities'
export const CURRENT_PROVIDER_STORAGE_KEY = 'geosentra_current_provider'

/**
 * @typedef {Object} Provider
 * @property {string} id
 * @property {string} providerName
 * @property {string} username  derived from providerName at signup, used to log in
 * @property {string} passwordDemo  base64-encoded — MOCK ONLY, never a real credential store
 * @property {string} accountType one of ACCOUNT_TYPES
 * @property {string} contactPerson
 * @property {string} email
 * @property {string} phone
 * @property {string} address
 * @property {string} district
 * @property {string} city
 * @property {string} state
 * @property {string} pincode
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} infrastructureType
 * @property {string} verificationStatus one of VERIFICATION_STATUS
 * @property {string} verificationNote
 * @property {boolean} isDemo
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Capacity
 * @property {string} providerId
 * @property {number} totalCapacity
 * @property {number} availableCapacity
 * @property {number} occupiedCapacity
 * @property {number} reservedCapacity
 * @property {number} roomCount
 * @property {number} usableBeds
 * @property {boolean} waterAvailable
 * @property {boolean} toiletsAvailable
 * @property {boolean} electricityAvailable
 * @property {boolean} foodAvailable
 * @property {boolean} medicalSupportAvailable
 * @property {boolean} accessibilityAvailable
 * @property {boolean} womenChildSupportAvailable
 * @property {string} operatingStatus one of OPERATING_STATUS
 * @property {string} availableFrom
 * @property {string} availableUntil
 * @property {string} contactPerson
 * @property {string} contactPhone
 * @property {string} notes
 * @property {string} lastUpdated ISO timestamp
 *
 * @typedef {Object} HospitalDetails
 * @property {string} providerId
 * @property {number} totalBeds
 * @property {number} availableBeds
 * @property {number} icuBeds
 * @property {number} emergencyBeds
 * @property {number} isolationBeds
 * @property {boolean} ambulanceAvailable
 * @property {boolean} medicalStaffAvailable
 *
 * @typedef {Object} SchoolDetails
 * @property {string} providerId
 * @property {number} classroomCount
 * @property {number} hallCapacity
 * @property {boolean} drinkingWaterAvailable
 * @property {boolean} toiletsAvailable
 * @property {boolean} kitchenAvailable
 * @property {boolean} sleepingArrangementAvailable
 * @property {boolean} electricityAvailable
 *
 * @typedef {Object} CommunityHallDetails
 * @property {string} providerId
 * @property {number} hallCapacity
 * @property {number} hallCount
 * @property {boolean} washroomsAvailable
 * @property {boolean} drinkingWaterAvailable
 * @property {boolean} powerBackupAvailable
 * @property {boolean} kitchenAvailable
 *
 * @typedef {Object} NGOResourceDetails
 * @property {string} providerId
 * @property {number} volunteersAvailable
 * @property {number} foodPackets
 * @property {number} waterPackets
 * @property {number} medicalKits
 * @property {number} vehiclesAvailable
 * @property {number} temporaryShelterCapacity
 */
export {}
