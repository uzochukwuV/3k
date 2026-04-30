import { useState } from 'react'
import { Check, ChevronRight, Lock, Save, TrendingUp, Zap } from 'lucide-react'
import { MOCK_BALANCE, MOCK_SPLIT_CONFIG, PERIOD_OPTIONS, SPLIT_PRESETS } from '../data/mockData'
import { formatAmount } from '../utils/format'
import type { SplitConfig, WalletBalance } from '../types'

const BUCKET_CONFIG = [
  {
    key: 'available' as keyof WalletBalance,
    pctKey: 'availablePct' as keyof SplitConfig,
    label: 'Available',
    sublabel: 'Ready to send',
    icon: Zap,
    color: 'text-brand-300',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    accent: 'bg-brand-500',
    description: 'Liquid funds for payments and transfers.',
  },
  {
    key: 'savings' as keyof WalletBalance,
    pctKey: 'savingsPct' as keyof SplitConfig,
    label: 'Savings Vault',
    sublabel: 'Earning yield',
    icon: TrendingUp,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    accent: 'bg-emerald-500',
    description: 'Funds routed toward passive on-chain yield.',
  },
  {
    key: 'goalLock' as keyof WalletBalance,
    pctKey: 'goalLockPct' as keyof SplitConfig,
    label: 'Goal Lock',
    sublabel: 'Time locked',
    icon: Lock,
    color: 'text-violet-300',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    accent: 'bg-violet-500',
    description: 'Protected savings released on your schedule.',
  },
]

type PortfolioTab = 'overview' | 'split'

export default function PortfolioPage() {
  const [balance] = useState<WalletBalance>(MOCK_BALANCE)
  const [config, setConfig] = useState<SplitConfig>(MOCK_SPLIT_CONFIG)
  const [activeTab, setActiveTab] = useState<PortfolioTab>('overview')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const updatePct = (field: keyof SplitConfig, value: number) => {
    if (!field.toString().endsWith('Pct')) return

    const next = { ...config, [field]: value }
    const total = next.availablePct + next.savingsPct + next.goalLockPct
    const diff = 100 - total

    if (diff !== 0) {
      const fallback = field === 'availablePct' ? 'savingsPct' : 'availablePct'
      next[fallback] = Math.max(0, Math.min(100, next[fallback] + diff))
      next.goalLockPct = Math.max(0, 100 - next.availablePct - next.savingsPct)
    }

    setConfig(next)
    setIsSaved(false)
  }

  const applyPreset = (preset: (typeof SPLIT_PRESETS)[number]) => {
    setConfig((current) => ({
      ...current,
      availablePct: preset.available,
      savingsPct: preset.savings,
      goalLockPct: preset.goalLock,
    }))
    setIsSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setIsSaving(false)
    setIsSaved(true)
    window.setTimeout(() => setIsSaved(false), 2200)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Portfolio</h1>
        <p className="text-sm text-slate-500">${formatAmount(balance.total)} {balance.token} total</p>
      </div>

      <section className="rounded-2xl bg-navy-800 border border-white/10 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Portfolio</p>
            <p className="mt-1 text-3xl font-extrabold text-white">${formatAmount(balance.total)}</p>
            <p className="text-sm text-slate-500">{balance.token}</p>
          </div>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
            +3.2%
          </span>
        </div>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-navy-700 flex">
          {BUCKET_CONFIG.map(({ key, accent }) => (
            <div
              key={key}
              className={`h-full ${accent}`}
              style={{ width: `${((balance[key] as number) / balance.total) * 100}%` }}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {BUCKET_CONFIG.map(({ key, label, accent }) => (
            <div key={key} className="rounded-xl bg-white/5 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${accent}`} />
                <span className="truncate text-[10px] text-slate-500">{label}</span>
              </div>
              <p className="mt-1 text-sm font-bold text-white">${formatAmount(balance[key] as number)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex rounded-xl bg-navy-800 p-1 border border-white/10">
        {[
          { key: 'overview' as PortfolioTab, label: 'Overview' },
          { key: 'split' as PortfolioTab, label: 'Auto Split' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              activeTab === key ? 'bg-navy-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-3">
          {BUCKET_CONFIG.map(({ key, label, sublabel, icon: Icon, color, bg, border, description }) => {
            const amount = balance[key] as number
            const pct = (amount / balance.total) * 100

            return (
              <section key={key} className={`rounded-2xl bg-navy-800 border ${border} p-4 shadow-card`}>
                <div className="flex items-start gap-3">
                  <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-white">{label}</h2>
                        <p className="text-xs text-slate-500">{sublabel}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </div>
                    <p className="mt-3 text-2xl font-extrabold text-white">${formatAmount(amount)}</p>
                    <p className="mt-1 text-xs text-slate-500">{description}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-navy-700 overflow-hidden">
                      <div className={`h-full ${bg.replace('/10', '')}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl bg-navy-800 border border-white/10 p-4 shadow-card">
            <h2 className="font-semibold text-white">Split Incoming Payments</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose how new payments should be divided across your wallet buckets.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {SPLIT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm font-semibold text-white">{preset.name}</p>
                  <p className="text-xs text-slate-500">{preset.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-navy-800 border border-white/10 p-4 shadow-card space-y-5">
            {BUCKET_CONFIG.map(({ pctKey, label, icon: Icon, color }) => (
              <div key={pctKey}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{config[pctKey]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config[pctKey] as number}
                  onChange={(event) => updatePct(pctKey, Number(event.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-navy-800 border border-white/10 p-4 shadow-card">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Allowance</span>
                <input
                  type="number"
                  min="0"
                  value={config.allowanceAmount}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, allowanceAmount: Number(event.target.value) }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-navy-700 px-3 py-3 text-sm text-white outline-none focus:border-brand-500/60"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Period</span>
                <select
                  value={config.allowancePeriod}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, allowancePeriod: Number(event.target.value) }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-navy-700 px-3 py-3 text-sm text-white outline-none focus:border-brand-500/60"
                >
                  {PERIOD_OPTIONS.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
            >
              {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Split'}
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
