import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Clock, Wallet, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/activity', label: 'Activity', icon: Clock },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40
      bg-navy-950/95 backdrop-blur-xl border-t border-white/5
      safe-area-pb">
      <div className="mx-auto max-w-2xl flex">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 transition-all
                ${isActive ? 'text-brand-400' : 'text-slate-600 hover:text-slate-400'}`}
              aria-label={label}
            >
              <div className={`relative flex items-center justify-center
                h-8 w-8 rounded-xl transition-all duration-200
                ${isActive ? 'bg-brand-500/15' : 'bg-transparent'}`}>
                <Icon
                  className={`h-4.5 w-4.5 transition-all ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2
                    h-1 w-1 rounded-full bg-brand-400" />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${
                isActive ? 'text-brand-400' : 'text-slate-600'
              }`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
