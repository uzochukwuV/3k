import { Wallet, Shield, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import { useWallet } from '../../context/WalletContext'

const FEATURES = [
  {
    icon: Zap,
    title: 'Pay by Email',
    desc: 'Send crypto to anyone with just an email address',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Earn Yield',
    desc: 'Your savings automatically earn interest on-chain',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Shield,
    title: 'Self-Custodial',
    desc: 'Your keys, your funds — always in your control',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
]

export default function ConnectScreen() {
  const { connect, isConnecting } = useWallet()

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Background glow */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-96
        bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm">
            <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5 text-white" aria-hidden="true">
              <path d="M10 2L3 7v6l7 5 7-5V7L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M10 8v4M8 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg">QIE Pay</span>
        </div>
        <span className="text-xs text-slate-500 bg-white/4 border border-white/8 px-3 py-1.5 rounded-full">
          QIE Network
        </span>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-12">
        {/* Logo ring */}
        <div className="relative mb-8">
          <div className="h-24 w-24 rounded-3xl bg-brand-gradient shadow-glow flex items-center justify-center mx-auto">
            <svg viewBox="0 0 40 40" fill="none" className="h-12 w-12 text-white" aria-hidden="true">
              <path d="M20 4L6 14v12l14 10 14-10V14L20 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M20 16v8M16 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-3xl bg-brand-gradient opacity-30 blur-xl -z-10" />
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
          Your Web3 Wallet
        </h1>
        <p className="text-slate-400 text-lg max-w-xs leading-relaxed mb-10">
          Send, receive, and save — all on-chain, with the simplicity of a payment app.
        </p>

        {/* Connect button */}
        <button
          onClick={connect}
          disabled={isConnecting}
          className="group flex items-center gap-3 rounded-2xl bg-brand-gradient
            px-8 py-4 font-semibold text-white text-base
            shadow-glow hover:shadow-[0_0_80px_rgba(48,116,253,0.35)]
            transition-all duration-300 hover:scale-105 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
            disabled:hover:shadow-glow mb-3"
        >
          <Wallet className="h-5 w-5" />
          {isConnecting ? (
            <>
              <svg className="h-4 w-4 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              Connecting…
            </>
          ) : (
            <>
              Connect MetaMask
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <p className="text-xs text-slate-600">No account needed · Non-custodial · Zero fees</p>
      </div>

      {/* Feature cards */}
      <div className="relative z-10 px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="rounded-2xl bg-navy-800 border border-white/6 p-4
                hover:border-white/12 transition-all"
            >
              <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-4.5 w-4.5 ${color}`} strokeWidth={1.8} />
              </div>
              <p className="font-semibold text-white text-sm mb-1">{title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
