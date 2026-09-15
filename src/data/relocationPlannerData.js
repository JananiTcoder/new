// Operational geospatial data structures for the GeoSentra Relocation Planner.
// Reuses the same hazard zones, severity levels, safe sites, and infrastructure
// used by the GeoSentra Overview dashboard (AuthorityOverview.jsx).

import { hazardZones, severityLevels } from './hazards'
import { safeSites } from './safeSites'
import { shelters, hospitals, schools } from './dashboard'
import { haversineKm } from '../utils/geo'

// Re-export the existing Overview hazard zones and severity levels
export { hazardZones, severityLevels, safeSites, shelters, hospitals, schools }

// Enriched safe site metadata (matching safeSites.js ids with operational details)
const SITE_EXTRAS = {
  'lakeview-shelter-complex': {
    address: 'Lakeview Bypass Road, Sector 4, Sholinganallur',
    contactPerson: 'Major K. Rajendran (EOC Nodal Officer)',
    phone: '+91 94440 18234',
    vhfChannel: 'VHF Ch 4 (156.200 MHz)',
    facilities: [
      '24/7 Medical Triage Unit',
      'Water Purification Plant (12,000 L/day)',
      'Backup Diesel Generator (150 kVA)',
      'Wheelchair Ramps & Accessible Toilets',
      'Child Safe Play & Nutrition Center',
      'Dedicated Volunteer Command Post',
    ],
  },
  'community-dev-zone': {
    address: 'CDZ Campus, Medavakkam High Road',
    contactPerson: 'Dr. Savitri Murugan (District Camp In-charge)',
    phone: '+91 94440 29381',
    vhfChannel: 'VHF Ch 2 (156.100 MHz)',
    facilities: [
      'Field Hospital (30 beds)',
      'Community Kitchen',
      'High-capacity Sanitation Facilities',
      'Elderly Care Pods',
      'Solar Microgrid with Battery Storage',
    ],
  },
  'riverside-relief': {
    address: 'Kotturpuram Community Grounds',
    contactPerson: 'Inspector V. Raman (Camp Officer)',
    phone: '+91 94440 44102',
    vhfChannel: 'VHF Ch 6 (156.300 MHz)',
    facilities: [
      'Mobile Medical Clinic',
      'Drinking Water Tankers',
      'Prefabricated Dormitories',
      'Logistics Dispatch Bay',
    ],
  },
  'northern-township': {
    address: 'Ring Road Sector 9, Madhavaram',
    contactPerson: 'S. Chandrasekhar (Township Coordinator)',
    phone: '+91 94440 55198',
    vhfChannel: 'VHF Ch 8 (156.400 MHz)',
    facilities: [
      'Full Multi-Speciality Health Center',
      'Central Relief Warehouse',
      'Helipad Landing Area',
      'Telecom Emergency Tower',
    ],
  },
  'sunrise-relocation-park': {
    address: 'Velachery Bypass Road',
    contactPerson: 'P. Sundaram (Zonal Officer)',
    phone: '+91 94440 66210',
    vhfChannel: 'VHF Ch 3 (156.150 MHz)',
    facilities: [
      'Emergency First Aid Center',
      'Potable Water Dispensers',
      'Sanitation Units',
      'Security Checkpoint',
    ],
  },
  'eastern-highlands': {
    address: 'Hill Plateau Road, Pallavaram East',
    contactPerson: 'Col. T. Mathur (Site Superintendent)',
    phone: '+91 94440 77312',
    vhfChannel: 'VHF Ch 5 (156.250 MHz)',
    facilities: [
      'Field Hospital',
      'Food Supply Depot',
      'Generator Power Backup',
      'Satellite Communications Tent',
    ],
  },
}

// Full planner safe sites combining core safeSites.js with operational metadata
export const PLANNER_SAFE_SITES = safeSites.map((site) => {
  const extra = SITE_EXTRAS[site.id] || {
    address: `${site.district}, Sector 1`,
    contactPerson: 'Duty Evacuation Officer',
    phone: '+91 94440 00000',
    vhfChannel: 'VHF Ch 1 (156.050 MHz)',
    facilities: ['Emergency Water Supply', 'Medical First Aid Post', 'Shelter Dormitory'],
  }
  const availableCapacity = site.capacity.physicalCapacity - site.currentOccupancy - (site.reservedCapacity || 0)
  return {
    ...site,
    capacity: site.capacity.physicalCapacity,
    availableCapacity: Math.max(0, availableCapacity),
    status: 'Operational',
    ...extra,
  }
})

// Candidate routes matching the exact user specification
export const PLANNER_ROUTES = [
  {
    id: 'route-a',
    routeNumber: 'Route A',
    name: 'Route A — Coastal Expressway Bypass',
    type: 'Primary Recommended Route',
    distanceKm: 8.4,
    estimatedTimeMin: 18,
    hazardExposure: 'Low',
    riskLevel: 'Low',
    roadStatus: 'Clear',
    roadCondition: 'Elevated multi-lane expressway, storm drains active, zero pooling',
    majorHazards: 'None detected on primary corridor; bypass avoids flood basins',
    currentAccessibility: 'Wheelchair, Heavy Transit, Ambulance, Civilian Vehicles',
    color: '#2563eb', // GeoSentra primary blue
    isPrimary: true,
    positions: [
      [12.8404, 80.2445], // Origin (Kovalam East)
      [12.865, 80.248],
      [12.902, 80.249],
      [12.935, 80.247],
      [12.965, 80.246],
      [12.98, 80.245], // Destination (Lakeview Shelter Complex)
    ],
  },
  {
    id: 'route-b',
    routeNumber: 'Route B',
    name: 'Route B — Central Arterial Avenue',
    type: 'Alternative Secondary Route',
    distanceKm: 7.1,
    estimatedTimeMin: 15,
    hazardExposure: 'High',
    riskLevel: 'High',
    roadStatus: 'Partially affected',
    roadCondition: 'Narrow urban avenue; 25cm waterlogging near canal overflow',
    majorHazards: 'Submerged road segment at km 3.8; partial lane obstruction',
    currentAccessibility: 'Emergency Trucks & High-Clearance SUVs only',
    color: '#ea580c', // High hazard orange
    isPrimary: false,
    positions: [
      [12.8404, 80.2445],
      [12.855, 80.238],
      [12.875, 80.228],
      [12.915, 80.232],
      [12.955, 80.238],
      [12.98, 80.245],
    ],
  },
  {
    id: 'route-c',
    routeNumber: 'Route C',
    name: 'Route C — Old Canal Road',
    type: 'Alternative Tertiary Route',
    distanceKm: 9.2,
    estimatedTimeMin: 21,
    hazardExposure: 'Moderate',
    riskLevel: 'Moderate',
    roadStatus: 'Clear',
    roadCondition: 'Paved secondary road; light surface runoff, fully passable',
    majorHazards: 'Moderate crosswinds near lake bridge; speed restricted to 40 km/h',
    currentAccessibility: 'All Vehicles with standard clearance',
    color: '#d97706', // Moderate warning amber
    isPrimary: false,
    positions: [
      [12.8404, 80.2445],
      [12.858, 80.218],
      [12.888, 80.208],
      [12.93, 80.215],
      [12.965, 80.232],
      [12.98, 80.245],
    ],
  },
]

export const EMERGENCY_COORDINATORS = [
  {
    id: 'coord-arun',
    name: 'Arun Kumar',
    role: 'Disaster Response Coordinator',
    designation: 'Senior Evacuation Specialist',
    location: 'Tambaram',
    district: 'Coastal / Central District',
    distanceKm: 3.2,
    distanceText: '3.2 km',
    status: 'Available',
    currentAssignment: 'Standby / Rapid Response',
    contactChannel: 'VHF Ch 4 · Encrypted',
    phone: '+91 98401 22345',
    experience: '8 years disaster relief',
    position: { lat: 12.9249, lng: 80.1481 }, // Tambaram
  },
  {
    id: 'coord-bose',
    name: 'A. Bose',
    role: 'Emergency Operations Coordinator',
    designation: 'District Incident Commander',
    location: 'Perungudi',
    district: 'Coastal District',
    distanceKm: 4.8,
    distanceText: '4.8 km',
    status: 'Available',
    currentAssignment: 'Command Desk Standby',
    contactChannel: 'VHF Ch 2 · Command Channel',
    phone: '+91 98402 33456',
    experience: '12 years civil defense',
    position: { lat: 12.9654, lng: 80.2461 },
  },
  {
    id: 'coord-iyer',
    name: 'R. Iyer',
    role: 'Tactical Rescue Coordinator',
    designation: 'Field Operations Lead',
    location: 'Medavakkam',
    district: 'Central District',
    distanceKm: 5.6,
    distanceText: '5.6 km',
    status: 'Available',
    currentAssignment: 'Route Reconnaissance',
    contactChannel: 'VHF Ch 5 · Field Ops',
    phone: '+91 98403 44567',
    experience: '6 years coastal NDRF',
    position: { lat: 12.9185, lng: 80.1887 },
  },
  {
    id: 'coord-nair',
    name: 'K. Nair',
    role: 'Logistics Transport Coordinator',
    designation: 'Fleet Convoy Officer',
    location: 'Pallavaram',
    district: 'Eastern Hills District',
    distanceKm: 6.9,
    distanceText: '6.9 km',
    status: 'Available',
    currentAssignment: 'Heavy Transport Staging',
    contactChannel: 'VHF Ch 8 · Transport',
    phone: '+91 98404 55678',
    experience: '9 years heavy logistics',
    position: { lat: 12.9675, lng: 80.1491 },
  },
]

export const NEARBY_VOLUNTEERS = [
  {
    id: 'vol-priya',
    name: 'Priya S.',
    capability: 'First Aid & Triage',
    skill: 'First Aid',
    location: 'Chromepet',
    district: 'Coastal District',
    distanceKm: 4.1,
    distanceText: '4.1 km',
    status: 'Available',
    currentAssignment: 'Standby / Rapid First Responder',
    certifications: ['Red Cross EMT-B', 'Disaster First Aid Certified'],
    contactChannel: 'Phone / VHF Ch 4',
    phone: '+91 97910 88201',
    position: { lat: 12.9516, lng: 80.1462 }, // Chromepet
  },
  {
    id: 'vol-arjun',
    name: 'Arjun K.',
    capability: 'Search & Water Rescue',
    skill: 'Water Rescue',
    location: 'Sholinganallur',
    district: 'Coastal District',
    distanceKm: 2.8,
    distanceText: '2.8 km',
    status: 'Available',
    currentAssignment: 'Inflatable Boat Team Lead',
    certifications: ['Certified Lifeguard', 'Flood Evacuation Diver'],
    contactChannel: 'Phone / VHF Ch 4',
    phone: '+91 97910 99312',
    position: { lat: 12.901, lng: 80.2279 },
  },
  {
    id: 'vol-divya',
    name: 'Divya R.',
    capability: 'Shelter Logistics & Food Distribution',
    skill: 'Logistics',
    location: 'Thoraipakkam',
    district: 'Coastal District',
    distanceKm: 5.2,
    distanceText: '5.2 km',
    status: 'Available',
    currentAssignment: 'Supply Stockroom Standby',
    certifications: ['Disaster Relief Logistics Specialist'],
    contactChannel: 'Phone / VHF Ch 2',
    phone: '+91 97910 11423',
    position: { lat: 12.9416, lng: 80.2362 },
  },
  {
    id: 'vol-farhan',
    name: 'Farhan M.',
    capability: 'Emergency Transport & Convoy Pilot',
    skill: 'Transport',
    location: 'Velachery',
    district: 'Central District',
    distanceKm: 6.4,
    distanceText: '6.4 km',
    status: 'Available',
    currentAssignment: 'Minibus Evacuation Fleet',
    certifications: ['Heavy Passenger Vehicle Master', 'Defensive Driving'],
    contactChannel: 'Phone / VHF Ch 5',
    phone: '+91 97910 22534',
    position: { lat: 12.9815, lng: 80.218 },
  },
  {
    id: 'vol-lakshmi',
    name: 'Lakshmi N.',
    capability: 'Vulnerable Population & Elderly Care',
    skill: 'Elderly Care',
    location: 'Guindy',
    district: 'Central District',
    distanceKm: 7.5,
    distanceText: '7.5 km',
    status: 'Available',
    currentAssignment: 'Assisted Mobility Team',
    certifications: ['Geriatric Nursing Assistant'],
    contactChannel: 'Phone / VHF Ch 3',
    phone: '+91 97910 33645',
    position: { lat: 13.0067, lng: 80.2026 },
  },
]

export const OPERATION_STATUS_OPTIONS = [
  'Assigned',
  'Dispatched',
  'En Route',
  'Arrived',
  'In Progress',
  'Completed',
]

export const DEFAULT_HABITATION = {
  id: 'kovalam-east',
  name: 'Kovalam East',
  district: 'Coastal District',
  state: 'Tamil Nadu',
  population: 2450,
  riskStatus: 'Critical Red Zone',
  hazardType: 'Coastal Inundation / Surge',
  riskScore: 96,
  position: { lat: 12.8404, lng: 80.2445 },
  criticalNeeds: 'Immediate evacuation for 380 elderly & 640 children.',
}

/**
 * Resolves or adapts candidate routes connecting an affected habitation to a safe site.
 * Preserves the exact demo metrics specified while keeping the full hazard context visible.
 */
export function getCandidateRoutesForSite(habitation, site) {
  const origin = [habitation.position.lat, habitation.position.lng]
  const dest = [site.position.lat, site.position.lng]
  const dist = haversineKm(habitation.position, site.position)

  return PLANNER_ROUTES.map((baseRoute, idx) => {
    let positions = baseRoute.positions
    // Bend positions dynamically towards destination so lines cleanly anchor
    if (baseRoute.positions.length > 2) {
      const midPoints = baseRoute.positions.slice(1, -1)
      positions = [origin, ...midPoints, dest]
    } else {
      positions = [origin, dest]
    }

    // Dynamic scale if site is different from default Lakeview Shelter Complex
    const scaleFactor = dist / 8.4
    const distanceKm = +(baseRoute.distanceKm * (scaleFactor > 0 ? scaleFactor : 1)).toFixed(1)
    const estimatedTimeMin = Math.round(baseRoute.estimatedTimeMin * (scaleFactor > 0 ? scaleFactor : 1))

    return {
      ...baseRoute,
      positions,
      distanceKm,
      estimatedTimeMin,
      isAlternative: idx > 0,
    }
  })
}
