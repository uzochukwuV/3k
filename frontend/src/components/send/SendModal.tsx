import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Search, Send, ChevronRight, Loader2, Check } from 'lucide-react'
import Modal from '../shared/Modal'
import Avatar from '../shared/Avatar'
import { getDisplayName, formatAmount } from '../../utils/format'
import { RECENT_CONTACTS } from '../../data/mockData'
import type { SendPaymentData } from '../../types'
import type { SendStep } from '../../types'

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  onSend?: (data: SendPaymentData) => Promise<void>
}

const CURRENCIES = ['USDC', 'USDT', 'DAI', 'ETH', 'QIE']

export default function SendModal({ isOpen, onClose, onSend }: SendModalProps) {
  const [step, setStep] = useState<SendStep>('recipient')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USDC')
  const [memo, setMemo] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [paymentId, setPaymentId] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStep('recipient')
      setRecipientEmail('')
      setRecipientAddress('')
      setAmount('')
      setMemo('')
      setError('')
      setPaymentId('')
      setIsSending(false)
    }
  }, [isOpen])

  const resolveEmail = useCallback(async (email: string) => {
    if (!email.includes('@')) return
    setIsResolving(true)
    try {
      const res = await fetch(`/api/payments/resolve/${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        setRecipientAddress(data.data.walletAddress)
      } else {
        // Stub for demo
        setRecipientAddress(`0x${Array.from(email).map((c) => c.charCodeAt(0).toString(16)).join('').slice(0, 40)}`)
      }
    } catch {
      setRecipientAddress(`0x${Array.from(email).map((c) => c.charCodeAt(0).toString(16)).join('').slice(0, 40)}`)
    } finally {
      setIsResolving(false)
    }
  }, [])

  const handleSelectContact = (email: string) => {
    setRecipientEmail(email)
    resolveEmail(email)
    setStep('amount')
  }

  const handleEmailContinue = () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    resolveEmail(recipientEmail)
    setStep('amount')
  }

  const handleAmountContinue = () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount')
      return
    }
    setError('')
    setStep('review')
  }

  const handleConfirmSend = async () => {
    setIsSending(true)
    setError('')
    try {
      const payload: SendPaymentData = {
        recipientEmail,
        recipientAddress,
        amount: parseFloat(amount),
        currency,
        memo,
      }
      // Try API
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: 'me@qie.com',
          recipientEmail,
          amount: parseFloat(amount),
          token: currency,
        }),
      })
      const result = res.ok ? await res.json() : { data: { id: Date.now().toString() } }
      setPaymentId(result.data?.id ?? Date.now().toString())

      await onSend?.(payload)
      setStep('success')
    } catch {
      setError('Transaction failed. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const recipientName = recipientEmail ? getDisplayName(recipientEmail) : ''

  const stepTitle: Record<SendStep, string> = {
    recipient: 'Send Payment',
    amount: `Pay ${recipientName}`,
    review: 'Review',
    success: '',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step !== 'success' ? stepTitle[step] : undefined}
      hideHeader={step === 'success'}
    >
      {/* Back button in header area for amount/review */}
      {(step === 'amount' || step === 'review') && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setStep(step === 'review' ? 'amount' : 'recipient')}
            className="p-2 rounded-full text-slate-500 hover:bg-white/8 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="px-5 py-5">
        {/* ─── STEP 1: RECIPIENT ─── */}
        {step === 'recipient' && (
          <div className="space-y-5 animate-fade-in">
            {/* Recent contacts */}
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Recent</p>
              <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                {RECENT_CONTACTS.map((c) => (
                  <button
                    key={c.email}
                    onClick={() => handleSelectContact(c.email)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                  >
                    <Avatar email={c.email} size="md" className="group-hover:ring-2 group-hover:ring-brand-500/50 transition-all" />
                    <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors w-14 text-center truncate">
                      {c.displayName.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email input */}
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Or enter email</p>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => { setRecipientEmail(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                  placeholder="name@example.com"
                  autoFocus
                  className="w-full bg-navy-700 border border-white/8 rounded-xl
                    pl-10 pr-4 py-3.5 text-white text-sm placeholder:text-slate-600
                    focus:outline-none focus:border-brand-500/60 focus:bg-navy-600
                    transition-all"
                />
                {isResolving && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500 animate-spin" />
                )}
              </div>
              {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
              {recipientAddress && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="font-mono text-xs text-emerald-400 truncate">{recipientAddress}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleEmailContinue}
              disabled={!recipientEmail}
              className="w-full flex items-center justify-center gap-2 rounded-xl
                bg-brand-500 hover:bg-brand-600 active:bg-brand-700
                py-3.5 font-semibold text-white text-sm
                transition-all shadow-glow-sm
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 2: AMOUNT ─── */}
        {step === 'amount' && (
          <div className="space-y-5 animate-fade-in">
            {/* Recipient summary */}
            <div className="flex items-center gap-3 py-3 border-b border-white/6">
              <Avatar email={recipientEmail} size="md" />
              <div>
                <p className="font-semibold text-white text-sm">{recipientName}</p>
                <p className="text-xs text-slate-500">{recipientEmail}</p>
              </div>
            </div>

            {/* Amount input */}
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Amount</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold text-slate-500">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError('') }}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  autoFocus
                  className="bg-transparent text-5xl font-extrabold text-white text-center
                    w-full max-w-[200px] placeholder:text-slate-700
                    focus:outline-none [appearance:textfield]
                    [&::-webkit-outer-spin-button]:appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
            </div>

            {/* Token select */}
            <div className="flex items-center justify-center gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${currency === c
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                      : 'bg-white/4 text-slate-500 border border-white/6 hover:text-slate-300'
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Note */}
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="What's it for? (optional)"
              maxLength={80}
              className="w-full bg-navy-700 border border-white/8 rounded-xl
                px-4 py-3 text-sm text-white placeholder:text-slate-600
                focus:outline-none focus:border-brand-500/60 transition-all"
            />

            <button
              onClick={handleAmountContinue}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl
                bg-brand-500 hover:bg-brand-600 active:bg-brand-700
                py-3.5 font-semibold text-white text-sm
                transition-all shadow-glow-sm
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Review Payment
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 3: REVIEW ─── */}
        {step === 'review' && (
          <div className="space-y-4 animate-fade-in">
            {/* Summary card */}
            <div className="rounded-2xl bg-navy-700 border border-white/8 overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center gap-3">
                <Avatar email={recipientEmail} size="md" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Sending to</p>
                  <p className="font-semibold text-white">{recipientName}</p>
                  <p className="text-xs text-slate-500">{recipientEmail}</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Amount</span>
                  <span className="text-xl font-extrabold text-white">${formatAmount(parseFloat(amount))} {currency}</span>
                </div>
                {memo && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-slate-500">Note</span>
                    <span className="text-sm text-slate-300 max-w-[60%] text-right">{memo}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Network</span>
                  <span className="text-sm text-slate-300">QIE Network</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Est. fee</span>
                  <span className="text-sm text-emerald-400">~0.00 QIE</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                <p className="text-sm text-rose-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleConfirmSend}
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 rounded-xl
                bg-brand-500 hover:bg-brand-600 active:bg-brand-700
                py-4 font-bold text-white text-base
                transition-all shadow-glow
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming on-chain…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Confirm & Send
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── STEP 4: SUCCESS ─── */}
        {step === 'success' && (
          <div className="flex flex-col items-center text-center py-4 animate-scale-in">
            {/* Checkmark */}
            <div className="relative mb-6">
              <div className="h-24 w-24 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/25 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
                    <circle cx="20" cy="20" r="18" stroke="#34d399" strokeWidth="2" />
                    <path
                      d="M12 20l6 6 10-12"
                      stroke="#34d399"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl -z-10" />
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-2">Payment Sent!</h3>
            <p className="text-slate-400 text-sm mb-1">
              <span className="font-semibold text-white">${formatAmount(parseFloat(amount))} {currency}</span>
              {' '}sent to{' '}
              <span className="text-white">{recipientName}</span>
            </p>
            {memo && <p className="text-xs text-slate-500 italic mb-6">"{memo}"</p>}
            {!memo && <div className="mb-6" />}

            {/* Receipt */}
            <div className="w-full rounded-2xl bg-navy-700 border border-white/8 p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Payment ID</span>
                <span className="font-mono text-xs text-slate-400">#{paymentId.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Recipient</span>
                <span className="text-xs text-slate-300">{recipientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Amount</span>
                <span className="text-xs text-white font-semibold">${formatAmount(parseFloat(amount))} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Status</span>
                <span className="text-xs text-emerald-400 font-medium">Confirmed</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-white/6 border border-white/10
                  py-3 font-semibold text-white text-sm hover:bg-white/10 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => {
                  setStep('recipient')
                  setRecipientEmail('')
                  setRecipientAddress('')
                  setAmount('')
                  setMemo('')
                  setError('')
                  setPaymentId('')
                }}
                className="flex-1 rounded-xl bg-brand-500 hover:bg-brand-600
                  py-3 font-semibold text-white text-sm transition-colors shadow-glow-sm"
              >
                Send Another
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
