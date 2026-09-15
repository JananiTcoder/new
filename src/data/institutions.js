// Frontend-only institution registry covering the five institution types named
// in the spec. Each institution names a preferred safe site and evacuation
// profile so Route Intelligence can be opened pre-scoped to that institution.
//
// FUTURE BACKEND INTEGRATION:
// Replace this array with a real facility registry endpoint; keep field names
// unchanged so Institution.jsx / Institutions.jsx keep working.
import { INSTITUTION_TYPES, RELOCATION_TIMEFRAME } from '../types/geosentra'

export const institutions = [
  {
    id: 'govt-hss',
    name: 'Govt. Higher Secondary School',
    type: INSTITUTION_TYPES.SCHOOL,
    district: 'Coastal District',
    position: { lat: 12.842, lng: 80.24 },
    groupSize: 1280,
    staff: 84,
    preferredProfileId: 'school-child',
    accessibilityRequirement: false,
    evacuationPriority: RELOCATION_TIMEFRAME.SHORT_TERM,
    selectedSiteId: 'community-dev-zone',
    currentHazard: 'flood',
    evacuationReadiness: 82,
    groups: [
      { id: 'primary', label: 'Primary Students', count: 420, profileId: 'school-child' },
      { id: 'secondary', label: 'Secondary Students', count: 520, profileId: 'school-child' },
      { id: 'senior', label: 'Senior Students', count: 340, profileId: 'young-adult' },
    ],
    checklist: [
      { label: 'Evacuation routes confirmed', done: true },
      { label: 'Staff assigned to each group', done: true },
      { label: 'Transport arranged for mobility-needs students', done: true },
      { label: 'Relief center capacity confirmed', done: false },
      { label: 'Parent notification sent', done: false },
    ],
  },
  {
    id: 'coastal-degree-college',
    name: 'Coastal Degree College',
    type: INSTITUTION_TYPES.COLLEGE,
    district: 'Coastal District',
    position: { lat: 12.965, lng: 80.25 },
    groupSize: 2100,
    staff: 140,
    preferredProfileId: 'young-adult',
    accessibilityRequirement: false,
    evacuationPriority: RELOCATION_TIMEFRAME.SHORT_TERM,
    selectedSiteId: 'northern-township',
    currentHazard: 'coastal-erosion',
    evacuationReadiness: 61,
    groups: [
      { id: 'day-scholars', label: 'Day Scholars', count: 1550, profileId: 'young-adult' },
      { id: 'hostel', label: 'Hostel Residents', count: 550, profileId: 'young-adult' },
    ],
    checklist: [
      { label: 'Evacuation routes confirmed', done: true },
      { label: 'Hostel warden briefed', done: true },
      { label: 'Transport arranged for hostel residents', done: false },
      { label: 'Relief center capacity confirmed', done: false },
    ],
  },
  {
    id: 'district-general-hospital',
    name: 'District General Hospital',
    type: INSTITUTION_TYPES.HOSPITAL,
    district: 'Central District',
    position: { lat: 12.92, lng: 80.225 },
    groupSize: 340,
    staff: 210,
    preferredProfileId: 'mobility-needs',
    accessibilityRequirement: true,
    evacuationPriority: RELOCATION_TIMEFRAME.IMMEDIATE,
    selectedSiteId: 'eastern-highlands',
    currentHazard: 'flood',
    evacuationReadiness: 74,
    groups: [
      { id: 'critical-patients', label: 'Critical / Bed-bound Patients', count: 60, profileId: 'mobility-needs' },
      { id: 'general-patients', label: 'General Ward Patients', count: 180, profileId: 'elderly' },
      { id: 'staff', label: 'On-duty Staff', count: 100, profileId: 'young-adult' },
    ],
    checklist: [
      { label: 'Ambulance transport confirmed for critical patients', done: true },
      { label: 'Receiving hospital / medical capacity confirmed', done: true },
      { label: 'Power backup for transport window', done: false },
      { label: 'Family notification system active', done: false },
    ],
  },
  {
    id: 'sunrise-care-home',
    name: 'Sunrise Care Home',
    type: INSTITUTION_TYPES.CARE_HOME,
    district: 'Eastern Hills District',
    position: { lat: 12.95, lng: 80.16 },
    groupSize: 96,
    staff: 22,
    preferredProfileId: 'elderly',
    accessibilityRequirement: true,
    evacuationPriority: RELOCATION_TIMEFRAME.IMMEDIATE,
    selectedSiteId: 'sunrise-relocation-park',
    currentHazard: 'landslide',
    evacuationReadiness: 69,
    groups: [
      { id: 'residents', label: 'Elderly Residents', count: 96, profileId: 'elderly' },
    ],
    checklist: [
      { label: 'Accessible transport confirmed', done: true },
      { label: 'Medical escort assigned', done: false },
      { label: 'Receiving site medical support confirmed', done: false },
    ],
  },
  {
    id: 'lakeview-community-center',
    name: 'Lakeview Community Center',
    type: INSTITUTION_TYPES.COMMUNITY_CENTER,
    district: 'Coastal District',
    position: { lat: 12.982, lng: 80.243 },
    groupSize: 450,
    staff: 12,
    preferredProfileId: 'young-adult',
    accessibilityRequirement: false,
    evacuationPriority: RELOCATION_TIMEFRAME.MEDIUM_TERM,
    selectedSiteId: 'lakeview-shelter-complex',
    currentHazard: 'flood',
    evacuationReadiness: 55,
    groups: [
      { id: 'staging', label: 'Staging Population', count: 450, profileId: 'young-adult' },
    ],
    checklist: [
      { label: 'Staging area capacity confirmed', done: true },
      { label: 'Volunteer coordinators assigned', done: false },
    ],
  },
]

export const getInstitution = (id) => institutions.find((i) => i.id === id)
