import { Compass } from 'lucide-react'

const ICON_SIZE = { sm: 16, md: 18, lg: 22 }
const BOX_SIZE = { sm: 'h-8 w-8', md: 'h-8 w-8', lg: 'h-11 w-11' }
const NAME_SIZE = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }

// Single source of truth for the GEOSENTRA brand lockup (icon + wordmark +
// "Disaster Management of India" subtitle) so every header/sidebar/login
// location stays in sync instead of duplicating the subtitle by hand.
export default function Brand({ size = 'md', collapsed = false, iconGradient = 'from-blue-500 to-cyan-400', className = '', nameClassName = '', extra }) {
  const iconSize = ICON_SIZE[size]
  const boxSize = BOX_SIZE[size]
  const nameSize = NAME_SIZE[size]

  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`} title="GEOSENTRA — Disaster Management of India" aria-label="GEOSENTRA, Disaster Management of India">
        <div className={`${boxSize} rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center shrink-0`}>
          <Compass size={iconSize} className="text-white" strokeWidth={2.4} />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <div className={`${boxSize} rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center shrink-0`}>
        <Compass size={iconSize} className="text-white" strokeWidth={2.4} />
      </div>
      <div className="min-w-0 leading-tight">
        <div className={`font-bold text-slate-900 dark:text-white tracking-tight truncate ${nameSize} ${nameClassName}`}>GEOSENTRA</div>
        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide truncate">Disaster Management of India</div>
        {extra}
      </div>
    </div>
  )
}
