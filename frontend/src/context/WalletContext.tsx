import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface WalletContextType {
  address: string | null
  chainId: number | null
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  isCorrectNetwork: boolean
  switchNetwork: () => Promise<void>
}

const QIE_CHAIN_ID = 1990
const QIE_NETWORK_CONFIG = {
  chainId: `0x${QIE_CHAIN_ID.toString(16)}`,
  chainName: 'QIE Network',
  nativeCurrency: {
    name: 'QIE',
    symbol: 'QIE',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.qiblockchain.online'],
  blockExplorerUrls: ['https://explorer.qiblockchain.online'],
}

const WalletContext = createContext<WalletContextType | null>(null)

const toStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [])
const toChainId = (value: unknown): number | null => (typeof value === 'string' ? parseInt(value, 16) : null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const isCorrectNetwork = chainId === QIE_CHAIN_ID

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then((value) => {
        const accounts = toStringArray(value)
        if (accounts.length > 0) {
          setAddress(accounts[0])
        }
      })

      window.ethereum.request({ method: 'eth_chainId' }).then((value) => {
        setChainId(toChainId(value))
      })

      window.ethereum.on('accountsChanged', (value: unknown) => {
        const accounts = toStringArray(value)
        setAddress(accounts.length > 0 ? accounts[0] : null)
      })

      window.ethereum.on('chainChanged', (value: unknown) => {
        setChainId(toChainId(value))
      })
    }
  }, [])

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      window.open('https://metamask.io', '_blank')
      return
    }

    setIsConnecting(true)
    try {
      const accounts = toStringArray(await window.ethereum.request({ method: 'eth_requestAccounts' }))
      setAddress(accounts[0])

      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
      setChainId(toChainId(chainIdHex))
    } catch (err) {
      console.error('Failed to connect:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
  }

  const switchNetwork = async () => {
    if (typeof window.ethereum === 'undefined') return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: QIE_NETWORK_CONFIG.chainId }],
      })
    } catch (switchError: unknown) {
      const error = switchError as { code: number }
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [QIE_NETWORK_CONFIG],
        })
      }
    }
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnecting,
        connect,
        disconnect,
        isCorrectNetwork,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}
