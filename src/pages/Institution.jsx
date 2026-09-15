import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { School, GraduationCap, Cross, Home as HomeIcon, Users2, Users, Clock, ArrowRight, CheckCircle2, Circle, AlertTriangle, Accessibility, Bus, ShieldAlert } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge, { riskTone } from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import DemoToast from '../components/ui/DemoToast'
import { useAppState } from '../state/AppStateContext'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'
import { getProfile } from '../data/profiles'
import { getSafeSite } from '../data/safeSites'
import { getHazardType, INSTITUTION_TYPES } from '../types/geosentra'

const TYPE_ICON = {
  [INSTITUTION_TYPES.SCHOOL]: School,
  [INSTITUTION_TYPES.COLLEGE]: GraduationCap,
  [INSTITUTION_TYPES.HOSPITAL]: Cross,
  [INSTITUTION_TYPES.CARE_HOME]: HomeIcon,
  [INSTITUTION_TYPES.COMMUNITY_CENTER]: Users2,
}

const TYPE_GUIDANCE = {
  [INSTITUTION_TYPES.SCHOOL]: 'Automatically evacuated using the School Children profile — maximum caution on any hazard exposure.',
  [INSTITUTION_TYPES.COLLEGE]: 'Evacuated using the Young Adults profile — can tolerate a broader set of routes.',
  [INSTITUTION_TYPES.HOSPITAL]: 'Prioritizes accessibility, medical support and the lowest-hazard route available.',
  [INSTITUTION_TYPES.CARE_HOME]: 'Prioritizes accessibility, medical support and the lowest-hazard route available.',
  [INSTITUTION_TYPES.COMMUNITY_CENTER]: 'Staging population evacuated using a balanced, moderate-risk-tolerant profile.',
}

export default function Institution() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const canAct = role === ROLES.EMERGENCY_COORDINATOR || role === ROLES.DISASTER_AUTHORITY
  const { institutions, selectedInstitutionId, selectInstitution, setRouteOriginOverride, setProfileId, selectSite, institutionChecklistOverrides, resolveInstitutionChecklistItem } = useAppState()
  const institution = institutions.find((i) => i.id === selectedInstitutionId) || institutions[0]
  const site = getSafeSite(institution.selectedSiteId)
  const [toast, setToast] = useState('')

  // Effective checklist overlays any demo-mode "Resolve Blocker" /
  // "Assign Transport" actions on top of the static readiness checklist.
  const overrides = institutionChecklistOverrides[institution.id] || {}
  const effectiveChecklist = institution.checklist.map((c, i) => ({ ...c, done: c.done || !!overrides[i] }))
  const blockerIndex = effectiveChecklist.findIndex((c) => !c.done)
  const blocker = blockerIndex >= 0 ? effectiveChecklist[blockerIndex] : null
  const transportItemIndex = institution.checklist.findIndex((c) => c.label.toLowerCase().includes('transport'))
  const transportStatus = transportItemIndex >= 0 ? (effectiveChecklist[transportItemIndex].done ? 'Confirmed' : 'Pending') : 'Not required'

  // Evacuated/remaining are a deterministic, clearly-labeled presentational
  // estimate from readiness % — not a separately tracked headcount, since
  // this app has no live check-in feed for institution groups.
  const evacuatedEstimate = Math.round((institution.groupSize * institution.evacuationReadiness) / 100)
  const remainingEstimate = institution.groupSize - evacuatedEstimate

  const openRouteForGroup = (group) => {
    setRouteOriginOverride({ kind: 'institution', id: institution.id })
    setProfileId(group.profileId)
    selectSite(institution.selectedSiteId)
    navigate('/app/routes/lookup')
  }

  const resolveBlocker = () => {
    if (blockerIndex < 0) return
    resolveInstitutionChecklistItem(institution.id, blockerIndex, blocker.label)
    setToast('Blocker resolved in demo mode.')
  }
  const assignTransport = () => {
    if (transportItemIndex < 0 || effectiveChecklist[transportItemIndex].done) return
    resolveInstitutionChecklistItem(institution.id, transportItemIndex, institution.checklist[transportItemIndex].label)
    setToast('Transport assignment updated in demo mode.')
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Institution &amp; Group Evacuation</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Schools, colleges, hospitals, care homes and community centers — each with a group-specific evacuation profile.</p>
      </div>

      {/* Institution selector */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {institutions.map((i) => {
          const Icon = TYPE_ICON[i.type] || School
          const active = i.id === institution.id
          return (
            <Card key={i.id} hover onClick={() => selectInstitution(i.id)} className={`p-4 cursor-pointer ${active ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/20' : ''}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{i.name}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">{i.type}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{i.groupSize.toLocaleString()} people</div>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {(() => {
              const Icon = TYPE_ICON[institution.type] || School
              return <Icon size={20} className="text-blue-600 dark:text-blue-400" />
            })()}
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{institution.name}</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {institution.type} · {institution.district}
          </p>
        </div>
        <Badge tone="warning" icon={AlertTriangle}>
          Current hazard: {getHazardType(institution.currentHazard)?.label}
        </Badge>
      </div>

      <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2.5">
        <Accessibility size={16} className="shrink-0" />
        {TYPE_GUIDANCE[institution.type]}
        {institution.accessibilityRequirement && (
          <Badge tone="blue" className="ml-auto shrink-0">
            Accessibility required
          </Badge>
        )}
      </div>

      {/* The blocker preventing completion is the single most important piece
          of information on this page — shown before any other stat. */}
      {blocker ? (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3.5 flex flex-wrap items-center gap-3">
          <ShieldAlert size={18} className="text-red-600 dark:text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-0.5">Blocker</div>
            <p className="text-sm text-red-800 dark:text-red-300">{blocker.label} — pending.</p>
          </div>
          {canAct && (
            <Button size="sm" variant="danger" onClick={blocker.label.toLowerCase().includes('transport') ? assignTransport : resolveBlocker}>
              {blocker.label.toLowerCase().includes('transport') ? <Bus size={14} /> : <CheckCircle2 size={14} />}
              {blocker.label.toLowerCase().includes('transport') ? 'Assign Transport' : 'Resolve Blocker'}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="shrink-0" /> No blockers — every readiness checklist item is complete.
        </div>
      )}

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Group Size</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{institution.groupSize.toLocaleString()}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Staff</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{institution.staff}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Evacuation Priority</div>
          <Badge tone={riskTone(institution.evacuationPriority)}>{institution.evacuationPriority}</Badge>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Evacuation Readiness</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{institution.evacuationReadiness}%</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Evacuated / Remaining (est.)</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {evacuatedEstimate.toLocaleString()} / {remainingEstimate.toLocaleString()}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Transport Status</div>
          <Badge tone={transportStatus === 'Confirmed' ? 'good' : transportStatus === 'Pending' ? 'warning' : 'default'}>{transportStatus}</Badge>
        </Card>
      </div>

      <Card className="p-6">
        <ProgressBar value={institution.evacuationReadiness} label="Evacuation Readiness" tone="good" />
        <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Selected destination: <b className="text-slate-600 dark:text-slate-300">{site.name}</b> · Evacuated/Remaining figures are a demo estimate derived from readiness %, not a live headcount feed.
        </div>
      </Card>

      <div>
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Users size={17} className="text-blue-600 dark:text-blue-400" /> Group Evacuation Plan
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {institution.groups.map((g) => (
            <Card key={g.id} hover className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{g.label}</h3>
                <Badge tone="blue">{getProfile(g.profileId)?.label}</Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">{g.count.toLocaleString()}</div>
              <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <div>
                  Destination: <b className="text-slate-700 dark:text-slate-300">{site.name}</b>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} /> Profile-specific travel time shown in Route Intelligence
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => openRouteForGroup(g)}>
                View Route <ArrowRight size={14} />
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Readiness Checklist</h3>
        <div className="space-y-2.5">
          {effectiveChecklist.map((c, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              {c.done ? <CheckCircle2 size={17} className="text-emerald-500 shrink-0" /> : <Circle size={17} className="text-slate-300 dark:text-slate-600 shrink-0" />}
              <span className={`flex-1 ${c.done ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>{c.label}</span>
              {canAct && !c.done && (
                <button onClick={() => resolveInstitutionChecklistItem(institution.id, i, c.label)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                  Mark done
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <DataStatusPanel />
      <DemoToast message={toast} onDismiss={() => setToast('')} />
    </div>
  )
}
