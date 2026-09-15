const VARIANTS = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/25 focus-visible:ring-blue-300',
  secondary:
    'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 focus-visible:ring-blue-200',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 focus-visible:ring-slate-200',
  dark:
    'bg-slate-900 text-white hover:bg-slate-800 shadow-sm focus-visible:ring-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/25 focus-visible:ring-red-300',
}

const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3.5 gap-2.5',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
