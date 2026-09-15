import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ClipboardList, UserCog, Users, Truck, Building2, ChevronRight, ArrowLeft, Download, Loader2, Info, ExternalLink } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import DemoToast from '../components/ui/DemoToast'
import GeoMap from '../components/map/GeoMap'
import { LegendDot, LegendBox } from '../components/map/MapLegend'
import { STATUS_TONE } from '../components/ui/OperationSummary'
import { SAFE_SITE_COLOR, RELIEF_SITE_COLOR } from '../components/map/mapLayerDefs'
import ResourceBox from '../components/resources/ResourceBox'
import ResourceDetailsDrawer from '../components/resources/ResourceDetailsDrawer'
import { getSafeSite } from '../data/safeSites'
import { hazardZones } from '../data/hazards'
import { getCoordinator } from '../data/coordinators'
import { getVolunteer } from '../data/volunteers'
import { useAppState } from '../state/AppStateContext'
import { useProviderData } from '../provider/providerStore'
import { resolveOperationRoute } from '../utils/routing'
import { computeRouteRisk } from '../utils/routeCalculations'
import { computeAvailableCapacity } from '../utils/capacityCalculations'
import { downloadOperationReport } from '../utils/operationReport'
import {
  COORDINATOR_COLUMNS,
  VOLUNTEER_COLUMNS,
  TRANSPORT_COLUMNS,
  INFRASTRUCTURE_COLUMNS,
  TRANSPORT_UNAVAILABLE_MESSAGE,
  buildCoordinatorRecords,
  buildVolunteerRecords,
  buildTransportRecords,
  buildInfrastructureRecords,
} from '../utils/operationResources'
import { downloadResourceListPdf, downloadResourceDetailPdf, slugForFilename } from '../utils/resourcePdf'
import { getHazardType, OPERATION_STATUS } from '../types/geosentra'
import { STATUS_DISPLAY_LABEL } from './relocation-planner/plannerStatus'

const INFRASTRUCTURE_EMPTY_MESSAGE = 'Infrastructure data is not available from the current backend.'

const DEFAULT_PROFILE = 'young-adult'

// Route line color reflects the OPERATION's real status (not the route's own
// safest/balanced/fastest tier, which isn't meaningful at this fleet-overview
// level) — reuses the exact OPERATION_STATUS values already stored on every
// operation, never an invented status.
const STATUS_ROUTE_COLOR = {
  [OPERATION_STATUS.ASSIGNED]: '#2563eb',
  [OPERATION_STATUS.DISPATCHED]: '#3b82f6',
  [OPERATION_STATUS.EN_ROUTE]: '#0284c7',
  [OPERATION_STATUS.ARRIVED]: '#0d9488',
  [OPERATION_STATUS.IN_PROGRESS]: '#7c3aed',
  [OPERATION_STATUS.COMPLETED]: '#059669',
  [OPERATION_STATUS.TEAM_ASSIGNMENT_PENDING]: '#d97706',
  [OPERATION_STATUS.TEAM_ASSIGNED]: '#2563eb',
  [OPERATION_STATUS.OPERATION_ACTIVE]: '#7c3aed',
  [OPERATION_STATUS.PARTIALLY_RELOCATED]: '#7c3aed',
  [OPERATION_STATUS.RELOCATION_COMPLETED]: '#059669',
  [OPERATION_STATUS.OPERATION_CLOSED]: '#475569',
}
const DEFAULT_ROUTE_COLOR = '#64748b'

const STATUS_LEGEND = [
  { status: OPERATION_STATUS.ASSIGNED, label: 'Assigned' },
  { status: OPERATION_STATUS.EN_ROUTE, label: 'En Route' },
  { status: OPERATION_STATUS.IN_PROGRESS, label: 'In Progress' },
  { status: OPERATION_STATUS.COMPLETED, label: 'Completed' },
  { status: OPERATION_STATUS.OPERATION_CLOSED, label: 'Closed' },
]

export default function OperationManagement() {
  const navigate = useNavigate()
  const { habitations, operations, coordinators, volunteers, scenario } = useAppState()
  const { providers, capacitiesById, detailsById } = useProviderData()
  const [selectedHabitationId, setSelectedHabitationId] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [toast, setToast] = useState('')

  // Authority Operations resource sections — Emergency Coordinators and
  // Volunteers come from AppStateContext's roster + live operations (open
  // assignments are always derived, never a stored flag). Infrastructure
  // comes from the Resource & Infrastructure Provider portal's shared store.
  // Transport has no backing data anywhere in this codebase (see
  // utils/operationResources.js), so it always renders the accurate empty
  // state instead of fabricated vehicles.
  const [selectedResource, setSelectedResource] = useState(null)
  const [pdfLoadingKey, setPdfLoadingKey] = useState(null)
  const [pdfErrors, setPdfErrors] = useState({})

  const coordinatorRecords = useMemo(() => buildCoordinatorRecords(coordinators, operations, habitations), [coordinators, operations, habitations])
  const volunteerRecords = useMemo(() => buildVolunteerRecords(volunteers, operations, habitations), [volunteers, operations, habitations])
  const transportRecords = useMemo(() => buildTransportRecords(), [])
  const infrastructureRecords = useMemo(() => buildInfrastructureRecords(providers, capacitiesById, detailsById), [providers, capacitiesById, detailsById])

  const runPdfJob = (key, job) => {
    setPdfErrors((prev) => ({ ...prev, [key]: null }))
    setPdfLoadingKey(key)
    setTimeout(() => {
      try {
        job()
      } catch {
        setPdfErrors((prev) => ({ ...prev, [key]: 'PDF generation failed — please try again.' }))
      } finally {
        setPdfLoadingKey(null)
      }
    }, 50)
  }

  const downloadCategoryPdf = (key, category, columns, records, emptyMessage) =>
    runPdfJob(key, () =>
      downloadResourceListPdf({
        category,
        filename: `geosentra-${slugForFilename(category)}-${Date.now()}.pdf`,
        columns,
        rows: records.map((r) => r.cells),
        emptyMessage,
      })
    )

  const downloadDetailPdf = (record) =>
    runPdfJob(`detail-${record.id}`, () =>
      downloadResourceDetailPdf({
        category: record.category,
        name: record.name,
        statusLabel: record.statusLabel,
        filename: `geosentra-${slugForFilename(record.category)}-${slugForFilename(record.name)}-${Date.now()}.pdf`,
        fields: record.fields,
      })
    )

  const rows = useMemo(
    () =>
      Object.values(operations)
        .map((op) => {
          const habitation = habitations.find((h) => h.id === op.habitationId)
          const site = op.safeSiteId ? getSafeSite(op.safeSiteId) : null
          const coordinator = op.coordinatorId ? getCoordinator(op.coordinatorId) : null
          const assignedVolunteers = (op.volunteerIds || []).map(getVolunteer).filter(Boolean)
          const route = habitation && site ? resolveOperationRoute(habitation, site, op.routeId) : null
          const stats = route ? computeRouteRisk(route, DEFAULT_PROFILE, scenario) : null
          return { op, habitation, site, coordinator, assignedVolunteers, route, stats }
        })
        .filter((row) => row.habitation)
        .sort((a, b) => new Date(b.op.updatedAt) - new Date(a.op.updatedAt)),
    [operations, habitations, scenario]
  )

  const selected = rows.find((r) => r.habitation.id === selectedHabitationId) || null

  // Only the selected route/markers get zoomed to — everything else stays
  // mounted (and muted via selectedRouteId below) instead of being unmounted,
  // so switching selection never requires "Back to All Operations" first.
  const focusPoints = useMemo(() => {
    if (!selected) return undefined
    const pts = [[selected.habitation.position.lat, selected.habitation.position.lng]]
    if (selected.site) pts.push([selected.site.position.lat, selected.site.position.lng])
    if (selected.route) selected.route.positions?.forEach((p) => pts.push(p))
    return pts
  }, [selected])

  const overviewMarkers = useMemo(() => {
    const m = []
    rows.forEach(({ op, habitation, site }) => {
      m.push({ id: `hab-${habitation.id}`, type: 'habitation', position: habitation.position, label: habitation.name, priority: habitation.risk.status })
      if (site) m.push({ id: `site-${op.habitationId}`, type: 'site', shape: 'box', color: RELIEF_SITE_COLOR, position: site.position, label: site.name })
    })
    return m
  }, [rows])

  const overviewRoutes = useMemo(
    () =>
      rows
        .filter((r) => r.route)
        .map(({ op, route }) => ({ ...route, id: `route-${op.habitationId}`, color: STATUS_ROUTE_COLOR[op.status] || DEFAULT_ROUTE_COLOR })),
    [rows]
  )

  const overviewHazardZones = useMemo(() => {
    const types = new Set()
    rows.forEach((r) => r.habitation.hazards.forEach((h) => types.add(h)))
    return hazardZones.filter((z) => types.has(z.type))
  }, [rows])

  const focusOperation = (habitationId) => setSelectedHabitationId(habitationId)
  const backToAll = () => setSelectedHabitationId(null)

  const handleMarkerClick = (m) => {
    if (m.id.startsWith('hab-')) focusOperation(m.id.replace('hab-', ''))
    else if (m.id.startsWith('site-')) focusOperation(m.id.replace('site-', ''))
  }
  const handleRouteClick = (routeId) => focusOperation(routeId.replace('route-', ''))

  const handleDownload = async (row) => {
    setDownloadingId(row.habitation.id)
    try {
      downloadOperationReport(row)
      setToast('Report downloaded.')
    } catch {
      setToast('Report generation failed — please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="p-4 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ClipboardList size={22} className="text-blue-600 dark:text-blue-400" /> Emergency Response Operations
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Every emergency relief operation, on one map — select a route or a table row to open its full report.</p>
      </div>

      {/* All-operations map — every operation's marker and route stays mounted
          at all times; selecting one mutes (not hides) the rest via
          selectedRouteId/focusPoints, so a different route/row stays
          clickable without needing "Back to All Operations" first. */}
      <Card className="relative h-[420px] p-0 overflow-hidden">
        <GeoMap
          key={selected ? selected.habitation.id : 'overview'}
          markers={overviewMarkers}
          routes={overviewRoutes}
          hazardZones={overviewHazardZones}
          showHazards
          selectedRouteId={selected ? `route-${selected.habitation.id}` : undefined}
          selectedMarkerId={selected ? `hab-${selected.habitation.id}` : undefined}
          focusPoints={focusPoints}
          onMarkerClick={handleMarkerClick}
          onRouteClick={handleRouteClick}
        />

        <div className="absolute bottom-3 left-3 z-[500] glass rounded-xl px-3 py-2 shadow-lg flex flex-wrap items-center gap-3 text-[11px] max-w-[90%]">
          <LegendDot color="#dc2626" label="Habitation" />
          <LegendBox color={RELIEF_SITE_COLOR} label="Relief Site" />
          {STATUS_LEGEND.map((s) => <LegendDot key={s.status} color={STATUS_ROUTE_COLOR[s.status]} label={s.label} />)}
        </div>

        {selected && (
          <div className="absolute top-3 left-3 z-[500]">
            <Button size="sm" variant="secondary" onClick={backToAll} className="glass shadow-lg">
              <ArrowLeft size={13} /> Back to All Operations
            </Button>
          </div>
        )}
      </Card>

      {!selected && rows.length > 0 && (
        <Card className="p-8 text-center flex flex-col items-center gap-2">
          <Info size={18} className="text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Select an operation route or table row to view its report.</p>
        </Card>
      )}

      {/* Selected operation report */}
      {selected && (
        <Card className="p-5 space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                Operation {selected.op.id} — {selected.habitation.name}
                <Badge tone={STATUS_TONE[selected.op.status] || 'default'}>{selected.op.status}</Badge>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Assigned {new Date(selected.op.createdAt).toLocaleString()} · Last updated {new Date(selected.op.updatedAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/app/operations/${selected.habitation.id}`} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-1.5 transition-all">
                Manage Operation <ExternalLink size={13} />
              </Link>
              <Button size="sm" variant="secondary" disabled={downloadingId === selected.habitation.id} onClick={() => handleDownload(selected)}>
                {downloadingId === selected.habitation.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Report
              </Button>
            </div>
          </div>

          <ReportSection title="Operation Details">
            <ReportStat label="Hazard Type" value={getHazardType(selected.habitation.primaryHazard)?.label} />
            <ReportStat label="Hazard Severity" value={selected.habitation.risk.status} />
            <ReportStat label="Source (Affected Area)" value={`${selected.habitation.name}, ${selected.habitation.district}`} />
            <ReportStat label="Destination (Relief Site)" value={selected.site ? `${selected.site.name}, ${selected.site.district}` : 'Not selected'} />
            <ReportStat label="Current Stage" value={STATUS_DISPLAY_LABEL[selected.op.status] || selected.op.status} />
            <ReportStat label="Relief Site Capacity" value={selected.site ? `${computeAvailableCapacity(selected.site).toLocaleString()} available` : 'Not available'} />
          </ReportSection>

          <ReportSection title="Assigned Emergency Coordinator & Team">
            <ReportStat label="Emergency Coordinator" value={selected.coordinator?.name || 'Not yet assigned'} />
            <ReportStat label="Coordinator Status" value={selected.coordinator?.status || 'Not available'} />
            <ReportStat label="Volunteers" value={selected.assignedVolunteers.length ? selected.assignedVolunteers.map((v) => v.name).join(', ') : 'None assigned'} />
            <ReportStat label="Current Team Location" value="Live tracking via Flutter mobile app" />
          </ReportSection>

          <ReportSection title="Relief & Evacuation Details">
            <ReportStat label="People Relocated" value={selected.op.relocatedCount?.toLocaleString() ?? '0'} />
            <ReportStat label="Total Requiring Relief" value={selected.op.populationRequiring?.toLocaleString() ?? '0'} />
            <ReportStat label="People Remaining" value={Math.max(0, (selected.op.populationRequiring || 0) - (selected.op.relocatedCount || 0)).toLocaleString()} />
            <ReportStat label="Assigned Vehicles" value="Coordinated via Logistics Desk" />
          </ReportSection>

          <ReportSection title="Route Information">
            <ReportStat label="Route Distance" value={selected.route ? `${selected.route.distanceKm} km` : 'Not available'} />
            <ReportStat label="Estimated Travel Time" value={selected.stats ? `${selected.stats.timeMin} min` : 'Not available'} />
            <ReportStat label="Hazard Exposure" value={selected.stats?.dominantHazardLabel || 'No hazard exposure detected'} />
            <ReportStat label="Route Status" value={selected.op.routeStatus || 'Clear / Monitored'} />
          </ReportSection>
        </Card>
      )}

      {/* Operations table */}
      <Card className="overflow-hidden overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">No operations started yet. Open a habitation and click "Assign Emergency Coordinator" to begin.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <th className="px-4 py-3.5 font-semibold">Operation</th>
                <th className="px-4 py-3.5 font-semibold">Emergency Coordinator</th>
                <th className="px-4 py-3.5 font-semibold">Affected Habitation</th>
                <th className="px-4 py-3.5 font-semibold">Relief Site</th>
                <th className="px-4 py-3.5 font-semibold">Hazard</th>
                <th className="px-4 py-3.5 font-semibold">Risk</th>
                <th className="px-4 py-3.5 font-semibold">Route Distance</th>
                <th className="px-4 py-3.5 font-semibold">Relocated</th>
                <th className="px-4 py-3.5 font-semibold">Progress</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Last Update</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { op, habitation, site, coordinator, assignedVolunteers, route } = row
                const progressPct = op.populationRequiring > 0 ? Math.round(((op.relocatedCount || 0) / op.populationRequiring) * 100) : 0
                const teamMembers = [coordinator?.name, ...assignedVolunteers.map((v) => v.name)].filter(Boolean).join(', ') || '—'
                const isSelected = selectedHabitationId === habitation.id
                return (
                  <tr
                    key={op.id}
                    onClick={() => focusOperation(habitation.id)}
                    className={`border-b border-slate-50 dark:border-slate-800/60 last:border-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-blue-50/50 dark:hover:bg-blue-500/5'
                    }`}
                  >
                    <td className="px-4 py-4 font-mono text-xs text-slate-400 dark:text-slate-500">{op.id}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={teamMembers}>
                      {teamMembers}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-200">{habitation.name}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{site?.name || '—'}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{getHazardType(habitation.primaryHazard)?.label}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{habitation.risk.status}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{route ? `${route.distanceKm} km` : '—'}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{(op.relocatedCount || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{progressPct}%</td>
                    <td className="px-4 py-4">
                      <Badge tone={STATUS_TONE[op.status] || 'default'}>{op.status}</Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400 dark:text-slate-500">{new Date(op.updatedAt).toLocaleString('en-GB')}</td>
                    <td className="px-4 py-4 text-right">
                      <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Resource Availability</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Emergency coordinators, volunteers, transport and infrastructure available for assignment — click any row for its full portal-entered profile.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ResourceBox
          icon={UserCog}
          title="Emergency Coordinators"
          columns={COORDINATOR_COLUMNS}
          records={coordinatorRecords}
          selectedId={selectedResource?.category === 'Emergency Coordinator' ? selectedResource.id : null}
          onRowClick={setSelectedResource}
          pdfLoading={pdfLoadingKey === 'coordinators'}
          pdfError={pdfErrors.coordinators}
          onDownloadPdf={() => downloadCategoryPdf('coordinators', 'Emergency Coordinators', COORDINATOR_COLUMNS, coordinatorRecords)}
        />
        <ResourceBox
          icon={Users}
          title="Volunteers"
          columns={VOLUNTEER_COLUMNS}
          records={volunteerRecords}
          selectedId={selectedResource?.category === 'Volunteer' ? selectedResource.id : null}
          onRowClick={setSelectedResource}
          pdfLoading={pdfLoadingKey === 'volunteers'}
          pdfError={pdfErrors.volunteers}
          onDownloadPdf={() => downloadCategoryPdf('volunteers', 'Volunteers', VOLUNTEER_COLUMNS, volunteerRecords)}
        />
        <ResourceBox
          icon={Truck}
          title="Transport"
          columns={TRANSPORT_COLUMNS}
          records={transportRecords}
          selectedId={selectedResource?.category === 'Transport' ? selectedResource.id : null}
          onRowClick={setSelectedResource}
          emptyMessage={TRANSPORT_UNAVAILABLE_MESSAGE}
          pdfLoading={pdfLoadingKey === 'transport'}
          pdfError={pdfErrors.transport}
          onDownloadPdf={() => downloadCategoryPdf('transport', 'Transport', TRANSPORT_COLUMNS, transportRecords, TRANSPORT_UNAVAILABLE_MESSAGE)}
        />
        <ResourceBox
          icon={Building2}
          title="Infrastructure"
          columns={INFRASTRUCTURE_COLUMNS}
          records={infrastructureRecords}
          selectedId={selectedResource?.category === 'Infrastructure' ? selectedResource.id : null}
          onRowClick={setSelectedResource}
          emptyMessage={INFRASTRUCTURE_EMPTY_MESSAGE}
          pdfLoading={pdfLoadingKey === 'infrastructure'}
          pdfError={pdfErrors.infrastructure}
          onDownloadPdf={() => downloadCategoryPdf('infrastructure', 'Infrastructure', INFRASTRUCTURE_COLUMNS, infrastructureRecords, INFRASTRUCTURE_EMPTY_MESSAGE)}
        />
      </div>

      <ResourceDetailsDrawer
        record={selectedResource}
        onClose={() => setSelectedResource(null)}
        pdfLoading={!!selectedResource && pdfLoadingKey === `detail-${selectedResource.id}`}
        pdfError={selectedResource ? pdfErrors[`detail-${selectedResource.id}`] : null}
        onDownloadPdf={() => selectedResource && downloadDetailPdf(selectedResource)}
      />

      <DemoToast message={toast} onDismiss={() => setToast('')} />
    </div>
  )
}

function ReportSection({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2.5">{title}</h4>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  )
}

function ReportStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">{label}</div>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={typeof value === 'string' ? value : undefined}>
        {value}
      </div>
    </div>
  )
}

