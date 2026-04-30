import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import BalanceHero from '../components/home/BalanceHero'
import QuickActions from '../components/home/QuickActions'
import ActivityFeed from '../components/home/ActivityFeed'
import SendModal from '../components/send/SendModal'
import RequestModal from '../components/request/RequestModal'
import { MOCK_BALANCE, MOCK_TRANSACTIONS } from '../data/mockData'
import type { WalletBalance, SendPaymentData } from '../types'

export default function HomePage() {
  const { address } = useWallet()
  const [balance, setBalance] = useState<WalletBalance>(MOCK_BALANCE)
  const [showSend, setShowSend] = useState(false)
  const [showRequest, setShowRequest] = useState(false)

  const handleSend = async (data: SendPaymentData) => {
    // Optimistic balance update
    setBalance((prev) => ({
      ...prev,
      available: Math.max(0, prev.available - data.amount),
      total: Math.max(0, prev.total - data.amount),
    }))
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Greeting */}
      <div className="pt-1">
        <p className="text-sm text-slate-500">{getGreeting()}</p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">My Wallet</h1>
      </div>

      {/* Balance hero card */}
      <BalanceHero balance={balance} address={address ?? ''} />

      {/* Quick actions */}
      <QuickActions onSend={() => setShowSend(true)} onRequest={() => setShowRequest(true)} />

      {/* Recent activity */}
      <ActivityFeed transactions={MOCK_TRANSACTIONS} />

      {/* Modals */}
      <SendModal isOpen={showSend} onClose={() => setShowSend(false)} onSend={handleSend} />
      <RequestModal
        isOpen={showRequest}
        onClose={() => setShowRequest(false)}
        address={address ?? ''}
        userEmail="me@qie.com"
      />
    </div>
  )
}
