import { Download, Loader2, AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

// Shared detail panel for all four resource types — opened when a row in
// any ResourceBox is clicked. Renders every field the selected record
// carries (built in utils/operationResources.js from real portal-entered
// data), never a generic/hardcoded profile.
export default function ResourceDetailsDrawer({ record, onClose, pdfLoading, pdfError, onDownloadPdf }) {
  return (
    <Modal open={!!record} onClose={onClose} side title={record?.category || 'Resource Details'}>
      {record && (
        <div className="space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-1">{record.category}</p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{record.name}</h4>
            {record.statusLabel && (
              <Badge tone={record.statusTone || 'default'} className="mt-2">
                {record.statusLabel}
              </Badge>
            )}
          </div>

          <Button size="sm" variant="secondary" className="w-full" disabled={pdfLoading} onClick={onDownloadPdf}>
            {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Selected Resource PDF
          </Button>

          {pdfError && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs px-3 py-2">
              <AlertTriangle size={12} /> {pdfError}
            </div>
          )}

          <div className="rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {record.fields.map((f) => (
              <div key={f.label} className="grid grid-cols-2 gap-3 px-3.5 py-2.5 text-sm">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wide self-center">{f.label}</span>
                <span className="text-slate-800 dark:text-slate-200 text-right break-words">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
