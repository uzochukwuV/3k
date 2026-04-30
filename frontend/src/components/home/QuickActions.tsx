import { Send, QrCode, Download, MoreHorizontal } from 'lucide-react'

interface QuickActionsProps {
  onSend: () => void
  onRequest: () => void
  onScan?: () => void
}

const actions = (onSend: () => void, onRequest: () => void) => [
  {
    label: 'Send',
    icon: Send,
    onClick: onSend,
    gradient: 'from-brand-500 to-brand-600',
    shadow: 'shadow-[0_4px_20px_rgba(48,116,253,0.4)]',
    glow: true,
  },
  {
    label: 'Request',
    icon: QrCode,
    onClick: onRequest,
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-[0_4px_20px_rgba(16,185,129,0.3)]',
    glow: false,
  },
  {
    label: 'Receive',
    icon: Download,
    onClick: onRequest,
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-[0_4px_20px_rgba(139,92,246,0.3)]',
    glow: false,
  },
  {
    label: 'More',
    icon: MoreHorizontal,
    onClick: () => {},
    gradient: 'from-slate-600 to-slate-700',
    shadow: '',
    glow: false,
  },
]

export default function QuickActions({ onSend, onRequest }: QuickActionsProps) {
  const items = actions(onSend, onRequest)

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(({ label, icon: Icon, onClick, gradient, shadow }) => (
        <button
          key={label}
          onClick={onClick}
          className="flex flex-col items-center gap-2.5 group"
        >
          <div
            className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} ${shadow}
              flex items-center justify-center
              transition-all duration-200
              group-hover:scale-110 group-hover:brightness-110
              group-active:scale-95`}
          >
            <Icon className="h-5.5 w-5.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
