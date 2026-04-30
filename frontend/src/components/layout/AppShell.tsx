import type { ReactNode } from 'react'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-navy-950">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 pt-20 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
