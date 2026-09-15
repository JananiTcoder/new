import { ShieldCheck, ShieldAlert, ShieldX, Clock3 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useProviderAuth } from '../../provider/ProviderAuthContext'
import { useProviderData } from '../../provider/providerStore'
import { VERIFICATION_STATUS } from '../../types/provider'
import { dataStatusLabel, isStale } from '../../provider/capacityService'

const STATUS_META = {
  [VERIFICATION_STATUS.VERIFIED]: { tone: 'good', icon: ShieldCheck, desc: 'Your submission has been reviewed and marked as verified by the Disaster Authority (demo review — not a real government verification).' },
  [VERIFICATION_STATUS.PENDING]: { tone: 'warning', icon: Clock3, desc: 'Your submission is waiting for Disaster Authority review. Capacity data still appears elsewhere as self-reported/awaiting verification.' },
  [VERIFICATION_STATUS.NEEDS_CORRECTION]: { tone: 'warning', icon: ShieldAlert, desc: 'The Disaster Authority has asked for a correction before this submission can be verified — see the note below.' },
  [VERIFICATION_STATUS.REJECTED]: { tone: 'danger', icon: ShieldX, desc: 'This submission was rejected and is excluded from active capacity totals until resubmitted.' },
}

export default function ProviderSubmissions() {
  const { provider } = useProviderAuth()
  const { getCapacity } = useProviderData()
  const capacity = getCapacity(provider.id)
  const meta = STATUS_META[provider.verificationStatus]
  const Icon = meta.icon

  return (
    <div className="p-4 lg:p-8 max-w-[700px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Submission Status</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track how your registration and capacity submission are being reviewed.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${meta.tone === 'good' ? 'bg-emerald-50 dark:bg-emerald-500/10' : meta.tone === 'danger' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
            <Icon size={20} className={meta.tone === 'good' ? 'text-emerald-600 dark:text-emerald-400' : meta.tone === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'} />
          </div>
          <div>
            <Badge tone={meta.tone}>{provider.verificationStatus}</Badge>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{meta.desc}</p>
        {provider.verificationNote && (
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Note from review: </span>
            {provider.verificationNote}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Data Status</h2>
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Capacity submitted</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{capacity ? 'Yes' : 'No — not yet submitted'}</dd>
          </div>
          {capacity && (
            <>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Transparency label</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{dataStatusLabel(provider)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Last updated</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{new Date(capacity.lastUpdated).toLocaleString('en-GB')}</dd>
              </div>
              {isStale(capacity.lastUpdated) && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-400">
                  Capacity information may be outdated.
                </div>
              )}
            </>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Registered on</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{new Date(provider.createdAt).toLocaleDateString('en-GB')}</dd>
          </div>
        </dl>
      </Card>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Prototype data. Provider-submitted information must be verified before operational use.
      </p>
    </div>
  )
}
