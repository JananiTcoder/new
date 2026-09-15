import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ShieldAlert, MapPinned, History, ChevronRight, Home } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge, { riskTone } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'
import GeoMap from '../components/map/GeoMap'
import { hazardTypes, hazardZones, severityLevels } from '../data/hazards'
import { useAppState } from '../state/AppStateContext'
import { REDZONE_STATUS } from '../types/geosentra'

const SEVERITY_LABEL = Object.fromEntries(severityLevels.map((s) => [s.id, s]))

const HAZARD_FIELD_LABELS = {
  landslide: [
    ['slope', 'Slope'],
    ['elevation', 'Elevation'],
    ['soilStability', 'Soil Stability'],
    ['rainfallIntensity', 'Rainfall Intensity'],
    ['landslideSusceptibility', 'Landslide Susceptibility'],
    ['recentIncidents', 'Recent Incidents'],
    ['roadBlockageRisk', 'Road Blockage Risk'],
  ],
  flood: [
    ['waterLevel', 'Water Level'],
    ['floodDepth', 'Flood Depth'],
    ['rainfallIntensity', 'Rainfall Intensity'],
    ['drainageCapacity', 'Drainage Capacity'],
    ['riverProximity', 'River / Stream Proximity'],
    ['waterloggingProbability', 'Waterlogging Probability'],
    ['historicalFloodIncidents', 'Historical Flood Incidents'],
    ['roadAccessibility', 'Road Accessibility'],
  ],
  'coastal-erosion': [
    ['distanceFromCoastline', 'Distance From Coastline'],
    ['shorelineRetreatRate', 'Shoreline Retreat Rate'],
    ['erosionSusceptibility', 'Erosion Susceptibility'],
    ['coastalExposure', 'Coastal Exposure'],
    ['historicalErosionIncidents', 'Historical Erosion Incidents'],
    ['infrastructureExposure', 'Infrastructure Exposure'],
    ['safeInlandDistance', 'Safe Inland Distance'],
  ],
  cloudburst: [
    ['shortDurationRainfallIntensity', 'Short-Duration Rainfall Intensity'],
    ['rainfallAccumulation', 'Rainfall Accumulation'],
    ['drainageOverloadProbability', 'Drainage Overload Probability'],
    ['flashFloodProbability', 'Flash-Flood Probability'],
    ['urbanDensity', 'Urban Density'],
    ['lowLyingAreaIndicator', 'Low-Lying Area'],
    ['historicalCloudburstIncidents', 'Historical Cloudburst Incidents'],
    ['roadDisruptionRisk', 'Road Disruption Risk'],
  ],
}

export default function HazardIntelligence() {
  const navigate = useNavigate()
  const { habitations, selectHabitation, ensurePlanning, getOperationForHabitation } = useAppState()
  const [activeTypes, setActiveTypes] = useState(hazardTypes.map((h) => h.id))
  const [selectedZone, setSelectedZone] = useState(null)

  const toggleType = (id) => setActiveTypes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  const filteredZones = hazardZones.filter((z) => activeTypes.includes(z.type))

  const openHabitation = (id) => {
    selectHabitation(id)
    navigate(`/app/habitations/${id}`)
  }

  const startAssignment = (id) => {
    selectHabitation(id)
    ensurePlanning(id)
    navigate('/app/relocation')
  }

  const isUnassigned = (h) => !getOperationForHabitation(h.id)

  // Framed around what needs action, not a duplicate of the Habitations list
  // — only habitations that are both at-risk AND don't have an operation
  // started yet show up here. Critical counts as high risk since both render
  // red (riskTone) and both are the habitations that actually need attention.
  const highRiskHabitations = [...habitations]
    .filter((h) => (h.risk.status === REDZONE_STATUS.CRITICAL || h.risk.status === REDZONE_STATUS.HIGH_RISK) && isUnassigned(h))
    .sort((a, b) => b.risk.riskScore - a.risk.riskScore)
  const moderateRiskHabitations = [...habitations]
    .filter((h) => h.risk.status === REDZONE_STATUS.WATCH && isUnassigned(h))
    .sort((a, b) => b.risk.riskScore - a.risk.riskScore)

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hazard Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Landslide, flood, coastal erosion and cloudburst — how each hazard affects habitations.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/app/habitations')}>
          <Home size={14} /> Open Habitations
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {hazardTypes.map((h) => (
          <button
            key={h.id}
            onClick={() => toggleType(h.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              activeTypes.includes(h.id) ? 'text-white border-transparent' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
            style={activeTypes.includes(h.id) ? { backgroundColor: h.color } : undefined}
          >
            {h.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card className="relative h-[440px] lg:h-[620px] p-0 overflow-hidden">
          <GeoMap
            hazardZones={filteredZones}
            markers={habitations.map((h) => ({ id: h.id, type: 'habitation', position: h.position, label: h.name, priority: h.risk.status }))}
            onMarkerClick={(m) => openHabitation(m.id)}
            onHazardZoneClick={setSelectedZone}
          />
          <div className="absolute top-4 left-4 z-[500] glass rounded-2xl px-3.5 py-2 shadow-lg text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 max-w-[90%]">
            <MapPinned size={13} /> Click a shaded zone for hazard-specific detail
          </div>
          <div className="absolute bottom-4 left-4 z-[500] glass rounded-2xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-4 text-xs max-w-[90%]">
            {severityLevels.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <RiskCategoryBox
            tone="danger"
            icon={ShieldAlert}
            title="Unassigned High Risk"
            habitations={highRiskHabitations}
            emptyLabel="No unassigned habitations are currently at High Risk or above."
            onOpen={openHabitation}
            onStartAssignment={startAssignment}
          />

          <RiskCategoryBox
            tone="warning"
            icon={AlertTriangle}
            title="Unassigned Moderate Risk"
            habitations={moderateRiskHabitations}
            emptyLabel="No unassigned habitations are currently at Moderate Risk."
            onOpen={openHabitation}
            onStartAssignment={startAssignment}
          />
        </div>
      </div>

      <Modal open={!!selectedZone} onClose={() => setSelectedZone(null)} title={selectedZone?.label}>
        {selectedZone && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={SEVERITY_LABEL[selectedZone.severity].id === 'critical' ? 'danger' : riskTone(selectedZone.severity)}>{SEVERITY_LABEL[selectedZone.severity].label}</Badge>
              {selectedZone.redZone && (
                <Badge tone="danger" icon={ShieldAlert}>
                  RED ZONE — unsuitable for continued habitation
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <ZoneStat label="Hazard Type" value={hazardTypes.find((h) => h.id === selectedZone.type)?.label} />
              <ZoneStat label="Affected Area" value={`${selectedZone.affectedAreaKm2} km²`} />
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Hazard-Specific Detail</div>
              <div className="grid grid-cols-2 gap-2.5">
                {(HAZARD_FIELD_LABELS[selectedZone.type] || []).map(([key, label]) => (
                  <ZoneStat key={key} label={label} value={String(selectedZone.fields[key])} />
                ))}
              </div>
            </div>

            <ProgressBar value={selectedZone.confidence} label="Data confidence" tone="blue" />

            <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3.5 flex gap-2.5">
              <History size={16} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Last updated {selectedZone.lastUpdated}.</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{selectedZone.sourceStatus}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}

const RISK_BOX_STYLE = {
  danger: {
    border: 'border-red-200 dark:border-red-500/30',
    iconBg: 'bg-red-100 dark:bg-red-500/15',
    iconColor: 'text-red-600 dark:text-red-400',
    countBg: 'bg-red-600 text-white',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-500/30',
    iconBg: 'bg-amber-100 dark:bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
    countBg: 'bg-amber-500 text-white',
  },
}

// Clicking this box (or any habitation row inside it) uses the exact same
// openHabitation navigation as the map's habitation markers, so risk-category
// boxes and map checkpoints stay behaviorally consistent.
function RiskCategoryBox({ tone, icon: Icon, title, habitations, emptyLabel, onOpen, onStartAssignment }) {
  const style = RISK_BOX_STYLE[tone]

  return (
    <Card className={`p-5 border ${style.border}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-xl ${style.iconBg} flex items-center justify-center`}>
            <Icon size={15} className={style.iconColor} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
        <span className={`h-6 min-w-6 px-1.5 rounded-full ${style.countBg} text-xs font-bold flex items-center justify-center`}>{habitations.length}</span>
      </div>

      {habitations.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">{emptyLabel}</p>}

      <div className="space-y-1 mt-2">
        {habitations.map((h) => (
          <div key={h.id} className="flex items-center gap-1 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <button onClick={() => onOpen(h.id)} className="flex-1 min-w-0 flex items-center justify-between p-1.5 text-left">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{h.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {h.district} · Risk {h.risk.riskScore}
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 shrink-0" />
            </button>
            {onStartAssignment && (
              <button
                onClick={() => onStartAssignment(h.id)}
                className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 px-2 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                Start Assignment
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function ZoneStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">{label}</div>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  )
}
