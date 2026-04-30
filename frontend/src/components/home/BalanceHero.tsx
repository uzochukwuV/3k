import { useState } from 'react'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { formatAmount } from '../../utils/format'
import type { WalletBalance } from '../../types'

interface BalanceHeroProps {
  balance: WalletBalance
  address: string
}

export default function BalanceHero({ balance, address }: BalanceHeroProps) {
  const [hidden, setHidden] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortAddr = `${address.slice(0, 6)}…${address.slice(-4)}`
  const mask = '••••••'

  return (
    <div className="relative rounded-3xl overflow-hidden bg-navy-800 border border-white/8 p-6 shadow-card">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-glow opacity-80 pointer-events-none" />
      <div className="absolute top-0 right-0 h-48 w-48 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Label row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500 tracking-widest uppercase">
            Total Balance
          </span>
          <button
            onClick={() => setHidden((h) => !h)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/6 transition-colors"
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Main balance */}
        <div className="flex items-end gap-2 mb-1">
          <span className="text-5xl font-extrabold text-white tracking-tight leading-none">
            {hidden ? mask : `$${formatAmount(balance.total)}`}
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-6">{balance.token} · QIE Network</p>

        {/* Sub-buckets */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-2xl bg-white/4 border border-white/6 px-3 py-3">
            <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Available</p>
            <p className="text-base font-bold text-white">
              {hidden ? mask : `$${formatAmount(balance.available)}`}
            </p>
            <p className="text-[10px] text-emerald-500 mt-0.5">Ready to send</p>
          </div>
          <div className="rounded-2xl bg-white/4 border border-white/6 px-3 py-3">
            <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Savings</p>
            <p className="text-base font-bold text-white">
              {hidden ? mask : `$${formatAmount(balance.savings)}`}
            </p>
            <p className="text-[10px] text-blue-400 mt-0.5">Earning yield</p>
          </div>
          <div className="rounded-2xl bg-white/4 border border-white/6 px-3 py-3">
            <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Goal Lock</p>
            <p className="text-base font-bold text-white">
              {hidden ? mask : `$${formatAmount(balance.goalLock)}`}
            </p>
            <p className="text-[10px] text-violet-400 mt-0.5">Locked</p>
          </div>
        </div>

        {/* Wallet address */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 w-full
            rounded-xl bg-white/4 border border-white/8 px-3.5 py-2.5
            hover:bg-white/8 transition-colors group"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="font-mono text-xs text-slate-400 flex-1 text-left">{shortAddr}</span>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
          )}
          <span className="text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>
    </div>
  )
}
