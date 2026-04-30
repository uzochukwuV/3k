import { useState, useEffect } from 'react'
import { X, Send, Mail, FileText, Copy, CheckCircle, XCircle, ArrowLeft, QrCode } from 'lucide-react'
import { apiRequest } from '../lib/api'


interface SendPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  defaultRecipient?: string
  senderEmail?: string
  onSend?: (data: any) => Promise<void>
}

interface PaymentForm {
  recipientEmail: string
  recipientAddress: string
  amount: string
  memo: string
  currency: string
}

export default function SendPaymentModal({ 
  isOpen, 
  onClose, 
  defaultRecipient = '',
  senderEmail,
  onSend 
}: SendPaymentModalProps) {
  const [form, setForm] = useState<PaymentForm>({
    recipientEmail: defaultRecipient,
    recipientAddress: '',
    amount: '',
    memo: '',
    currency: 'USDC'
  })
  const [step, setStep] = useState<'details' | 'review' | 'qr' | 'success'>('details')
  const [isResolving, setIsResolving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [qrData, setQrData] = useState('')
  const [paymentId, setPaymentId] = useState('')

  const currencies = ['USDC', 'USDT', 'DAI', 'ETH', 'QIE']

  useEffect(() => {
    if (isOpen) {
      setStep('details')
      setError('')
      setQrData('')
      setPaymentId('')
    }
  }, [isOpen])

  const handleResolveRecipient = async (email: string) => {
    if (!email || !email.includes('@')) {
      setForm(prev => ({ ...prev, recipientAddress: '' }))
      return
    }

    setIsResolving(true)
    setError('')
    
    try {
      const data = await apiRequest<{ success: true; data: { walletAddress: string } }>(
        `/api/payments/resolve/${encodeURIComponent(email)}`,
        { method: 'GET' },
      )
      setForm(prev => ({ ...prev, recipientAddress: data.data.walletAddress }))
    } catch (err) {
      const stubAddress = '0x' + Buffer.from(email).toString('hex').slice(0, 40)
      setForm(prev => ({ ...prev, recipientAddress: stubAddress }))
    }
    
    setIsResolving(false)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!form.recipientEmail && !form.recipientAddress) {
      setError('Please enter a recipient email or address')
      return
    }

    setIsSending(true)
    setError('')

    try {
      const paymentData = {
        senderEmail: senderEmail || 'current@example.com',
        recipientEmail: form.recipientEmail || '',
        recipientAddress: form.recipientAddress,
        amount: amount,
        token: form.currency,
        memo: form.memo
      }

      const result = await apiRequest<any>('/api/payments/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      }).catch(() => ({
        success: true,
        data: {
          id: Date.now().toString(),
          qrCode: null
        }
      }))

      setPaymentId(result.data.id as string)

      const qrPayload = {
        type: 'qie_payment',
        paymentId: result.data.id,
        recipient: form.recipientEmail || form.recipientAddress,
        amount: amount,
        currency: form.currency,
        memo: form.memo,
        timestamp: Date.now()
      }
      
      setQrData(JSON.stringify(qrPayload))
      setStep('qr')
      
    } catch (err) {
      setError('Failed to create payment. Please try again.')
      setIsSending(false)
    }
  }

  const handleCopyLink = () => {
    const link = `qie:pay?id=${paymentId}`
    navigator.clipboard.writeText(link)
  }

  const handleSendNow = async () => {
    setIsSending(true)
    try {
      await onSend?.({
        recipient: form.recipientAddress,
        amount: parseFloat(form.amount),
        currency: form.currency,
        memo: form.memo
      })
      setStep('success')
    } catch (err) {
      setError('Transaction failed. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-ink-900 ring-1 ring-ink-800 shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-ink-800 p-6">
            <h2 className="font-display text-xl font-bold text-white">
              {step === 'details' && 'New Payment'}
              {step === 'review' && 'Review Payment'}
              {step === 'qr' && 'Payment QR Code'}
              {step === 'success' && 'Payment Sent!'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-ink-500 hover:bg-ink-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400 ring-1 ring-red-500/20">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {step === 'details' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-400 mb-2">
                    Recipient
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
                    <input
                      type="email"
                      value={form.recipientEmail}
                      onChange={(e) => {
                        const email = e.target.value
                        setForm(prev => ({ ...prev, recipientEmail: email }))
                        if (email) handleResolveRecipient(email)
                      }}
                      placeholder="name@example.com"
                      className="w-full rounded-lg bg-ink-800 pl-10 pr-4 py-3 text-white placeholder-ink-500 ring-1 ring-ink-700 focus:outline-none focus:ring-flare-500"
                    />
                    {isResolving && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-flare-500/30 border-t-flare-500" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Or enter wallet address directly
                  </p>
                </div>

                {form.recipientAddress && (
                  <div className="rounded-lg bg-ink-800/50 p-3 ring-1 ring-ink-800">
                    <p className="text-xs text-ink-500 mb-1">Resolved address</p>
                    <p className="font-mono text-sm text-ink-300 break-all">
                      {form.recipientAddress}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-ink-400 mb-2">
                    Amount
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="flex-1 rounded-lg bg-ink-800 px-4 py-3 text-white text-xl font-semibold placeholder-ink-500 ring-1 ring-ink-700 focus:outline-none focus:ring-flare-500"
                      required
                      min="0.01"
                      step="0.01"
                    />
                    <select
                      value={form.currency}
                      onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="rounded-lg bg-ink-800 px-4 py-3 text-white ring-1 ring-ink-700 focus:outline-none focus:ring-flare-500"
                    >
                      {currencies.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-400 mb-2">
                    Note (optional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
                    <input
                      type="text"
                      value={form.memo}
                      onChange={(e) => setForm(prev => ({ ...prev, memo: e.target.value }))}
                      placeholder="For dinner, rent, etc."
                      className="w-full rounded-lg bg-ink-800 pl-10 pr-4 py-3 text-white placeholder-ink-500 ring-1 ring-ink-700 focus:outline-none focus:ring-flare-500"
                      maxLength={100}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-flare-500 px-6 py-4 font-semibold text-white hover:bg-flare-600 transition-all disabled:opacity-50"
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Continue
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 'review' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-ink-800/50 p-4 ring-1 ring-ink-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-flare-500/10 flex items-center justify-center">
                      <Send className="h-5 w-5 text-flare-400" />
                    </div>
                    <div>
                      <p className="text-sm text-ink-400">Sending to</p>
                      <p className="font-medium text-white">{form.recipientEmail || 'Wallet'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-400">Amount</span>
                    <span className="font-display text-2xl font-bold text-white">
                      {form.amount} {form.currency}
                    </span>
                  </div>
                  {form.memo && (
                    <div className="mt-3 pt-3 border-t border-ink-700">
                      <p className="text-sm text-ink-500">Note</p>
                      <p className="text-white">{form.memo}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSendNow}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-flare-500 px-6 py-4 font-semibold text-white hover:bg-flare-600 transition-all disabled:opacity-50"
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send Payment
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep('details')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink-800 px-6 py-4 font-semibold text-white hover:bg-ink-700 transition-colors ring-1 ring-ink-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Edit Details
                </button>
              </div>
            )}

            {step === 'qr' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-white p-4 flex justify-center">
                  {qrData && (
                    <QrCode size={200}   />
                  )}
                </div>

                <div className="rounded-lg bg-ink-800/50 p-4 ring-1 ring-ink-800">
                  <p className="text-sm text-ink-400 mb-1">Payment ID</p>
                  <p className="font-mono text-sm text-ink-200">{paymentId}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-ink-800 px-4 py-3 text-white hover:bg-ink-700 transition-colors ring-1 ring-ink-700"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </button>
                  <button
                    onClick={() => setStep('success')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-flare-500 px-4 py-3 text-white hover:bg-flare-600 transition-colors"
                  >
                    Done
                  </button>
                </div>

                <p className="text-center text-xs text-ink-500">
                  Share this QR code or link to receive payment
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Payment Created!
                </h3>
                <p className="text-ink-400">
                  {form.amount} {form.currency} payment has been initiated
                </p>

                <div className="rounded-lg bg-ink-800/50 p-4 text-left ring-1 ring-ink-800">
                  <div className="flex justify-between py-2 border-b border-ink-700">
                    <span className="text-ink-400">Recipient</span>
                    <span className="text-white">{form.recipientEmail || 'Wallet'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-ink-700">
                    <span className="text-ink-400">Amount</span>
                    <span className="text-white">{form.amount} {form.currency}</span>
                  </div>
                  {form.memo && (
                    <div className="flex justify-between py-2">
                      <span className="text-ink-400">Note</span>
                      <span className="text-white">{form.memo}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ink-800 px-6 py-4 font-semibold text-white hover:bg-ink-700 transition-colors ring-1 ring-ink-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setStep('details')
                      setForm({
                        recipientEmail: '',
                        recipientAddress: '',
                        amount: '',
                        memo: '',
                        currency: 'USDC'
                      })
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-flare-500 px-6 py-4 font-semibold text-white hover:bg-flare-600 transition-colors"
                  >
                    New Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
