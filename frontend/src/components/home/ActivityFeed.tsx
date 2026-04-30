import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight } from 'lucide-react'
import TransactionRow from './TransactionRow'
import type { Transaction } from '../../types'

interface ActivityFeedProps {
  transactions: Transaction[]
  limit?: number
}

export default function ActivityFeed({ transactions, limit = 5 }: ActivityFeedProps) {
  const navigate = useNavigate()
  const visible = transactions.slice(0, limit)

  return (
    <div className="rounded-3xl bg-navy-800 border border-white/6 overflow-hidden shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
          <span className="font-semibold text-white text-sm">Recent Activity</span>
        </div>
        <button
          onClick={() => navigate('/activity')}
          className="flex items-center gap-0.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
        >
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Transactions */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center px-4">
          <div className="h-12 w-12 rounded-2xl bg-white/4 flex items-center justify-center mb-3">
            <Clock className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-500">No transactions yet</p>
          <p className="text-xs text-slate-600 mt-1">Start by sending your first payment</p>
        </div>
      ) : (
        <div className="divide-y divide-white/4">
          {visible.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} compact />
          ))}
        </div>
      )}
    </div>
  )
}
