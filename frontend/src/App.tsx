import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import PaymentDashboard from './pages/PaymentDashboard'
import PaymentFlow from './pages/PaymentFlow'

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PaymentDashboard initialActive="dashboard" />} />
          <Route path="/dashboard" element={<PaymentDashboard />} />
          <Route path="/receipts" element={<PaymentDashboard initialActive="receipts" />} />
          <Route path="/settings" element={<PaymentDashboard initialActive="settings" />} />
          <Route path="/jackpot" element={<PaymentDashboard initialActive="jackpot" />} />
          <Route path="/pay/:routerAddress" element={<PaymentFlow />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  )
}

export default App
