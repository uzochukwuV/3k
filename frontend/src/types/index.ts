export type PaymentStatus = 'pending' | 'confirmed' | 'completed' | 'failed'
export type PaymentType = 'sent' | 'received'
export type ActivePage = 'home' | 'activity' | 'portfolio' | 'settings'
export type SendStep = 'recipient' | 'amount' | 'review' | 'success'
export type RequestTab = 'qr' | 'request'

export interface Transaction {
  id: string
  type: PaymentType
  senderEmail: string
  recipientEmail: string
  amount: number
  token: string
  status: PaymentStatus
  transactionHash?: string
  memo?: string
  createdAt: string
}

export interface WalletBalance {
  available: number
  savings: number
  goalLock: number
  total: number
  token: string
}

export interface SendPaymentData {
  recipientEmail: string
  recipientAddress?: string
  amount: number
  currency: string
  memo?: string
}

export interface SplitConfig {
  availablePct: number
  savingsPct: number
  goalLockPct: number
  allowanceAmount: number
  allowancePeriod: number
}

export interface Contact {
  email: string
  displayName: string
  walletAddress?: string
}
