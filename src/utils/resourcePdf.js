// Shared PDF-generation utility for the Authority Operations resource
// sections (Emergency Coordinators / Volunteers / Transport / Infrastructure).
// Uses jsPDF + jspdf-autotable — the only PDF-capable dependency in this
// project (utils/operationReport.js predates this and still uses a
// print-to-PDF HTML fallback; this file is the real ".pdf" output the
// Authority Operations page needs). Every value rendered here comes from
// the caller (already-resolved app/provider state) — this file never
// invents a field or a row.
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND_BLUE = [37, 99, 235]
const SLATE = [71, 85, 105]
const LIGHT_SLATE = [148, 163, 184]

function drawHeader(doc, { category, subtitle }) {
  doc.setFillColor(...BRAND_BLUE)
  doc.roundedRect(14, 12, 10, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('GS', 19, 18.5, { align: 'center' })

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('GEOSENTRA', 28, 17)

  doc.setTextColor(...SLATE)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Disaster Management of India · Authority Operations', 28, 22)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(category, 14, 34)

  doc.setTextColor(...SLATE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, 14, 40)

  doc.setDrawColor(226, 232, 240)
  doc.line(14, 44, 196, 44)
  return 50
}

function drawFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setDrawColor(226, 232, 240)
    doc.line(14, pageHeight - 14, 196, pageHeight - 14)
    doc.setTextColor(...LIGHT_SLATE)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('GeoSentra — frontend prototype data. Not a verified government report.', 14, pageHeight - 9)
    doc.text(`Page ${i} of ${pageCount}`, 196, pageHeight - 9, { align: 'right' })
  }
}

/**
 * Builds and downloads a category-level PDF: one table listing every
 * resource of that type with every available field as a column.
 * @param {{ category: string, filename: string, columns: {label:string,key:string}[], rows: Object[], emptyMessage?: string }} opts
 */
export function downloadResourceListPdf({ category, filename, columns, rows, emptyMessage }) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const generatedAt = new Date().toLocaleString()
  const startY = drawHeader(doc, { category, subtitle: `Generated ${generatedAt} · ${rows.length} record${rows.length === 1 ? '' : 's'}` })

  if (rows.length === 0) {
    doc.setTextColor(...SLATE)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(emptyMessage || 'No records are available for this category.', 14, startY)
  } else {
    autoTable(doc, {
      startY,
      head: [columns.map((c) => c.label)],
      body: rows.map((row) => columns.map((c) => String(row[c.key] ?? 'Not available'))),
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59], lineColor: [226, 232, 240] },
      headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    })
  }

  drawFooter(doc)
  doc.save(filename)
}

/**
 * Builds and downloads a single-resource detail PDF (used by the resource
 * details drawer's "Download Selected Resource PDF" button).
 * @param {{ category: string, name: string, statusLabel?: string, filename: string, fields: {label:string,value:string}[] }} opts
 */
export function downloadResourceDetailPdf({ category, name, statusLabel, filename, fields }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const generatedAt = new Date().toLocaleString()
  let y = drawHeader(doc, { category, subtitle: `Generated ${generatedAt}` })

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(name || 'Selected Resource', 14, y)
  y += 5
  if (statusLabel) {
    doc.setTextColor(...SLATE)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(statusLabel, 14, y)
    y += 4
  }
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: fields.map((f) => [f.label, f.value ?? 'Not available']),
    styles: { fontSize: 9, cellPadding: 2.6, textColor: [30, 41, 59], lineColor: [226, 232, 240] },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    margin: { left: 14, right: 14 },
  })

  drawFooter(doc)
  doc.save(filename)
}

/** Slugifies a resource/category name into a safe PDF filename fragment. */
export function slugForFilename(value) {
  return String(value || 'resource')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
