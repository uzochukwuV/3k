import type { Transaction, WalletBalance, SplitConfig, Contact } from '../types'

const now = Date.now()
const h = (n: number) => new Date(now - n * 60 * 60 * 1000).toISOString()
const d = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString()

export const MOCK_BALANCE: WalletBalance = {
  available: 1250.50,
  savings: 3580.75,
  goalLock: 850.00,
  total: 5681.25,
  token: 'USDC',
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'received',
    senderEmail: 'alice.chen@gmail.com',
    recipientEmail: 'me@qie.com',
    amount: 75.50,
    token: 'USDC',
    status: 'completed',
    transactionHash: '0x3a8b2f7e1d9c4056a2b8e7f3c1d9a4b2e7f3c1d9',
    memo: 'Dinner last night 🍕',
    createdAt: h(2),
  },
  {
    id: '2',
    type: 'sent',
    senderEmail: 'me@qie.com',
    recipientEmail: 'bob.smith@gmail.com',
    amount: 150.00,
    token: 'USDC',
    status: 'completed',
    transactionHash: '0x5c2d8e1f3a7b9d4e6f2c8a1b3d7e9f4c2a8b1d3e',
    memo: 'Rent split',
    createdAt: h(5),
  },
  {
    id: '3',
    type: 'received',
    senderEmail: 'carol.d@qie.com',
    recipientEmail: 'me@qie.com',
    amount: 30.00,
    token: 'USDC',
    status: 'completed',
    transactionHash: '0x7e4f2c9a1b6d8e3f5c2a9b4d7e1f3c6a2b9d4e7f',
    memo: 'Concert tickets 🎵',
    createdAt: d(1),
  },
  {
    id: '4',
    type: 'sent',
    senderEmail: 'me@qie.com',
    recipientEmail: 'david.k@gmail.com',
    amount: 200.00,
    token: 'USDC',
    status: 'pending',
    memo: 'Weekend trip 🏕️',
    createdAt: d(2),
  },
  {
    id: '5',
    type: 'received',
    senderEmail: 'eve.w@qie.com',
    recipientEmail: 'me@qie.com',
    amount: 45.75,
    token: 'USDC',
    status: 'completed',
    transactionHash: '0x1a9d3e8f2b7c5a4d6e9f1c3b8a2d5e7f4c9b3a6d',
    memo: 'Coffee ☕ x3',
    createdAt: d(2),
  },
  {
    id: '6',
    type: 'sent',
    senderEmail: 'me@qie.com',
    recipientEmail: 'frank.moore@gmail.com',
    amount: 89.99,
    token: 'USDC',
    status: 'completed',
    transactionHash: '0x8b3f5c2a7d1e6b4f9c3a8d2e7f5b1c4a9d3e6f2b',
    memo: 'Groceries haul',
    createdAt: d(3),
  },
  {
    id: '7',
    type: 'received',
    senderEmail: 'grace.h@gmail.com',
    recipientEmail: 'me@qie.com',
    amount: 120.00,
    token: 'USDC',
    status: 'confirmed',
    transactionHash: '0x4d6e9f2c1a7b3d8e5f2c9a4b6d1e3f8c2a7b4d9e',
    memo: 'Monthly sub refund',
    createdAt: d(4),
  },
  {
    id: '8',
    type: 'sent',
    senderEmail: 'me@qie.com',
    recipientEmail: 'henry.w@qie.com',
    amount: 55.00,
    token: 'USDC',
    status: 'completed',
    transactionHash: '0x2c7a4d9e1f6b3c8a5d2e7f4c1b6d9a3e5f2c8b4d',
    memo: 'Warcraft sub 🎮',
    createdAt: d(5),
  },
]

export const MOCK_SPLIT_CONFIG: SplitConfig = {
  availablePct: 40,
  savingsPct: 35,
  goalLockPct: 25,
  allowanceAmount: 100,
  allowancePeriod: 604800,
}

export const RECENT_CONTACTS: Contact[] = [
  { email: 'alice.chen@gmail.com', displayName: 'Alice Chen' },
  { email: 'bob.smith@gmail.com', displayName: 'Bob Smith' },
  { email: 'carol.d@qie.com', displayName: 'Carol D.' },
  { email: 'david.k@gmail.com', displayName: 'David K.' },
  { email: 'eve.w@qie.com', displayName: 'Eve W.' },
]

export const SPLIT_PRESETS = [
  { name: 'Balanced', description: 'Equal split', available: 34, savings: 33, goalLock: 33 },
  { name: 'Growth', description: 'Max yield', available: 20, savings: 55, goalLock: 25 },
  { name: 'Discipline', description: 'Save more', available: 30, savings: 20, goalLock: 50 },
  { name: 'Liquid', description: 'Stay ready', available: 60, savings: 25, goalLock: 15 },
]

export const PERIOD_OPTIONS = [
  { label: 'Daily', value: 86400, description: '24 hours' },
  { label: 'Weekly', value: 604800, description: '7 days' },
  { label: 'Bi-weekly', value: 1209600, description: '14 days' },
  { label: 'Monthly', value: 2592000, description: '30 days' },
]
