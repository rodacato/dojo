import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { RequireCreator } from './components/RequireCreator'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { DayStartPage } from './pages/DayStartPage'
import { KataSelectionPage } from './pages/KataSelectionPage'
import { KataActivePage } from './pages/KataActivePage'
import { SenseiEvalPage } from './pages/SenseiEvalPage'
import { ResultsPage } from './pages/ResultsPage'
import { ErrorPage } from './pages/ErrorPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { InviteRedeemPage } from './pages/InviteRedeemPage'
import { HistoryPage } from './pages/HistoryPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminExercisesPage } from './pages/admin/AdminExercisesPage'
import { AdminNewExercisePage } from './pages/admin/AdminNewExercisePage'

export function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/invite/:token" element={<InviteRedeemPage />} />
          <Route path="/error" element={<ErrorPage />} />

          {/* Protected */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/start" element={<DayStartPage />} />
            <Route path="/kata" element={<KataSelectionPage />} />
            <Route path="/kata/:id" element={<KataActivePage />} />
            <Route path="/kata/:id/eval" element={<SenseiEvalPage />} />
            <Route path="/kata/:id/result" element={<ResultsPage />} />
            <Route
              path="/admin"
              element={
                <RequireCreator>
                  <AdminLayout />
                </RequireCreator>
              }
            >
              <Route index element={<Navigate to="/admin/exercises" replace />} />
              <Route path="exercises" element={<AdminExercisesPage />} />
              <Route path="exercises/new" element={<AdminNewExercisePage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
