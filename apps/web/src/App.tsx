import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { RequireCreator } from './components/RequireCreator'
import { AppShell } from './components/layout/AppShell'
import { PageLoader } from './components/PageLoader'
import { ToastContainer } from './components/ui/Toast'
import { lazyWithRetry } from './lib/lazyWithRetry'

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
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const InviteRedeemPage = lazyWithRetry(() => import('./pages/InviteRedeemPage').then(m => ({ default: m.InviteRedeemPage })))
const HistoryPage = lazyWithRetry(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })))
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const ChangelogPage = lazyWithRetry(() => import('./pages/ChangelogPage').then(m => ({ default: m.ChangelogPage })))
const OpenSourcePage = lazyWithRetry(() => import('./pages/OpenSourcePage').then(m => ({ default: m.OpenSourcePage })))
const PublicProfilePage = lazyWithRetry(() => import('./pages/PublicProfilePage').then(m => ({ default: m.PublicProfilePage })))
const SharePage = lazyWithRetry(() => import('./pages/SharePage').then(m => ({ default: m.SharePage })))
const CourseSharePage = lazyWithRetry(() => import('./pages/CourseSharePage').then(m => ({ default: m.CourseSharePage })))
const LearnPage = lazyWithRetry(() => import('./pages/LearnPage').then(m => ({ default: m.LearnPage })))
const CoursePlayerPage = lazyWithRetry(() => import('./pages/CoursePlayerPage').then(m => ({ default: m.CoursePlayerPage })))
const LeaderboardPage = lazyWithRetry(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const BadgesPage = lazyWithRetry(() => import('./pages/BadgesPage').then(m => ({ default: m.BadgesPage })))
const AdminLayout = lazyWithRetry(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminExercisesPage = lazyWithRetry(() => import('./pages/admin/AdminExercisesPage').then(m => ({ default: m.AdminExercisesPage })))
const AdminNewExercisePage = lazyWithRetry(() => import('./pages/admin/AdminNewExercisePage').then(m => ({ default: m.AdminNewExercisePage })))
const AdminEditExercisePage = lazyWithRetry(() => import('./pages/admin/AdminEditExercisePage').then(m => ({ default: m.AdminEditExercisePage })))
const AdminInvitationsPage = lazyWithRetry(() => import('./pages/admin/AdminInvitationsPage').then(m => ({ default: m.AdminInvitationsPage })))
const AdminCoursesPage = lazyWithRetry(() => import('./pages/admin/AdminCoursesPage').then(m => ({ default: m.AdminCoursesPage })))
const AdminErrorsPage = lazyWithRetry(() => import('./pages/admin/AdminErrorsPage').then(m => ({ default: m.AdminErrorsPage })))
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const PlaygroundPage = lazyWithRetry(() => import('./pages/PlaygroundPage').then(m => ({ default: m.PlaygroundPage })))
import { OptionalSidebarLayout } from './components/layout/OptionalSidebarLayout'

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
          <Route path="/share/course/:slug/:userId" element={<LazyRoute><CourseSharePage /></LazyRoute>} />
          <Route path="/learn" element={<LazyRoute><LearnPage /></LazyRoute>} />
          <Route path="/learn/:slug" element={<LazyRoute><CoursePlayerPage /></LazyRoute>} />
          <Route element={<OptionalSidebarLayout />}>
            <Route path="/playground" element={<LazyRoute><PlaygroundPage /></LazyRoute>} />
            <Route path="/playground/:language" element={<LazyRoute><PlaygroundPage /></LazyRoute>} />
          </Route>

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
              <Route path="/settings" element={<LazyRoute><SettingsPage /></LazyRoute>} />
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
              <Route path="errors" element={<LazyRoute><AdminErrorsPage /></LazyRoute>} />
            </Route>
          </Route>

          <Route path="*" element={<LazyRoute><NotFoundPage /></LazyRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
