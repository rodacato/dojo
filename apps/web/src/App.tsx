import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { RequireCreator } from './components/RequireCreator'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DayStartPage } from './pages/DayStartPage'
import { KataSelectionPage } from './pages/KataSelectionPage'
import { KataActivePage } from './pages/KataActivePage'
import { SenseiEvalPage } from './pages/SenseiEvalPage'
import { ResultsPage } from './pages/ResultsPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminExercisesPage } from './pages/admin/AdminExercisesPage'
import { AdminNewExercisePage } from './pages/admin/AdminNewExercisePage'

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
