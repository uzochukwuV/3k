import { Bell, ChevronDown } from 'lucide-react'
import { useWallet } from '../../context/WalletContext'
import { formatAddress } from '../../utils/format'

interface TopBarProps {
  onNotificationClick?: () => void
}

export default function TopBar({ onNotificationClick }: TopBarProps) {
  const { address } = useWallet()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16
      bg-navy-950/90 backdrop-blur-xl
      border-b border-white/5">
      <div className="mx-auto max-w-2xl h-full flex items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-white" aria-hidden="true">
              <path
                d="M10 2L3 7v6l7 5 7-5V7L10 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M10 8v4M8 10h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">QIE Pay</span>
        </div>

        {/* Right: notifications + address pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNotificationClick}
            className="relative h-9 w-9 rounded-full flex items-center justify-center
              text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" strokeWidth={1.8} />
            {/* Badge */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 border border-navy-950" />
          </button>

          {address && (
            <button className="flex items-center gap-1.5 rounded-full bg-white/6 border border-white/8
              px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {formatAddress(address)}
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
