import { useState, useMemo } from 'react'
import { Search, Download, Clock } from 'lucide-react'
import TransactionRow from '../components/home/TransactionRow'
import { MOCK_TRANSACTIONS } from '../data/mockData'
import { groupTransactionsByDate } from '../utils/format'
import type { Transaction } from '../types'

type FilterType = 'all' | 'sent' | 'received'

export default function ActivityPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo<Transaction[]>(() => {
    let txns = MOCK_TRANSACTIONS
    if (filter !== 'all') txns = txns.filter((t) => t.type === filter)
    if (search.trim()) {
      const s = search.toLowerCase()
      txns = txns.filter(
        (t) =>
          t.senderEmail.toLowerCase().includes(s) ||
          t.recipientEmail.toLowerCase().includes(s) ||
          (t.memo ?? '').toLowerCase().includes(s) ||
          t.amount.toString().includes(s)
      )
    }
    return txns
  }, [filter, search])

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered])

  const totalReceived = MOCK_TRANSACTIONS.filter((t) => t.type === 'received' && t.status !== 'failed')
    .reduce((s, t) => s + t.amount, 0)
  const totalSent = MOCK_TRANSACTIONS.filter((t) => t.type === 'sent' && t.status !== 'failed')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Activity</h1>
          <p className="text-sm text-slate-500">Your transaction history</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white
          bg-white/4 border border-white/8 rounded-xl px-3 py-2 transition-colors">
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/15 p-4">
          <p className="text-xs text-emerald-500/70 mb-1 uppercase tracking-wider">Total Received</p>
          <p className="text-xl font-extrabold text-emerald-400">
            +${totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-500/60 mt-0.5">USDC</p>
        </div>
        <div className="rounded-2xl bg-rose-500/8 border border-rose-500/15 p-4">
          <p className="text-xs text-rose-500/70 mb-1 uppercase tracking-wider">Total Sent</p>
          <p className="text-xl font-extrabold text-rose-400">
            -${totalSent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-rose-500/60 mt-0.5">USDC</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search payments…"
          className="w-full bg-navy-800 border border-white/8 rounded-2xl
            pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600
            focus:outline-none focus:border-brand-500/50 transition-all"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex bg-navy-800 rounded-xl p-1 gap-1 border border-white/6">
        {(['all', 'sent', 'received'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${filter === f
                ? 'bg-navy-700 text-white shadow-sm border border-white/8'
                : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            {f === 'all' ? 'All' : f === 'sent' ? 'Sent' : 'Received'}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/4 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-slate-600" />
          </div>
          <p className="font-semibold text-slate-500">No transactions found</p>
          <p className="text-sm text-slate-600 mt-1">Try a different filter or search term</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, txns]) => (
            <div key={date}>
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wider mb-2 px-1">{date}</p>
              <div className="rounded-3xl bg-navy-800 border border-white/6 overflow-hidden divide-y divide-white/4">
                {(txns as Transaction[]).map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
