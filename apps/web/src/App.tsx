import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DayStartPage } from './pages/DayStartPage'
import { KataSelectionPage } from './pages/KataSelectionPage'
import { KataActivePage } from './pages/KataActivePage'
import { SenseiEvalPage } from './pages/SenseiEvalPage'
import { ResultsPage } from './pages/ResultsPage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/start" element={<DayStartPage />} />
            <Route path="/kata" element={<KataSelectionPage />} />
            <Route path="/kata/:id" element={<KataActivePage />} />
            <Route path="/kata/:id/eval" element={<SenseiEvalPage />} />
            <Route path="/kata/:id/result" element={<ResultsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
