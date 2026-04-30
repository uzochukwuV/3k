import { useState } from 'react'
import { Copy, Check, Share2, Send, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Modal from '../shared/Modal'
import { formatAddress } from '../../utils/format'
import type { RequestTab } from '../../types'

interface RequestModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  userEmail?: string
}

const CURRENCIES = ['USDC', 'USDT', 'DAI', 'ETH', 'QIE']

export default function RequestModal({ isOpen, onClose, address, userEmail = '' }: RequestModalProps) {
  const [tab, setTab] = useState<RequestTab>('qr')
  const [copied, setCopied] = useState(false)
  const [requestEmail, setRequestEmail] = useState('')
  const [requestAmount, setRequestAmount] = useState('')
  const [requestCurrency, setRequestCurrency] = useState('USDC')
  const [requestNote, setRequestNote] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const data = {
      title: 'QIE Pay',
      text: `Pay me on QIE Pay${requestAmount ? ` — $${requestAmount} ${requestCurrency}` : ''}`,
      url: `https://qie.pay/to/${address}`,
    }
    if (navigator.share) {
      await navigator.share(data)
    } else {
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendRequest = async () => {
    if (!requestEmail.includes('@')) return
    setIsSending(true)
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1000))
    setIsSending(false)
    setRequestSent(true)
    setTimeout(() => {
      setRequestSent(false)
      setRequestEmail('')
      setRequestAmount('')
      setRequestNote('')
    }, 2500)
  }

  const qrValue = address

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive Payment">
      <div className="px-5 pb-6">
        {/* Tab switcher */}
        <div className="flex bg-navy-700 rounded-xl p-1 mb-5 gap-1">
          {[
            { key: 'qr' as RequestTab, label: 'Show QR Code', icon: QrCode },
            { key: 'request' as RequestTab, label: 'Request', icon: Send },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === key
                  ? 'bg-navy-800 text-white shadow-sm border border-white/8'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ─── QR TAB ─── */}
        {tab === 'qr' && (
          <div className="flex flex-col items-center space-y-5 animate-fade-in">
            <p className="text-sm text-slate-400 text-center">
              Scan to send funds directly to your wallet
            </p>

            {/* QR Code */}
            <div className="relative">
              <div className="h-56 w-56 bg-white rounded-3xl flex items-center justify-center shadow-card p-3">
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
              {/* Corner accents */}
              <div className="absolute -top-1.5 -left-1.5 h-6 w-6 border-t-2 border-l-2 border-brand-500 rounded-tl-lg" />
              <div className="absolute -top-1.5 -right-1.5 h-6 w-6 border-t-2 border-r-2 border-brand-500 rounded-tr-lg" />
              <div className="absolute -bottom-1.5 -left-1.5 h-6 w-6 border-b-2 border-l-2 border-brand-500 rounded-bl-lg" />
              <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 border-b-2 border-r-2 border-brand-500 rounded-br-lg" />
            </div>

            {/* Address */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-2.5 w-full
                rounded-xl bg-navy-700 border border-white/8 px-4 py-3
                hover:bg-navy-600 transition-colors group"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="font-mono text-sm text-slate-300 flex-1 text-left truncate">{formatAddress(address)}</span>
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              )}
            </button>

            {userEmail && (
              <p className="text-xs text-slate-500 text-center">
                Also payable at{' '}
                <span className="text-slate-300 font-medium">{userEmail}</span>
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl
                  bg-white/6 border border-white/10
                  py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl
                  bg-brand-500 hover:bg-brand-600
                  py-3 text-sm font-semibold text-white transition-colors shadow-glow-sm"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        )}

        {/* ─── REQUEST TAB ─── */}
        {tab === 'request' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-slate-400 text-center mb-4">
              Send a payment request via email
            </p>

            {requestSent ? (
              <div className="flex flex-col items-center py-8 gap-3 animate-scale-in">
                <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="font-semibold text-white">Request Sent!</p>
                <p className="text-sm text-slate-500">Sent to {requestEmail}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">
                    From
                  </label>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="their@email.com"
                    className="w-full bg-navy-700 border border-white/8 rounded-xl
                      px-4 py-3 text-sm text-white placeholder:text-slate-600
                      focus:outline-none focus:border-brand-500/60 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">
                    Amount (optional)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                      <input
                        type="number"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-navy-700 border border-white/8 rounded-xl
                          pl-7 pr-3 py-3 text-sm text-white placeholder:text-slate-600
                          focus:outline-none focus:border-brand-500/60 transition-all"
                      />
                    </div>
                    <select
                      value={requestCurrency}
                      onChange={(e) => setRequestCurrency(e.target.value)}
                      className="bg-navy-700 border border-white/8 rounded-xl
                        px-3 py-3 text-sm text-white
                        focus:outline-none focus:border-brand-500/60 transition-all"
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="What's it for?"
                    maxLength={80}
                    className="w-full bg-navy-700 border border-white/8 rounded-xl
                      px-4 py-3 text-sm text-white placeholder:text-slate-600
                      focus:outline-none focus:border-brand-500/60 transition-all"
                  />
                </div>

                <button
                  onClick={handleSendRequest}
                  disabled={!requestEmail || !requestEmail.includes('@') || isSending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl
                    bg-brand-500 hover:bg-brand-600 active:bg-brand-700
                    py-3.5 font-semibold text-white text-sm
                    transition-all shadow-glow-sm
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSending ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Request
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
