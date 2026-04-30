import type { PaymentStatus } from '../../types'

const statusConfig: Record<PaymentStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  confirmed: { label: 'Confirmed', classes: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  completed: { label: 'Completed', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  failed: { label: 'Failed', classes: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
}

interface StatusBadgeProps {
  status: PaymentStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      {status === 'pending' && (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      {config.label}
    </span>
  )
}
