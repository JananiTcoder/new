import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, wide = false, side = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  if (side) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] animate-fade-up" onClick={onClose} />
        <div className="relative h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-[slideIn_0.3s_ease-out]">
          <ModalHeader title={title} onClose={onClose} />
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-fade-up`}
      >
        <ModalHeader title={title} onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <button
        onClick={onClose}
        className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}
