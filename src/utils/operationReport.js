// Builds a standalone, printable HTML report for exactly one operation —
// used by Operation Management's "Download Report" action. There is no PDF
// library in this project and no paid report-generation service is wired up,
// so this produces a downloadable, GeoSentra-branded HTML file the browser
// can open or print-to-PDF, instead of adding a new dependency for one
// button. Every field falls back to an explicit "Not available" rather than
// a fabricated value — this project has no vehicle-assignment or live
// team-location data at all, so those fields always read "Not available".
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
}

const naText = (value) => (value === null || value === undefined || value === '' ? 'Not available' : escapeHtml(value))

function statCard(label, value) {
  return `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value">${value}</div></div>`
}

/**
 * @param {Object} row - one Operation Management row: { op, habitation, site, coordinator, assignedVolunteers, route, stats }
 */
export function buildOperationReportHtml({ op, habitation, site, coordinator, assignedVolunteers = [], route, stats }) {
  const remaining = Math.max(0, (op.populationRequiring || 0) - (op.relocatedCount || 0))
  const progressPct = op.populationRequiring > 0 ? Math.round(((op.relocatedCount || 0) / op.populationRequiring) * 100) : 0
  const generatedAt = new Date().toLocaleString()

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Operation ${escapeHtml(op.id)} Report</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #f8fafc; }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .brand .badge { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg,#3b82f6,#22d3ee); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px; }
  .brand .name { font-size: 21px; font-weight: 800; letter-spacing: -0.02em; }
  .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 22px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 8px; }
  .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 15px; background: #fff; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 700; margin-bottom: 3px; }
  .value { font-size: 14px; font-weight: 700; color: #0f172a; }
  .section-title { font-size: 14px; font-weight: 800; margin: 26px 0 10px; color: #1e3a8a; }
  .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5; }
  @media print { body { background: #fff; padding: 12px; } }
</style>
</head>
<body>
  <div class="brand"><div class="badge">GS</div><div class="name">GEOSENTRA</div></div>
  <div class="subtitle">Disaster Management of India &middot; Operation Report (Frontend Prototype Data)</div>
  <h1>Operation ${escapeHtml(op.id)} &mdash; ${escapeHtml(habitation.name)}</h1>
  <div class="meta">Generated ${escapeHtml(generatedAt)}</div>

  <div class="section-title">Operation Details</div>
  <div class="grid">
    ${statCard('Status', escapeHtml(op.status))}
    ${statCard('Current Progress', `${progressPct}% relocated`)}
    ${statCard('Assignment Date/Time', escapeHtml(new Date(op.createdAt).toLocaleString()))}
    ${statCard('Last Updated', escapeHtml(new Date(op.updatedAt).toLocaleString()))}
    ${statCard('Hazard Type', escapeHtml(habitation.primaryHazard))}
    ${statCard('Hazard Severity', escapeHtml(habitation.risk.status))}
    ${statCard('Source Habitation', `${escapeHtml(habitation.name)}, ${escapeHtml(habitation.district)}`)}
    ${statCard('Destination Safe Site', site ? `${escapeHtml(site.name)}, ${escapeHtml(site.district)}` : 'Not selected')}
  </div>

  <div class="section-title">Assigned Team</div>
  <div class="grid">
    ${statCard('Coordinator', naText(coordinator?.name))}
    ${statCard('Volunteers', assignedVolunteers.length ? escapeHtml(assignedVolunteers.map((v) => v.name).join(', ')) : 'None assigned')}
    ${statCard('Team Availability', naText(coordinator?.status))}
    ${statCard('Current Team Location', 'Not available — live location tracking is not supported by this dataset')}
  </div>

  <div class="section-title">Rescue / Relocation Details</div>
  <div class="grid">
    ${statCard('People Reallocated', (op.relocatedCount || 0).toLocaleString())}
    ${statCard('Total Affected People', (op.populationRequiring || 0).toLocaleString())}
    ${statCard('People Remaining', remaining.toLocaleString())}
    ${statCard('Vehicle Used', 'Not available')}
  </div>

  <div class="section-title">Route Information</div>
  <div class="grid">
    ${statCard('Route Distance', route ? `${route.distanceKm} km` : 'Not available')}
    ${statCard('Estimated Travel Time', stats ? `${stats.timeMin} min` : 'Not available')}
    ${statCard('Hazard Exposure', escapeHtml(stats?.dominantHazardLabel || 'No hazard exposure detected'))}
    ${statCard('Route Status', naText(op.routeStatus))}
  </div>

  <div class="footer">
    This report reflects frontend prototype/demo data only. Route geometry is illustrative (not a live routing engine),
    and no real transport, shelter-management or notification backend was queried to produce it.
  </div>
</body>
</html>`
}

/** Triggers a browser download of the report as a standalone .html file. */
export function downloadOperationReport(row) {
  const html = buildOperationReportHtml(row)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `operation-${row.op.id}-report.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
