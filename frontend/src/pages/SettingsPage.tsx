import { Bell, Copy, ExternalLink, LogOut, Moon, Shield, SlidersHorizontal, Wallet } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { formatAddress } from '../utils/format'

const SETTING_GROUPS = [
  {
    title: 'Preferences',
    items: [
      { label: 'Dark Mode', value: 'On', icon: Moon },
      { label: 'Notifications', value: 'Payments only', icon: Bell },
      { label: 'Payment Limits', value: '$1,000 daily', icon: SlidersHorizontal },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Self Custody', value: 'Enabled', icon: Shield },
      { label: 'Network', value: 'QIE Network', icon: Wallet },
    ],
  },
]

export default function SettingsPage() {
  const { address, disconnect } = useWallet()

  const copyAddress = async () => {
    if (address) await navigator.clipboard.writeText(address)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Wallet, security, and app preferences</p>
      </div>

      <section className="rounded-2xl bg-navy-800 border border-white/10 p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/15 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-brand-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Connected Wallet</p>
            <p className="font-mono text-xs text-slate-500">{formatAddress(address ?? '')}</p>
          </div>
          <button
            onClick={copyAddress}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Copy wallet address"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </section>

      {SETTING_GROUPS.map((group) => (
        <section key={group.title} className="rounded-2xl bg-navy-800 border border-white/10 overflow-hidden shadow-card">
          <div className="border-b border-white/5 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{group.title}</h2>
          </div>
          <div className="divide-y divide-white/5">
            {group.items.map(({ label, value, icon: Icon }) => (
              <button
                key={label}
                className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <span className="flex-1 text-sm font-medium text-white">{label}</span>
                <span className="text-xs text-slate-500">{value}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl bg-navy-800 border border-white/10 overflow-hidden shadow-card">
        <button className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-white/5 transition-colors">
          <ExternalLink className="h-4 w-4 text-slate-400" />
          <span className="flex-1 text-sm font-medium text-white">View on Explorer</span>
          <span className="text-xs text-slate-500">Open</span>
        </button>
        <button
          onClick={disconnect}
          className="flex w-full items-center gap-3 border-t border-white/5 px-4 py-4 text-left text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Disconnect Wallet</span>
        </button>
      </section>
    </div>
  )
}
