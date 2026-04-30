import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import SendPaymentModal from '../components/SendPaymentModal'
import ReceiptsPage from '../components/ReceiptsPage'
import SettingsPage from '../components/SettingsPage'
import SocialJackpot from './SocialJackpot'
import { formatUnits, parseUnits } from 'ethers'
import { apiRequest } from '../lib/api'
import {
  erc20Allowance,
  erc20Approve,
  getBrowserProvider,
  getContractAddresses,
  getErc20,
  getRouterFactory,
  getSigner,
  getSmartRouter,
  routerFactoryDeployRouter,
  smartRouterClaimAllowance,
  smartRouterGetValues,
  smartRouterPayAndSave,
  smartRouterProcessPayment,
} from '../contracts'
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  HelpCircle,
  Home,
  Layers,
  PiggyBank,
  Search,
  Settings as SettingsIcon,
  Trophy,
  User,
} from 'lucide-react'

type NavKey = 'dashboard' | 'payments' | 'deposits' | 'history' | 'account' | 'settings' | 'help' | 'receipts' | 'jackpot'

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatAmount(value: bigint, decimals: number) {
  const raw = formatUnits(value, decimals)
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatOptionalDate(tsSeconds: bigint) {
  if (tsSeconds === 0n) return '—'
  const d = new Date(Number(tsSeconds) * 1000)
  return d.toLocaleString()
}

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-ink-500">{label}</div>
        <div className={`h-2 w-2 rounded-full ${color}`} />
      </div>
      <div className="mt-2 text-sm font-semibold text-ink-900">{value}</div>
    </div>
  )
}

function MiniBarChart({ series }: { series: Array<{ label: string; a: number; b: number }> }) {
  const max = useMemo(() => Math.max(...series.map((s) => Math.max(s.a, s.b)), 1), [series])
  return (
    <div className="mt-5">
      <div className="grid grid-cols-6 items-end gap-3">
        {series.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end justify-center gap-2">
              <div
                className="w-3 rounded-full bg-ink-200"
                style={{ height: `${Math.round((s.a / max) * 100)}%` }}
              />
              <div
                className="w-3 rounded-full bg-flare-500"
                style={{ height: `${Math.round((s.b / max) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] font-medium text-ink-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-ink-200" />
          Planned
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-flare-500" />
          Actual
        </div>
      </div>
    </div>
  )
}

export default function PaymentDashboard({ initialActive }: { initialActive?: NavKey }) {
  const { address, chainId, connect, isCorrectNetwork, switchNetwork } = useWallet()
  const [active, setActive] = useState<NavKey>(initialActive ?? 'dashboard')
  const [showSendModal, setShowSendModal] = useState(false)

  const [email, setEmail] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isEmailSaving, setIsEmailSaving] = useState(false)

  const [tokenAddress, setTokenAddress] = useState<string | null>(null)
  const [tokenSymbol, setTokenSymbol] = useState<string>('TOKEN')
  const [tokenDecimals, setTokenDecimals] = useState<number>(18)
  const [routerFactoryAddress, setRouterFactoryAddress] = useState<string | null>(null)
  const [routerAddress, setRouterAddress] = useState<string | null>(null)

  const [operating, setOperating] = useState<bigint>(0n)
  const [treasury, setTreasury] = useState<bigint>(0n)
  const [locked, setLocked] = useState<bigint>(0n)
  const [savingsTotal, setSavingsTotal] = useState<bigint>(0n)
  const [savingsPrincipal, setSavingsPrincipal] = useState<bigint>(0n)
  const [savingsYield, setSavingsYield] = useState<bigint>(0n)
  const [savePctBps, setSavePctBps] = useState<bigint>(0n)
  const [allowanceAmount, setAllowanceAmount] = useState<bigint>(0n)
  const [allowancePeriod, setAllowancePeriod] = useState<bigint>(0n)
  const [lastAllowanceRelease, setLastAllowanceRelease] = useState<bigint>(0n)

  const [txError, setTxError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeployingRouter, setIsDeployingRouter] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  type TxRow = { name: string; category: string; date: string; amount: string }
  const [transactions, setTransactions] = useState<TxRow[]>([])

  const total = useMemo(() => operating + treasury + locked, [locked, operating, treasury])

  const chartSeries = useMemo(
    () => [
      { label: 'Oct', a: 18, b: 22 },
      { label: 'Nov', a: 23, b: 17 },
      { label: 'Dec', a: 14, b: 28 },
      { label: 'Jan', a: 21, b: 16 },
      { label: 'Feb', a: 12, b: 19 },
      { label: 'Mar', a: 15, b: 31 },
    ],
    [],
  )

  const plannings = useMemo(
    () => [
      { title: 'New Laptop M1', target: 900, progress: 0.45 },
      { title: 'Dream House', target: 120000, progress: 0.18 },
      { title: 'Emergency Fund', target: 5000, progress: 0.72 },
    ],
    [],
  )

  useEffect(() => {
    if (!address) return
    const key = `qie_email_${address.toLowerCase()}`
    const existing = localStorage.getItem(key)
    if (existing) {
      setEmail(existing)
      setEmailDraft(existing)
    }
  }, [address])

  useEffect(() => {
    if (!address) return
    if (email !== null) return
    void apiRequest<{ success: true; data: { email: string } }>(`/api/payments/resolve-wallet/${address}`, { method: 'GET' })
      .then((r) => {
        const value = r.data.email.toLowerCase()
        const key = `qie_email_${address.toLowerCase()}`
        localStorage.setItem(key, value)
        setEmail(value)
        setEmailDraft(value)
      })
      .catch(() => {})
  }, [address, email])

  useEffect(() => {
    if (!address || !chainId) return
    const addrs = getContractAddresses(chainId)
    if (!addrs) return
    setRouterFactoryAddress(addrs.routerFactory)
    setTokenAddress(addrs.mockQusdc ?? null)
  }, [address, chainId])

  const refresh = async () => {
    if (!address || !chainId) return
    const addrs = getContractAddresses(chainId)
    if (!addrs?.routerFactory || !addrs.mockQusdc) {
      setTxError('Missing contract addresses for this network')
      return
    }

    setIsRefreshing(true)
    setTxError(null)

    try {
      const provider = getBrowserProvider()
      const factory = getRouterFactory(addrs.routerFactory, provider)
      const routers = (await factory.getUserRouters(address)) as string[]
      const currentRouter =
        routers.length > 0 ? routers[routers.length - 1] : null
      setRouterAddress(currentRouter)

      const token = getErc20(addrs.mockQusdc, provider)
      const [symbol, decimals, walletBal] = await Promise.all([
        token.symbol() as Promise<string>,
        token.decimals() as Promise<number>,
        token.balanceOf(address) as Promise<bigint>,
      ])

      setTokenSymbol(symbol)
      setTokenDecimals(decimals)
      setOperating(walletBal)

      if (currentRouter) {
        const router = getSmartRouter(currentRouter, provider)
        const [values, sp, aa, ap, lar] = await Promise.all([
          smartRouterGetValues(currentRouter, addrs.mockQusdc, provider),
          router.savePct() as Promise<bigint>,
          router.allowanceAmount() as Promise<bigint>,
          router.allowancePeriod() as Promise<bigint>,
          router.lastAllowanceRelease() as Promise<bigint>,
        ])

        setTreasury(values.treasuryValue)
        setLocked(values.lockedValue)
        setSavingsPrincipal(values.savingsPrincipal)
        setSavingsTotal(values.savingsTotalValue)
        setSavingsYield(values.savingsYieldEarned)
        setSavePctBps(sp)
        setAllowanceAmount(aa)
        setAllowancePeriod(ap)
        setLastAllowanceRelease(lar)

        const blockNumber = await provider.getBlockNumber()
        const fromBlock = Math.max(blockNumber - 20_000, 0)
        const payFilter = router.filters.PaymentSentAndSaved(addrs.mockQusdc, null)
        const allowFilter = router.filters.AllowanceClaimed(addrs.mockQusdc)
        const [payLogs, allowLogs] = await Promise.all([
          router.queryFilter(payFilter, fromBlock, blockNumber),
          router.queryFilter(allowFilter, fromBlock, blockNumber),
        ])

        const recentLogs = [...payLogs.slice(-5), ...allowLogs.slice(-5)]
        const uniqueBlocks = Array.from(new Set(recentLogs.map((l: any) => l.blockNumber as number)))
        const blocks = await Promise.all(uniqueBlocks.map((bn) => provider.getBlock(bn)))
        const blockTime = new Map<number, number>()
        for (const b of blocks) {
          if (b) blockTime.set(b.number, Number(b.timestamp))
        }

        const fmtDate = (bn: number) => {
          const ts = blockTime.get(bn)
          if (!ts) return '—'
          return new Date(ts * 1000).toLocaleString()
        }

        const payRows: TxRow[] = payLogs
          .slice(-5)
          .reverse()
          .map((l: any) => ({
            name: 'Payment',
            category: `${String(l.args.recipient).slice(0, 6)}...${String(l.args.recipient).slice(-4)}`,
            date: fmtDate(l.blockNumber as number),
            amount: `-${formatAmount(l.args.amountSent as bigint, decimals)} ${symbol}`,
          }))

        const allowRows: TxRow[] = allowLogs
          .slice(-5)
          .reverse()
          .map((l: any) => ({
            name: 'Allowance',
            category: 'Locked',
            date: fmtDate(l.blockNumber as number),
            amount: `+${formatAmount(l.args.amountClaimed as bigint, decimals)} ${symbol}`,
          }))

        setTransactions([...payRows, ...allowRows].slice(0, 6))
      } else {
        setTreasury(0n)
        setLocked(0n)
        setSavingsPrincipal(0n)
        setSavingsTotal(0n)
        setSavingsYield(0n)
        setSavePctBps(0n)
        setAllowanceAmount(0n)
        setAllowancePeriod(0n)
        setLastAllowanceRelease(0n)
        setTransactions([])
      }
    } catch (e: any) {
      setTxError(e?.message ?? 'Failed to load on-chain data')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!address || !isCorrectNetwork) return
    void refresh()
  }, [address, isCorrectNetwork, chainId])

  const handleDeployRouter = async () => {
    if (!routerFactoryAddress) return
    setIsDeployingRouter(true)
    setTxError(null)

    try {
      const signer = await getSigner()
      const deployed = await routerFactoryDeployRouter(
        routerFactoryAddress,
        {
          operatingPct: 4000n,
          treasuryPct: 3000n,
          lockedPct: 3000n,
          allowanceAmount: 0n,
          allowancePeriod: 0n,
        },
        signer,
      )
      setRouterAddress(deployed)
      await refresh()
      if (email) {
        await apiRequest('/api/payments/update-router', {
          method: 'POST',
          body: JSON.stringify({ email, walletAddress: address, routerAddress: deployed }),
        }).catch(() =>
          apiRequest('/api/payments/register', {
            method: 'POST',
            body: JSON.stringify({ email, walletAddress: address, routerAddress: deployed }),
          }).catch(() => {})
        )
      }
    } catch (e: any) {
      setTxError(e?.message ?? 'Failed to deploy router')
    } finally {
      setIsDeployingRouter(false)
    }
  }

  const handleProcess = async () => {
    if (!routerAddress || !tokenAddress) return
    setIsProcessing(true)
    setTxError(null)
    try {
      const signer = await getSigner()
      await smartRouterProcessPayment(routerAddress, tokenAddress, signer)
      await refresh()
    } catch (e: any) {
      setTxError(e?.message ?? 'Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClaim = async () => {
    if (!routerAddress || !tokenAddress) return
    setIsClaiming(true)
    setTxError(null)
    try {
      const signer = await getSigner()
      await smartRouterClaimAllowance(routerAddress, tokenAddress, signer)
      await refresh()
    } catch (e: any) {
      setTxError(e?.message ?? 'Failed to claim allowance')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleRegisterEmail = async () => {
    if (!address) return
    const value = emailDraft.trim().toLowerCase()
    if (!value.includes('@')) {
      setEmailError('Enter a valid email address')
      return
    }
    setIsEmailSaving(true)
    setEmailError(null)
    try {
      const resolved = await apiRequest<{ success: true; data: { walletAddress: string; routerAddress?: string | null } }>(
        `/api/payments/resolve/${encodeURIComponent(value)}`,
        { method: 'GET' },
      )
      if (resolved.data.walletAddress.toLowerCase() !== address.toLowerCase()) {
        setEmailError('This email is registered to a different wallet')
        return
      }
      if (routerAddress && resolved.data.routerAddress?.toLowerCase() !== routerAddress.toLowerCase()) {
        await apiRequest('/api/payments/update-router', {
          method: 'POST',
          body: JSON.stringify({ email: value, walletAddress: address, routerAddress }),
        }).catch(() => {})
      }
      const key = `qie_email_${address.toLowerCase()}`
      localStorage.setItem(key, value)
      setEmail(value)
    } catch (e: any) {
      if (e?.status === 404) {
        try {
          await apiRequest('/api/payments/register', {
            method: 'POST',
            body: JSON.stringify({ email: value, walletAddress: address, routerAddress }),
          })
          const key = `qie_email_${address.toLowerCase()}`
          localStorage.setItem(key, value)
          setEmail(value)
        } catch (err: any) {
          setEmailError(err?.message ?? 'Failed to register')
        }
      } else {
        setEmailError(e?.message ?? 'Failed to verify email')
      }
    } finally {
      setIsEmailSaving(false)
    }
  }

  // Network check
  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-ink-950 px-4">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/25" />
          <h1 className="mt-6 font-display text-3xl font-bold text-white">Wrong Network</h1>
          <p className="mt-3 text-ink-300">Switch to QIE Network to continue.</p>
          <button
            onClick={switchNetwork}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-flare-500 px-6 py-3 text-sm font-semibold text-white hover:bg-flare-600"
          >
            Switch Network
          </button>
        </div>
      </div>
    )
  }

  // Wallet not connected
  if (!address) {
    return (
      <div className="min-h-screen bg-ink-950 px-4">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-flare-500 to-flare-600 shadow-halo">
            <User className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-white">QIE Pay</h1>
          <p className="mt-3 text-ink-300">Connect your wallet to open your dashboard.</p>
          <button
            onClick={connect}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-flare-500 px-6 py-3 text-sm font-semibold text-white hover:bg-flare-600"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  const nav = useMemo(
    () => [
      { key: 'dashboard' as const, label: 'Dashboard', icon: Home },
      { key: 'payments' as const, label: 'Payments', icon: CreditCard },
      { key: 'deposits' as const, label: 'Deposits', icon: PiggyBank },
      { key: 'jackpot' as const, label: 'Social Jackpot', icon: Trophy },
      { key: 'receipts' as const, label: 'Receipts', icon: Layers },
      { key: 'settings' as const, label: 'Settings', icon: SettingsIcon },
      { key: 'help' as const, label: 'Help', icon: HelpCircle },
    ],
    [],
  )

  const content = (() => {
    if (active === 'settings') return <SettingsPage />
    if (active === 'receipts') return <ReceiptsPage />
    if (active === 'jackpot') return <SocialJackpot />

    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-ink-900">Balance</div>
                <div className="mt-2 text-xs text-ink-500">Total balance</div>
              </div>
              <div className="flex items-center gap-2">
                {!routerAddress && (
                  <button
                    onClick={handleDeployRouter}
                    disabled={isDeployingRouter}
                    className="rounded-xl bg-flare-500 px-3 py-2 text-xs font-semibold text-white hover:bg-flare-600 disabled:opacity-60"
                  >
                    {isDeployingRouter ? 'Deploying...' : 'Deploy Router'}
                  </button>
                )}
                <button
                  onClick={() => void refresh()}
                  disabled={isRefreshing}
                  className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {txError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {txError}
              </div>
            )}

            {email === null && (
              <div className="mt-5 rounded-2xl border border-ink-200 bg-ink-50 p-4">
                <div className="text-sm font-semibold text-ink-900">Finish setup</div>
                <div className="mt-1 text-xs text-ink-600">Register your email to enable email-based payments.</div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-flare-500"
                  />
                  <button
                    onClick={() => void handleRegisterEmail()}
                    disabled={isEmailSaving}
                    className="rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
                  >
                    {isEmailSaving ? 'Saving...' : 'Continue'}
                  </button>
                </div>
                {emailError && <div className="mt-3 text-xs font-medium text-red-600">{emailError}</div>}
              </div>
            )}

            <div className="mt-5">
              <div className="text-3xl font-semibold text-ink-900">
                {formatAmount(total, tokenDecimals)} {tokenSymbol}
              </div>
              <div className="mt-1 text-xs text-ink-500">
                Router: {routerAddress ? `${routerAddress.slice(0, 6)}...${routerAddress.slice(-4)}` : 'Not deployed'}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <MetricPill label="Operating" value={`${formatAmount(operating, tokenDecimals)} ${tokenSymbol}`} color="bg-flare-500" />
              <MetricPill label="Treasury" value={`${formatAmount(treasury, tokenDecimals)} ${tokenSymbol}`} color="bg-emerald-500" />
              <MetricPill label="Locked" value={`${formatAmount(locked, tokenDecimals)} ${tokenSymbol}`} color="bg-indigo-500" />
            </div>

            <div className="mt-6 rounded-2xl border border-ink-200 bg-ink-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-ink-600">Distribution</div>
                <div className="text-xs text-ink-500">
                  Allowance: {formatAmount(allowanceAmount, tokenDecimals)} / {allowancePeriod === 0n ? '—' : `${Number(allowancePeriod) / 86400}d`}
                </div>
              </div>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-ink-200">
                <div
                  className="h-full bg-flare-500"
                  style={{ width: total === 0n ? '0%' : `${Number((operating * 10000n) / total) / 100}%` }}
                />
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: total === 0n ? '0%' : `${Number((treasury * 10000n) / total) / 100}%` }}
                />
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: total === 0n ? '0%' : `${Number((locked * 10000n) / total) / 100}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-ink-600 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-flare-500" />
                  Operating
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Treasury
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  Locked
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="text-xs text-ink-500">Savings total</div>
                <div className="mt-2 text-lg font-semibold text-ink-900">
                  {formatAmount(savingsTotal, tokenDecimals)} {tokenSymbol}
                </div>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="text-xs text-ink-500">Savings principal</div>
                <div className="mt-2 text-lg font-semibold text-ink-900">
                  {formatAmount(savingsPrincipal, tokenDecimals)} {tokenSymbol}
                </div>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="text-xs text-ink-500">Savings yield</div>
                <div className="mt-2 text-lg font-semibold text-ink-900">
                  {formatAmount(savingsYield, tokenDecimals)} {tokenSymbol}
                </div>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="text-xs text-ink-500">Last allowance release</div>
                <div className="mt-2 text-sm font-semibold text-ink-900">
                  {formatOptionalDate(lastAllowanceRelease)}
                </div>
              </div>
            </div>

            {routerAddress && tokenAddress && (
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => void handleProcess()}
                  disabled={isProcessing}
                  className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-ink-50 disabled:opacity-60"
                >
                  {isProcessing ? 'Processing...' : 'Process Payment'}
                </button>
                <button
                  onClick={() => void handleClaim()}
                  disabled={isClaiming}
                  className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-ink-50 disabled:opacity-60"
                >
                  {isClaiming ? 'Claiming...' : 'Claim Allowance'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-ink-900">General Payment</div>
                <div className="mt-2 text-xs text-ink-500">Payment statistics</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-50 text-ink-600 ring-1 ring-ink-200">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-3xl font-semibold text-ink-900">{formatNumber(40090423)} USD</div>
              <div className="mt-1 text-xs text-ink-500">Updated weekly</div>
            </div>

            <MiniBarChart series={chartSeries} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-ink-900">Plannings</div>
              <button className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50">
                Add
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {plannings.map((p) => (
                <div key={p.title} className="rounded-2xl border border-ink-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{p.title}</div>
                      <div className="mt-1 text-xs text-ink-500">Target: ${formatNumber(p.target)}</div>
                    </div>
                    <div className="text-sm font-semibold text-ink-900">{Math.round(p.progress * 100)}%</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-flare-500" style={{ width: `${p.progress * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-ink-900">Last Transaction</div>
              <button
                onClick={() => setShowSendModal(true)}
                className="rounded-xl bg-flare-500 px-3 py-2 text-xs font-semibold text-white hover:bg-flare-600"
              >
                New
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-ink-200">
              <div className="grid grid-cols-12 bg-ink-50 px-4 py-3 text-[11px] font-semibold text-ink-600">
                <div className="col-span-6">Name</div>
                <div className="col-span-4">Date</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              <div className="divide-y divide-ink-200 bg-white">
                {transactions.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-ink-500">No recent on-chain activity found.</div>
                ) : (
                  transactions.map((t) => (
                  <div key={`${t.name}-${t.date}`} className="grid grid-cols-12 items-center px-4 py-3">
                    <div className="col-span-6">
                      <div className="text-sm font-semibold text-ink-900">{t.name}</div>
                      <div className="text-xs text-ink-500">{t.category}</div>
                    </div>
                    <div className="col-span-4 text-xs text-ink-600">{t.date}</div>
                    <div className="col-span-2 text-right text-sm font-semibold text-ink-900">
                      {t.amount}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  })()

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-ink-200 bg-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-flare-500 to-flare-600 text-white shadow-sm">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink-900">QIE Pay</div>
              <div className="text-xs text-ink-500">Financiers</div>
            </div>
          </div>

          <div className="px-3">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">General</div>
            <div className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon
                const isActive = active === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{item.label}</span>
                    {item.key === 'dashboard' && (
                      <span className="ml-auto rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                        2
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-auto px-6 py-6">
            <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
              <div className="text-xs font-semibold text-ink-700">Connected</div>
              <div className="mt-2 text-xs text-ink-600">{address.slice(0, 6)}...{address.slice(-4)}</div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-ink-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
              <div className="min-w-0">
                <div className="text-xs font-medium text-ink-500">Dashboard</div>
                <div className="mt-1 text-lg font-semibold text-ink-900">Overview</div>
              </div>

              <div className="hidden flex-1 items-center justify-center lg:flex">
                <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2">
                  <Search className="h-4 w-4 text-ink-500" />
                  <input
                    className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                    placeholder="Search"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-flare-500 px-4 py-2 text-sm font-semibold text-white hover:bg-flare-600"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Send
                </button>
                <button
                  onClick={() => setActive('settings')}
                  className="inline-flex items-center justify-center rounded-2xl border border-ink-200 bg-white p-2 text-ink-700 hover:bg-ink-50"
                >
                  <SettingsIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            {content}
          </div>
        </main>
      </div>

      <SendPaymentModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        senderEmail={email ?? undefined}
        onSend={async (data) => {
          if (!routerAddress || !tokenAddress || !address) throw new Error('Router not ready')
          setTxError(null)
          try {
            const provider = getBrowserProvider()
            const signer = await getSigner()
            const token = getErc20(tokenAddress, provider)
            const decimals = (await token.decimals()) as number
            const amount = parseUnits(String(data.amount), decimals)
            const totalRequired = amount + (amount * savePctBps) / 10000n
            const allowance = await erc20Allowance(tokenAddress, address, routerAddress, provider)
            if (allowance < totalRequired) {
              await erc20Approve(tokenAddress, routerAddress, totalRequired, signer)
            }
            await smartRouterPayAndSave(routerAddress, tokenAddress, String(data.recipient), amount, signer)
            await refresh()
          } catch (e: any) {
            setTxError(e?.message ?? 'Failed to send')
            throw e
          }
        }}
      />
    </div>
  )
}
