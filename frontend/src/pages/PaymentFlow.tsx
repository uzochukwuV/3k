import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useWallet } from '../context/WalletContext'
import { ArrowLeft, Loader2, CreditCard, CheckCircle } from 'lucide-react'

interface PaymentInfo {
  routerAddress: string
  amount: string
  status: 'pending' | 'paid' | 'failed'
}

export default function PaymentFlow() {
  const { routerAddress } = useParams<{ routerAddress: string }>()
  const { address, connect, isCorrectNetwork, switchNetwork } = useWallet()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simulate fetching payment details – replace with real contract call later
  useEffect(() => {
    if (!routerAddress) return
    // Mock data – initially no amount, user can enter
    setPaymentInfo({
      routerAddress,
      amount: '',
      status: 'pending',
    })
  }, [routerAddress])

  const handlePay = async () => {
    if (!paymentInfo) return
    if (!paymentInfo.amount) {
      setError('Please enter an amount.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Placeholder: insert web3 transaction here
      await new Promise((res) => setTimeout(res, 1500))
      setPaymentInfo({ ...paymentInfo, status: 'paid' })
    } catch (e) {
      setError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-ink-950">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center min-h-[60vh]">
          <button
            onClick={connect}
            className="rounded-xl bg-flare-500 px-6 py-3 font-semibold text-white hover:bg-flare-600"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-ink-950">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center min-h-[60vh]">
          <button
            onClick={switchNetwork}
            className="rounded-xl bg-flare-500 px-6 py-3 font-semibold text-white hover:bg-flare-600"
          >
            Switch to QIE Network
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <Navbar />
      <div className="pt-24 max-w-2xl mx-auto px-4">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-ink-300 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {paymentInfo ? (
          <div className="rounded-2xl bg-ink-900/50 p-6 ring-1 ring-ink-800">
            <h2 className="font-display text-2xl font-bold text-white mb-4">
              Pay Router {paymentInfo.routerAddress.slice(0, 6)}...{paymentInfo.routerAddress.slice(-4)}
            </h2>
            {paymentInfo.amount ? (
              <p className="text-ink-300 mb-4">Amount due: <span className="text-flare-400">{paymentInfo.amount} USDC</span></p>
            ) : (
              <div className="mb-4">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={paymentInfo.amount}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, amount: e.target.value })}
                  className="w-full rounded-xl bg-ink-800 px-4 py-2 text-white placeholder-ink-500 ring-1 ring-ink-700 focus:outline-none focus:ring-flare-500"
                />
              </div>
            )}

            {paymentInfo.status === 'paid' ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                Payment successful!
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-flare-500 px-4 py-2 text-white font-medium hover:bg-flare-600 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            )}

            {error && <p className="mt-2 text-red-500">{error}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-ink-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading payment details...
          </div>
        )}
      </div>
    </div>
  )
}
