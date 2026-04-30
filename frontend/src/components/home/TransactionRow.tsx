import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import Avatar from '../shared/Avatar'
import StatusBadge from '../shared/StatusBadge'
import { formatAmount, formatRelativeTime, getDisplayName } from '../../utils/format'
import type { Transaction } from '../../types'

interface TransactionRowProps {
  tx: Transaction
  currentUserEmail?: string
  showDate?: boolean
  onClick?: () => void
  compact?: boolean
}

export default function TransactionRow({
  tx,
  onClick,
  compact = false,
}: TransactionRowProps) {
  const isSent = tx.type === 'sent'
  const counterpartyEmail = isSent ? tx.recipientEmail : tx.senderEmail
  const displayName = getDisplayName(counterpartyEmail)

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5
        rounded-2xl hover:bg-white/4 active:bg-white/6
        transition-all duration-150 text-left
        ${compact ? 'py-3 px-3' : 'py-3.5 px-4'}
        group`}
    >
      {/* Avatar */}
      <Avatar email={counterpartyEmail} size={compact ? 'sm' : 'md'} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-semibold text-white text-sm truncate">{displayName}</p>
          {tx.status === 'pending' && <StatusBadge status="pending" />}
        </div>
        <p className="text-xs text-slate-500 truncate">
          {tx.memo ? tx.memo : isSent ? `You paid ${displayName}` : `${displayName} paid you`}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">{formatRelativeTime(tx.createdAt)}</p>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-right flex items-center gap-2">
        <div>
          <p
            className={`font-bold text-sm ${
              isSent ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isSent ? '-' : '+'}${formatAmount(tx.amount)}
          </p>
          <p className="text-[10px] text-slate-600">{tx.token}</p>
        </div>
        <div
          className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0
            ${isSent ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}
        >
          {isSent ? (
            <ArrowUpRight className="h-3 w-3 text-rose-400" />
          ) : (
            <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
          )}
        </div>
      </div>
    </button>
  )
}
