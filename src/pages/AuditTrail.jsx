import { History, User } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import { useAppState } from '../state/AppStateContext'

const SEVERITY_BADGE = { critical: 'danger', warning: 'warning', info: 'blue' }

export default function AuditTrail() {
  const { auditEvents } = useAppState()

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2.5">
        <History size={22} className="text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Decision Audit Trail</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Frontend prototype audit log — not a real government audit or compliance system.</p>
        </div>
      </div>

      <DataStatusPanel />

      <div className="relative pl-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-5">
          {auditEvents.map((a) => (
            <div key={a.id} className="relative">
              <div className={`absolute -left-8 top-1.5 h-6 w-6 rounded-full border-4 border-white dark:border-slate-950 shadow flex items-center justify-center ${a.severity === 'critical' ? 'bg-red-600' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{a.timestamp}</span>
                  <Badge tone={SEVERITY_BADGE[a.severity] || 'default'}>{a.severity}</Badge>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">{a.type}</h3>
                {(a.previousValue || a.newValue) && (
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-1.5">
                    {a.previousValue && <span className="text-slate-400 dark:text-slate-500">{a.previousValue}</span>}
                    {a.previousValue && a.newValue && <span className="mx-1.5">→</span>}
                    {a.newValue && <b>{a.newValue}</b>}
                  </div>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{a.reason}</p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <User size={12} /> {a.actor}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
