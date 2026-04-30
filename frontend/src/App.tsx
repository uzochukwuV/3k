import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import AppShell from './components/layout/AppShell'
import ConnectScreen from './components/wallet/ConnectScreen'
import { useWallet } from './context/WalletContext'
import HomePage from './pages/HomePage'
import ActivityPage from './pages/ActivityPage'
import PortfolioPage from './pages/PortfolioPage'
import SettingsPage from './pages/SettingsPage'

function AppRoutes() {
  const { address, isCorrectNetwork, switchNetwork } = useWallet()

  if (!address) return <ConnectScreen />

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-2xl bg-navy-800 border border-white/10 p-6 text-center shadow-card">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-300">
            !
          </div>
          <h1 className="text-xl font-bold text-white">Switch to QIE Network</h1>
          <p className="mt-2 text-sm text-slate-400">
            QIE Pay needs the QIE Network selected before you can manage your wallet.
          </p>
          <button
            onClick={switchNetwork}
            className="mt-5 w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Switch Network
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppShell>
  )
}

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </WalletProvider>
  )
}

export default App
