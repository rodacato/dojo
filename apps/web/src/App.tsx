import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { RequireCreator } from './components/RequireCreator'
import { AppShell } from './components/layout/AppShell'
import { PageLoader } from './components/PageLoader'
import { ToastContainer } from './components/ui/Toast'

// Critical path — eager loaded
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { DayStartPage } from './pages/DayStartPage'
import { KataSelectionPage } from './pages/KataSelectionPage'
import { KataActivePage } from './pages/KataActivePage'
import { SenseiEvalPage } from './pages/SenseiEvalPage'
import { ResultsPage } from './pages/ResultsPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { ErrorPage } from './pages/ErrorPage'

// Non-critical — lazy loaded
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const InviteRedeemPage = lazy(() => import('./pages/InviteRedeemPage').then(m => ({ default: m.InviteRedeemPage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage').then(m => ({ default: m.ChangelogPage })))
const OpenSourcePage = lazy(() => import('./pages/OpenSourcePage').then(m => ({ default: m.OpenSourcePage })))
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage').then(m => ({ default: m.PublicProfilePage })))
const SharePage = lazy(() => import('./pages/SharePage').then(m => ({ default: m.SharePage })))
const LearnPage = lazy(() => import('./pages/LearnPage').then(m => ({ default: m.LearnPage })))
const CoursePlayerPage = lazy(() => import('./pages/CoursePlayerPage').then(m => ({ default: m.CoursePlayerPage })))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const BadgesPage = lazy(() => import('./pages/BadgesPage').then(m => ({ default: m.BadgesPage })))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminExercisesPage = lazy(() => import('./pages/admin/AdminExercisesPage').then(m => ({ default: m.AdminExercisesPage })))
const AdminNewExercisePage = lazy(() => import('./pages/admin/AdminNewExercisePage').then(m => ({ default: m.AdminNewExercisePage })))
const AdminEditExercisePage = lazy(() => import('./pages/admin/AdminEditExercisePage').then(m => ({ default: m.AdminEditExercisePage })))
const AdminInvitationsPage = lazy(() => import('./pages/admin/AdminInvitationsPage').then(m => ({ default: m.AdminInvitationsPage })))
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage').then(m => ({ default: m.AdminCoursesPage })))

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          {/* Public — eager */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/error" element={<ErrorPage />} />

          {/* Public — lazy */}
          <Route path="/invite/:token" element={<LazyRoute><InviteRedeemPage /></LazyRoute>} />
          <Route path="/terms" element={<LazyRoute><TermsPage /></LazyRoute>} />
          <Route path="/privacy" element={<LazyRoute><PrivacyPage /></LazyRoute>} />
          <Route path="/changelog" element={<LazyRoute><ChangelogPage /></LazyRoute>} />
          <Route path="/open-source" element={<LazyRoute><OpenSourcePage /></LazyRoute>} />
          <Route path="/u/:username" element={<LazyRoute><PublicProfilePage /></LazyRoute>} />
          <Route path="/share/:id" element={<LazyRoute><SharePage /></LazyRoute>} />
          <Route path="/learn" element={<LazyRoute><LearnPage /></LazyRoute>} />
          <Route path="/learn/:slug" element={<LazyRoute><CoursePlayerPage /></LazyRoute>} />

          {/* Protected — AppShell wraps all auth routes */}
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              {/* Eager (critical path) */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/start" element={<DayStartPage />} />
              <Route path="/kata" element={<KataSelectionPage />} />
              <Route path="/kata/:id" element={<KataActivePage />} />
              <Route path="/kata/:id/eval" element={<SenseiEvalPage />} />
              <Route path="/kata/:id/result" element={<ResultsPage />} />

              {/* Lazy */}
              <Route path="/history" element={<LazyRoute><HistoryPage /></LazyRoute>} />
              <Route path="/leaderboard" element={<LazyRoute><LeaderboardPage /></LazyRoute>} />
              <Route path="/badges" element={<LazyRoute><BadgesPage /></LazyRoute>} />
            </Route>

            {/* Admin — own layout (AdminLayout has its own sidebar, so it
                 should not be wrapped by AppShell's Sidebar/BottomNav). */}
            <Route
              path="/admin"
              element={
                <LazyRoute>
                  <RequireCreator>
                    <AdminLayout />
                  </RequireCreator>
                </LazyRoute>
              }
            >
              <Route index element={<Navigate to="/admin/exercises" replace />} />
              <Route path="exercises" element={<LazyRoute><AdminExercisesPage /></LazyRoute>} />
              <Route path="exercises/new" element={<LazyRoute><AdminNewExercisePage /></LazyRoute>} />
              <Route path="exercises/:id/edit" element={<LazyRoute><AdminEditExercisePage /></LazyRoute>} />
              <Route path="invitations" element={<LazyRoute><AdminInvitationsPage /></LazyRoute>} />
              <Route path="courses" element={<LazyRoute><AdminCoursesPage /></LazyRoute>} />
            </Route>
          </Route>

          <Route path="*" element={<LazyRoute><NotFoundPage /></LazyRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
