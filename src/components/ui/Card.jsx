export default function Card({ children, className = '', hover = false, as: Component = 'div', ...props }) {
  return (
    <Component
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm shadow-slate-900/[0.03] dark:shadow-none ${
        hover
          ? 'transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/[0.06] dark:hover:shadow-none hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-500/40'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
