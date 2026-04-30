import { useEffect, useMemo, useState } from 'react'
import { formatUnits, parseUnits } from 'ethers'
import { Crown, Loader2, Plus, ThumbsUp, Users } from 'lucide-react'
import { useWallet } from '../context/WalletContext'
import { erc20Allowance, erc20Approve, getBrowserProvider, getContractAddresses, getErc20, getSigner, getSocialJackpot } from '../contracts'

type RoomState = 'Open' | 'Voting' | 'Closed'

type RoomRow = {
  id: bigint
  creator: string
  token: string
  entryFee: bigint
  maxParticipants: bigint
  numWinners: bigint
  state: RoomState
  totalVotesCast: bigint
}

type ParticipantRow = {
  address: string
  pitch: string
  votesReceived: bigint
  hasVoted: boolean
}

function short(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function stateLabel(n: number): RoomState {
  if (n === 0) return 'Open'
  if (n === 1) return 'Voting'
  return 'Closed'
}

function formatAmount(value: bigint, decimals: number) {
  const raw = formatUnits(value, decimals)
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export default function SocialJackpot() {
  const { address, chainId } = useWallet()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [jackpotAddress, setJackpotAddress] = useState<string | null>(null)
  const [tokenAddress, setTokenAddress] = useState<string | null>(null)
  const [tokenSymbol, setTokenSymbol] = useState('TOKEN')
  const [tokenDecimals, setTokenDecimals] = useState(18)

  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<bigint | null>(null)
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<string>('')

  const [pitch, setPitch] = useState('')
  const [createToken, setCreateToken] = useState('')
  const [createEntryFee, setCreateEntryFee] = useState('10')
  const [createMaxParticipants, setCreateMaxParticipants] = useState('5')
  const [createNumWinners, setCreateNumWinners] = useState('2')

  const [isCreating, setIsCreating] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId) ?? null, [rooms, selectedRoomId])

  useEffect(() => {
    if (!chainId) return
    const addrs = getContractAddresses(chainId)
    setJackpotAddress(addrs?.jackpot ?? null)
    setTokenAddress(addrs?.mockQusdc ?? null)
    setCreateToken(addrs?.mockQusdc ?? '')
  }, [chainId])

  const refreshTokenMeta = async () => {
    if (!tokenAddress) return
    try {
      const provider = getBrowserProvider()
      const token = getErc20(tokenAddress, provider)
      const [symbol, decimals] = await Promise.all([token.symbol() as Promise<string>, token.decimals() as Promise<number>])
      setTokenSymbol(symbol)
      setTokenDecimals(decimals)
    } catch {}
  }

  useEffect(() => {
    void refreshTokenMeta()
  }, [tokenAddress])

  const refreshRooms = async () => {
    if (!jackpotAddress) return
    setIsLoading(true)
    setError(null)

    try {
      const provider = getBrowserProvider()
      const jackpot = getSocialJackpot(jackpotAddress, provider)
      const nextRoomId = (await jackpot.nextRoomId()) as bigint
      const last = Number(nextRoomId)
      const start = Math.max(last - 20, 0)
      const ids = Array.from({ length: last - start }, (_, i) => BigInt(start + i)).reverse()

      const fetched = await Promise.all(
        ids.map(async (id) => {
          const r = (await jackpot.rooms(id)) as {
            id: bigint
            creator: string
            token: string
            entryFee: bigint
            maxParticipants: bigint
            numWinners: bigint
            state: number
            totalVotesCast: bigint
          }
          return {
            id: r.id,
            creator: r.creator,
            token: r.token,
            entryFee: r.entryFee,
            maxParticipants: r.maxParticipants,
            numWinners: r.numWinners,
            state: stateLabel(r.state),
            totalVotesCast: r.totalVotesCast,
          } as RoomRow
        }),
      )

      setRooms(fetched)
      if (selectedRoomId === null && fetched.length > 0) setSelectedRoomId(fetched[0].id)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load rooms')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshParticipants = async (roomId: bigint) => {
    if (!jackpotAddress) return
    setError(null)

    try {
      const provider = getBrowserProvider()
      const jackpot = getSocialJackpot(jackpotAddress, provider)
      const filter = jackpot.filters.UserEntered(roomId)
      const logs = (await jackpot.queryFilter(filter, 0, 'latest')) as any[]
      const users = logs.map((l) => (l.args.user as string).toLowerCase())
      const unique = Array.from(new Set(users))
      const list = await Promise.all(
        unique.map(async (u) => {
          const addr = (logs.find((l) => String(l.args.user).toLowerCase() === u)?.args.user as string) ?? ''
          const info = (await jackpot.getParticipantInfo(roomId, addr)) as [string, bigint, boolean]
          return { address: addr, pitch: info[0], votesReceived: info[1], hasVoted: info[2] } as ParticipantRow
        }),
      )
      list.sort((a, b) => Number(b.votesReceived - a.votesReceived))
      setParticipants(list)
      if (!selectedCandidate && list.length > 0) setSelectedCandidate(list[0].address)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load participants')
    }
  }

  useEffect(() => {
    if (!jackpotAddress) return
    void refreshRooms()
  }, [jackpotAddress])

  useEffect(() => {
    if (selectedRoomId === null) return
    void refreshParticipants(selectedRoomId)
  }, [selectedRoomId])

  const handleCreateRoom = async () => {
    if (!jackpotAddress) return
    const token = createToken.trim()
    if (!token.startsWith('0x') || token.length !== 42) {
      setError('Enter a valid token address')
      return
    }

    const entryFee = parseUnits(createEntryFee || '0', tokenDecimals)
    const maxParticipants = BigInt(createMaxParticipants || '0')
    const numWinners = BigInt(createNumWinners || '0')

    setIsCreating(true)
    setError(null)
    try {
      const signer = await getSigner()
      const jackpot = getSocialJackpot(jackpotAddress, signer)
      const tx = await jackpot.createRoom(token, entryFee, maxParticipants, numWinners)
      await tx.wait()
      await refreshRooms()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEnterRoom = async () => {
    if (!jackpotAddress || !selectedRoom || !address || !tokenAddress) return
    setIsEntering(true)
    setError(null)
    try {
      const provider = getBrowserProvider()
      const signer = await getSigner()
      const allowance = await erc20Allowance(tokenAddress, address, jackpotAddress, provider)
      if (allowance < selectedRoom.entryFee) {
        await erc20Approve(tokenAddress, jackpotAddress, selectedRoom.entryFee, signer)
      }
      const jackpot = getSocialJackpot(jackpotAddress, signer)
      const tx = await jackpot.enterRoom(selectedRoom.id, pitch)
      await tx.wait()
      setPitch('')
      await refreshRooms()
      await refreshParticipants(selectedRoom.id)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to enter room')
    } finally {
      setIsEntering(false)
    }
  }

  const handleVote = async () => {
    if (!jackpotAddress || !selectedRoom || !selectedCandidate) return
    setIsVoting(true)
    setError(null)
    try {
      const signer = await getSigner()
      const jackpot = getSocialJackpot(jackpotAddress, signer)
      const tx = await jackpot.vote(selectedRoom.id, selectedCandidate)
      await tx.wait()
      await refreshRooms()
      await refreshParticipants(selectedRoom.id)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to vote')
    } finally {
      setIsVoting(false)
    }
  }

  const hasJoined = useMemo(() => {
    if (!address) return false
    return participants.some((p) => p.address.toLowerCase() === address.toLowerCase())
  }, [participants, address])

  const me = useMemo(() => {
    if (!address) return null
    return participants.find((p) => p.address.toLowerCase() === address.toLowerCase()) ?? null
  }, [participants, address])

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4">
        <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-ink-900">Social Jackpot</div>
              <div className="mt-2 text-xs text-ink-500">Create rooms, pitch, vote, and win.</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-50 text-ink-700 ring-1 ring-ink-200">
              <Crown className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-ink-200 bg-ink-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Create Room</div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-ink-600">Token</div>
              <input
                value={createToken}
                onChange={(e) => setCreateToken(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-flare-500"
                placeholder="0x..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-ink-600">Entry Fee</div>
                <input
                  value={createEntryFee}
                  onChange={(e) => setCreateEntryFee(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-flare-500"
                  placeholder="10"
                />
                <div className="text-[11px] text-ink-500">{tokenSymbol}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-ink-600">Max Players</div>
                <input
                  value={createMaxParticipants}
                  onChange={(e) => setCreateMaxParticipants(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-flare-500"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-ink-600">Winners</div>
                <input
                  value={createNumWinners}
                  onChange={(e) => setCreateNumWinners(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-flare-500"
                  placeholder="2"
                />
              </div>

              <button
                onClick={() => void handleCreateRoom()}
                disabled={isCreating || !jackpotAddress}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </button>
            </div>

            {jackpotAddress && (
              <div className="pt-2 text-[11px] text-ink-500">
                Contract: {short(jackpotAddress)}
              </div>
            )}
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="mt-6 rounded-3xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-ink-900">Rooms</div>
            <button
              onClick={() => void refreshRooms()}
              disabled={isLoading}
              className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {rooms.length === 0 && (
              <div className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-6 text-sm text-ink-600">
                No rooms yet.
              </div>
            )}

            {rooms.map((r) => {
              const active = r.id === selectedRoomId
              return (
                <button
                  key={r.id.toString()}
                  onClick={() => setSelectedRoomId(r.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                    active ? 'border-ink-300 bg-ink-50' : 'border-ink-200 bg-white hover:bg-ink-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-ink-900">Room #{r.id.toString()}</div>
                    <div className="rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                      {r.state}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
                    <div>Entry: {formatAmount(r.entryFee, tokenDecimals)} {tokenSymbol}</div>
                    <div className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {r.maxParticipants.toString()}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
        <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink-900">Room Details</div>
              {selectedRoom ? (
                <div className="mt-2 text-xs text-ink-500">
                  #{selectedRoom.id.toString()} • Creator {short(selectedRoom.creator)} • Token {short(selectedRoom.token)}
                </div>
              ) : (
                <div className="mt-2 text-xs text-ink-500">Select a room to view details</div>
              )}
            </div>
            {selectedRoom && (
              <div className="flex items-center gap-2">
                <div className="rounded-2xl border border-ink-200 bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-700">
                  Pot: {formatAmount(selectedRoom.entryFee * selectedRoom.maxParticipants, tokenDecimals)} {tokenSymbol}
                </div>
                <div className="rounded-2xl border border-ink-200 bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-700">
                  Winners: {selectedRoom.numWinners.toString()}
                </div>
              </div>
            )}
          </div>

          {selectedRoom && (
            <div className="mt-6 grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-5">
                <div className="rounded-3xl border border-ink-200 bg-ink-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Join</div>
                  <div className="mt-2 text-sm font-semibold text-ink-900">
                    Entry fee: {formatAmount(selectedRoom.entryFee, tokenDecimals)} {tokenSymbol}
                  </div>
                  <div className="mt-1 text-xs text-ink-600">
                    State: {selectedRoom.state} • Votes cast: {selectedRoom.totalVotesCast.toString()}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-ink-700">Your pitch</div>
                    <textarea
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                      className="h-24 w-full resize-none rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-flare-500"
                      placeholder="Why should people vote for you?"
                    />
                  </div>

                  <button
                    onClick={() => void handleEnterRoom()}
                    disabled={isEntering || selectedRoom.state !== 'Open' || hasJoined || !tokenAddress}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-flare-500 px-4 py-3 text-sm font-semibold text-white hover:bg-flare-600 disabled:opacity-60"
                  >
                    {isEntering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {hasJoined ? 'Joined' : 'Enter Room'}
                  </button>

                  {me && (
                    <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-4">
                      <div className="text-xs font-semibold text-ink-700">Your status</div>
                      <div className="mt-2 text-xs text-ink-600">Votes received: {me.votesReceived.toString()}</div>
                      <div className="mt-1 text-xs text-ink-600">Has voted: {me.hasVoted ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-12 xl:col-span-7">
                <div className="rounded-3xl border border-ink-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Participants</div>
                    <button
                      onClick={() => selectedRoomId !== null && void refreshParticipants(selectedRoomId)}
                      className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {participants.length === 0 && (
                      <div className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-6 text-sm text-ink-600">
                        No participants yet.
                      </div>
                    )}

                    {participants.map((p) => (
                      <div key={p.address} className="rounded-2xl border border-ink-200 bg-ink-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-ink-900">{short(p.address)}</div>
                            <div className="mt-1 text-xs text-ink-600">{p.pitch || '—'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                              {p.votesReceived.toString()} votes
                            </div>
                            {address && p.address.toLowerCase() === address.toLowerCase() && (
                              <div className="rounded-full bg-ink-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                                You
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedRoom.state === 'Voting' && address && (
                    <div className="mt-6 rounded-3xl border border-ink-200 bg-ink-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-ink-900">Vote</div>
                          <div className="mt-1 text-xs text-ink-600">Pick a candidate. You can vote only once.</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <select
                          value={selectedCandidate}
                          onChange={(e) => setSelectedCandidate(e.target.value)}
                          className="w-full rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-flare-500"
                        >
                          {participants
                            .filter((p) => p.address.toLowerCase() !== address.toLowerCase())
                            .map((p) => (
                              <option key={p.address} value={p.address}>
                                {short(p.address)}
                              </option>
                            ))}
                        </select>

                        <button
                          onClick={() => void handleVote()}
                          disabled={isVoting || !me || me.hasVoted || !selectedCandidate}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
                        >
                          {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                          {me?.hasVoted ? 'Voted' : 'Vote'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!selectedRoom && (
            <div className="mt-6 rounded-3xl border border-ink-200 bg-ink-50 px-6 py-10 text-center text-sm text-ink-600">
              Pick a room from the left to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
