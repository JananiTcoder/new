import { Download, Loader2, AlertTriangle, ChevronRight, Inbox } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

// One of the four Authority Operations resource boxes (Emergency
// Coordinators / Volunteers / Transport / Infrastructure). Deliberately
// generic — columns/records come from utils/operationResources.js so the
// same box renders every resource type without four separate
// implementations.
export default function ResourceBox({
  icon: Icon,
  title,
  columns,
  records,
  selectedId,
  onRowClick,
  emptyMessage = 'No records are available for this category.',
  pdfLoading,
  pdfError,
  onDownloadPdf,
}) {
  return (
    <Card className="p-5 flex flex-col min-w-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Icon size={16} className="text-blue-600 dark:text-blue-400" /> {title}
          <Badge tone="default" className="ml-1">
            {records.length}
          </Badge>
        </h3>
        <Button size="sm" variant="secondary" disabled={pdfLoading} onClick={onDownloadPdf}>
          {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download as PDF
        </Button>
      </div>

      {pdfError && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs px-3 py-2">
          <AlertTriangle size={12} /> {pdfError}
        </div>
      )}

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
          <Inbox size={22} className="text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const isSelected = selectedId === record.id
                return (
                  <tr
                    key={record.id}
                    onClick={() => onRowClick(record)}
                    className={`border-b border-slate-50 dark:border-slate-800/60 last:border-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-blue-50/50 dark:hover:bg-blue-500/5'
                    }`}
                  >
                    {columns.map((col, idx) => (
                      <td key={col.key} className="px-3 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap max-w-[220px] truncate" title={record.cells[col.key]}>
                        {idx === 0 ? <span className="font-semibold text-blue-700 dark:text-blue-400 hover:underline">{record.cells[col.key]}</span> : record.cells[col.key]}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right">
                      <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
