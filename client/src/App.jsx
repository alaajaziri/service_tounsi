import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import StatusBox from './components/StatusBox'
import { StatusProvider } from './contexts/StatusContext'
import BeardAdvisor from './pages/BeardAdvisor'
import HaircutAdvisor from './pages/HaircutAdvisor'
import CarDamageScan from './pages/CarDamageScan'
import FridgeToRecipe from './pages/FridgeToRecipe'
import OutfitStylist from './pages/OutfitStylist'
import PremiumInk from './pages/PremiumInk'
import Home from './pages/Home'
import AnalysisResult from './pages/AnalysisResult'

function AppContent() {
  const location = useLocation()
  const isResultPage = location.pathname.startsWith('/result/')

  return (
    <div className="min-h-screen bg-background text-on-background">
      {!isResultPage ? <StatusBox /> : null}
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/beard" element={<BeardAdvisor />} />
        <Route path="/haircut" element={<HaircutAdvisor />} />
        <Route path="/car" element={<CarDamageScan />} />
        <Route path="/fridge" element={<FridgeToRecipe />} />
        <Route path="/outfit" element={<OutfitStylist />} />
        <Route path="/premium" element={<PremiumInk />} />
        <Route path="/result/:serviceId" element={<AnalysisResult />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <StatusProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </StatusProvider>
  )
}
