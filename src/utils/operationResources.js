// Builds the four Authority Operations resource sections (Emergency
// Coordinators / Volunteers / Transport / Infrastructure) into one common
// record shape so ResourceBox / ResourceDetailsDrawer / resourcePdf.js can
// stay generic across very different underlying data shapes.
//
// Every value here is read from real app state (data/coordinators.js,
// data/volunteers.js, AppStateContext operations, or the Provider portal's
// providerStore/providerSeed) — nothing is invented. Fields the current
// dataset does not track render literally as "Not available" / "Not
// recorded" per the no-fabrication rule, never a fake value.
import { openOperationsForCoordinator, openOperationsForVolunteer } from './assignmentCalculations'
import { computeProviderSnapshot } from '../provider/capacityService'
import { detailCategoryForAccountType, DETAIL_CATEGORY } from '../types/provider'

const NOT_AVAILABLE = 'Not available'
const NOT_RECORDED = 'Not recorded'

const yn = (v) => (v === true ? 'Yes' : v === false ? 'No' : NOT_AVAILABLE)
const dt = (v) => (v ? new Date(v).toLocaleString() : NOT_AVAILABLE)

function assignedOperationsSummary(ops, habitations) {
  if (!ops.length) return 'None currently assigned'
  return ops
    .map((op) => {
      const hab = habitations.find((h) => h.id === op.habitationId)
      return `${op.id} — ${hab?.name || op.habitationId} (${op.status})`
    })
    .join('; ')
}

// ---- Emergency Coordinators ----
export const COORDINATOR_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'region', label: 'District / Region' },
  { key: 'status', label: 'Availability' },
  { key: 'load', label: 'Open / Max' },
  { key: 'assignedOps', label: 'Assigned Operations' },
]

export function buildCoordinatorRecords(coordinators, operations, habitations) {
  return coordinators.map((c) => {
    const openOps = openOperationsForCoordinator(operations, c.id)
    const assignedOps = assignedOperationsSummary(openOps, habitations)
    return {
      id: c.id,
      category: 'Emergency Coordinator',
      name: c.name,
      statusLabel: c.status,
      statusTone: c.status === 'Available' ? 'good' : 'default',
      cells: {
        name: c.name,
        region: c.region || NOT_AVAILABLE,
        status: c.status || NOT_AVAILABLE,
        load: `${openOps.length}/${c.maxConcurrentCases ?? NOT_AVAILABLE}`,
        assignedOps,
      },
      fields: [
        { label: 'Full Name', value: c.name },
        { label: 'District / Region', value: c.region || NOT_AVAILABLE },
        { label: 'Availability Status', value: c.status || NOT_AVAILABLE },
        { label: 'Open Assignments', value: String(openOps.length) },
        { label: 'Maximum Assignment Capacity', value: c.maxConcurrentCases != null ? String(c.maxConcurrentCases) : NOT_AVAILABLE },
        { label: 'Skills / Specialization', value: NOT_RECORDED },
        { label: 'Contact Information', value: NOT_AVAILABLE },
        { label: 'Current Location', value: 'Not available — live location tracking is not supported by this dataset' },
        { label: 'Current Assigned Operations', value: assignedOps },
        { label: 'Registration Time', value: NOT_RECORDED },
        { label: 'Last Updated', value: NOT_AVAILABLE },
      ],
    }
  })
}

// ---- Volunteers ----
export const VOLUNTEER_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'skill', label: 'Skill' },
  { key: 'region', label: 'District / Region' },
  { key: 'status', label: 'Availability' },
  { key: 'openOps', label: 'Open Assignments' },
  { key: 'assignedOps', label: 'Assigned Operations' },
]

export function buildVolunteerRecords(volunteers, operations, habitations) {
  return volunteers.map((v) => {
    const openOps = openOperationsForVolunteer(operations, v.id)
    const assignedOps = assignedOperationsSummary(openOps, habitations)
    return {
      id: v.id,
      category: 'Volunteer',
      name: v.name,
      statusLabel: v.status,
      statusTone: v.status === 'Available' ? 'good' : 'default',
      cells: {
        name: v.name,
        skill: v.skill || NOT_AVAILABLE,
        region: v.region || NOT_AVAILABLE,
        status: v.status || NOT_AVAILABLE,
        openOps: String(openOps.length),
        assignedOps,
      },
      fields: [
        { label: 'Full Name', value: v.name },
        { label: 'Skill / Category', value: v.skill || NOT_AVAILABLE },
        { label: 'District / Region', value: v.region || NOT_AVAILABLE },
        { label: 'Availability Status', value: v.status || NOT_AVAILABLE },
        { label: 'Open Assignments', value: String(openOps.length) },
        { label: 'Maximum Assignment Capacity', value: NOT_AVAILABLE },
        { label: 'Current Location', value: 'Not available — live location tracking is not supported by this dataset' },
        { label: 'Contact Information', value: NOT_AVAILABLE },
        { label: 'Current Assigned Operations', value: assignedOps },
        { label: 'Registration / Profile Details', value: NOT_RECORDED },
        { label: 'Last Updated', value: NOT_AVAILABLE },
      ],
    }
  })
}

// ---- Transport ----
// No vehicle/transport registry exists anywhere in this codebase — no
// vehicle id, registration number, driver, or per-vehicle capacity is
// stored by any portal (the only related field is a single aggregate
// `vehiclesAvailable` count nested in one NGO provider's details, which is
// not a per-vehicle record and cannot honestly be exploded into rows).
export const TRANSPORT_COLUMNS = []
export const TRANSPORT_UNAVAILABLE_MESSAGE = 'Transport data is not available from the current backend.'

export function buildTransportRecords() {
  return []
}

// ---- Infrastructure ----
export const INFRASTRUCTURE_COLUMNS = [
  { key: 'name', label: 'Site Name' },
  { key: 'type', label: 'Type' },
  { key: 'district', label: 'District' },
  { key: 'availability', label: 'Availability' },
  { key: 'verification', label: 'Verification' },
  { key: 'capacity', label: 'Available / Total' },
]

function typeSpecificFields(category, detail) {
  if (!detail) return []
  if (category === DETAIL_CATEGORY.HOSPITAL && detail.hospital) {
    const h = detail.hospital
    return [
      { label: 'Total Beds', value: h.totalBeds != null ? String(h.totalBeds) : NOT_AVAILABLE },
      { label: 'Available Beds', value: h.availableBeds != null ? String(h.availableBeds) : NOT_AVAILABLE },
      { label: 'ICU Beds', value: h.icuBeds != null ? String(h.icuBeds) : NOT_AVAILABLE },
      { label: 'Emergency Beds', value: h.emergencyBeds != null ? String(h.emergencyBeds) : NOT_AVAILABLE },
      { label: 'Isolation Beds', value: h.isolationBeds != null ? String(h.isolationBeds) : NOT_AVAILABLE },
      { label: 'Ambulance Available', value: yn(h.ambulanceAvailable) },
      { label: 'Medical Staff Available', value: yn(h.medicalStaffAvailable) },
    ]
  }
  if (category === DETAIL_CATEGORY.SCHOOL && detail.school) {
    const s = detail.school
    return [
      { label: 'Classroom Count', value: s.classroomCount != null ? String(s.classroomCount) : NOT_AVAILABLE },
      { label: 'Hall Capacity', value: s.hallCapacity != null ? String(s.hallCapacity) : NOT_AVAILABLE },
      { label: 'Drinking Water Available', value: yn(s.drinkingWaterAvailable) },
      { label: 'Toilets Available', value: yn(s.toiletsAvailable) },
      { label: 'Kitchen Available', value: yn(s.kitchenAvailable) },
      { label: 'Sleeping Arrangement Available', value: yn(s.sleepingArrangementAvailable) },
      { label: 'Electricity Available', value: yn(s.electricityAvailable) },
    ]
  }
  if (category === DETAIL_CATEGORY.COMMUNITY_HALL && detail.communityHall) {
    const ch = detail.communityHall
    return [
      { label: 'Hall Capacity', value: ch.hallCapacity != null ? String(ch.hallCapacity) : NOT_AVAILABLE },
      { label: 'Hall Count', value: ch.hallCount != null ? String(ch.hallCount) : NOT_AVAILABLE },
      { label: 'Washrooms Available', value: yn(ch.washroomsAvailable) },
      { label: 'Drinking Water Available', value: yn(ch.drinkingWaterAvailable) },
      { label: 'Power Backup Available', value: yn(ch.powerBackupAvailable) },
      { label: 'Kitchen Available', value: yn(ch.kitchenAvailable) },
    ]
  }
  if (category === DETAIL_CATEGORY.NGO && detail.ngo) {
    const n = detail.ngo
    return [
      { label: 'Volunteers Available', value: n.volunteersAvailable != null ? String(n.volunteersAvailable) : NOT_AVAILABLE },
      { label: 'Food Packets', value: n.foodPackets != null ? String(n.foodPackets) : NOT_AVAILABLE },
      { label: 'Water Packets', value: n.waterPackets != null ? String(n.waterPackets) : NOT_AVAILABLE },
      { label: 'Medical Kits', value: n.medicalKits != null ? String(n.medicalKits) : NOT_AVAILABLE },
      { label: 'Vehicles Available (NGO-reported count)', value: n.vehiclesAvailable != null ? String(n.vehiclesAvailable) : NOT_AVAILABLE },
      { label: 'Temporary Shelter Capacity', value: n.temporaryShelterCapacity != null ? String(n.temporaryShelterCapacity) : NOT_AVAILABLE },
    ]
  }
  return []
}

export function buildInfrastructureRecords(providers, capacitiesById, detailsById) {
  return providers.map((p) => {
    const capacity = capacitiesById[p.id] || null
    const snapshot = computeProviderSnapshot(p, capacity)
    const detailCategory = detailCategoryForAccountType(p.accountType)
    const detail = detailsById[p.id] || null

    return {
      id: p.id,
      category: 'Infrastructure',
      name: p.providerName,
      statusLabel: snapshot.status,
      statusTone: snapshot.status === 'Available' ? 'good' : snapshot.status === 'Limited Capacity' ? 'warning' : snapshot.status === 'Full' ? 'danger' : 'default',
      cells: {
        name: p.providerName,
        type: p.accountType || NOT_AVAILABLE,
        district: p.district || NOT_AVAILABLE,
        availability: snapshot.status,
        verification: p.verificationStatus || NOT_AVAILABLE,
        capacity: capacity ? `${capacity.availableCapacity.toLocaleString()} / ${capacity.totalCapacity.toLocaleString()}` : 'Not submitted',
      },
      fields: [
        { label: 'Site / Infrastructure Name', value: p.providerName },
        { label: 'Infrastructure Type', value: p.accountType || NOT_AVAILABLE },
        { label: 'Owner / Provider', value: p.contactPerson || NOT_AVAILABLE },
        { label: 'District', value: p.district || NOT_AVAILABLE },
        { label: 'City', value: p.city || NOT_AVAILABLE },
        { label: 'Address', value: p.address || NOT_AVAILABLE },
        { label: 'Contact Person', value: p.contactPerson || NOT_AVAILABLE },
        { label: 'Contact Phone', value: p.phone || capacity?.contactPhone || NOT_AVAILABLE },
        { label: 'Contact Email', value: p.email || NOT_AVAILABLE },
        { label: 'Total Capacity', value: capacity ? capacity.totalCapacity.toLocaleString() : 'Not submitted' },
        { label: 'Occupied Capacity', value: capacity ? capacity.occupiedCapacity.toLocaleString() : 'Not submitted' },
        { label: 'Remaining / Available Capacity', value: capacity ? capacity.availableCapacity.toLocaleString() : 'Not submitted' },
        { label: 'Reserved Capacity', value: capacity ? (capacity.reservedCapacity || 0).toLocaleString() : 'Not submitted' },
        { label: 'Availability Status', value: snapshot.status },
        { label: 'Operating Status', value: capacity?.operatingStatus || NOT_AVAILABLE },
        { label: 'Verification Status', value: p.verificationStatus || NOT_AVAILABLE },
        { label: 'Verification Note', value: p.verificationNote || NOT_RECORDED },
        { label: 'Accessibility', value: yn(capacity?.accessibilityAvailable) },
        { label: 'Medical Support Available', value: yn(capacity?.medicalSupportAvailable) },
        { label: 'Water Available', value: yn(capacity?.waterAvailable) },
        { label: 'Toilets Available', value: yn(capacity?.toiletsAvailable) },
        { label: 'Electricity Available', value: yn(capacity?.electricityAvailable) },
        { label: 'Food Available', value: yn(capacity?.foodAvailable) },
        { label: 'Women & Child Support', value: yn(capacity?.womenChildSupportAvailable) },
        { label: 'Rooms / Halls', value: capacity?.roomCount != null ? String(capacity.roomCount) : NOT_AVAILABLE },
        { label: 'Usable Beds', value: capacity?.usableBeds != null ? String(capacity.usableBeds) : NOT_AVAILABLE },
        { label: 'Available From', value: capacity?.availableFrom || NOT_AVAILABLE },
        { label: 'Available Until', value: capacity?.availableUntil || 'Ongoing' },
        ...typeSpecificFields(detailCategory, detail),
        { label: 'Notes', value: capacity?.notes || NOT_RECORDED },
        { label: 'Data Source', value: p.isDemo ? 'Demo provider data (prototype)' : snapshot.dataStatusLabel },
        { label: 'Registered On', value: dt(p.createdAt) },
        { label: 'Last Updated', value: capacity ? dt(capacity.lastUpdated) : dt(p.updatedAt) },
      ],
    }
  })
}
