import { Check } from 'lucide-react'
import { planningStepIndex } from '../../utils/assignmentCalculations'

const STEPS = ['Habitation', 'Safe Site', 'Infrastructure', 'Rescue Team', 'Route', 'Validation', 'Assignment']

/**
 * Step indicator for the guided Relocation workflow: Habitation -> Safe Site
 * -> Infrastructure -> Rescue Team -> Route -> Validation -> Assignment.
 * Renders on every step page for an in-progress operation so the user always
 * knows where they are and what's already done.
 */
export default function AssignmentBreadcrumb({ operation, className = '' }) {
  const currentIndex = planningStepIndex(operation)
  return (
    <div className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold ${className}`}>
      {STEPS.map((label, i) => {
        const done = currentIndex > i || (i === 0 && !!operation)
        const active = currentIndex === i
        return (
          <span key={label} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300 dark:text-slate-700">→</span>}
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                active
                  ? 'bg-blue-600 text-white'
                  : done
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {done && !active && <Check size={11} strokeWidth={3} />}
              {label}
            </span>
          </span>
        )
      })}
    </div>
  )
}
