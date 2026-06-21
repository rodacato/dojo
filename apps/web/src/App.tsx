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
import { KatasPage } from './pages/KatasPage'
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
const ScrollSharePage = lazyWithRetry(() => import('./pages/ScrollSharePage').then(m => ({ default: m.ScrollSharePage })))
const ScrollsPage = lazyWithRetry(() => import('./pages/ScrollsPage').then(m => ({ default: m.ScrollsPage })))
const ScrollLandingPage = lazyWithRetry(() => import('./pages/ScrollLandingPage').then(m => ({ default: m.ScrollLandingPage })))
const ScrollPlayerPage = lazyWithRetry(() => import('./pages/ScrollPlayerPage').then(m => ({ default: m.ScrollPlayerPage })))
const BeltsPage = lazyWithRetry(() => import('./pages/BeltsPage').then(m => ({ default: m.BeltsPage })))
const KumitePlaceholderPage = lazyWithRetry(() => import('./pages/KumitePlaceholderPage').then(m => ({ default: m.KumitePlaceholderPage })))
const AdminLayout = lazyWithRetry(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminKatasPage = lazyWithRetry(() => import('./pages/admin/AdminKatasPage').then(m => ({ default: m.AdminKatasPage })))
const AdminNewKataPage = lazyWithRetry(() => import('./pages/admin/AdminNewKataPage').then(m => ({ default: m.AdminNewKataPage })))
const AdminEditKataPage = lazyWithRetry(() => import('./pages/admin/AdminEditKataPage').then(m => ({ default: m.AdminEditKataPage })))
const AdminInvitationsPage = lazyWithRetry(() => import('./pages/admin/AdminInvitationsPage').then(m => ({ default: m.AdminInvitationsPage })))
const AdminScrollsPage = lazyWithRetry(() => import('./pages/admin/AdminScrollsPage').then(m => ({ default: m.AdminScrollsPage })))
const AdminErrorsPage = lazyWithRetry(() => import('./pages/admin/AdminErrorsPage').then(m => ({ default: m.AdminErrorsPage })))
const AdminHealthPage = lazyWithRetry(() => import('./pages/admin/AdminHealthPage').then(m => ({ default: m.AdminHealthPage })))
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const EngawaPage = lazyWithRetry(() => import('./pages/EngawaPage').then(m => ({ default: m.EngawaPage })))
import { OptionalSidebarLayout } from './components/layout/OptionalSidebarLayout'

function LazyRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
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
          <Route path="/share/scroll/:slug/:userId" element={<LazyRoute><ScrollSharePage /></LazyRoute>} />
          <Route path="/scrolls" element={<LazyRoute><ScrollsPage /></LazyRoute>} />
          <Route path="/scrolls/:slug" element={<LazyRoute><ScrollLandingPage /></LazyRoute>} />
          <Route path="/scrolls/:slug/:stepId" element={<LazyRoute><ScrollPlayerPage /></LazyRoute>} />
          <Route element={<OptionalSidebarLayout />}>
            <Route path="/engawa" element={<LazyRoute><EngawaPage /></LazyRoute>} />
            <Route path="/engawa/:language" element={<LazyRoute><EngawaPage /></LazyRoute>} />
          </Route>

          {/* Protected — AppShell wraps all auth routes */}
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              {/* Eager (critical path) */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/katas" element={<KatasPage />} />
              <Route path="/katas/:id" element={<KataActivePage />} />
              <Route path="/katas/:id/eval" element={<SenseiEvalPage />} />
              <Route path="/katas/:id/result" element={<ResultsPage />} />

              {/* Lazy */}
              <Route path="/history" element={<LazyRoute><HistoryPage /></LazyRoute>} />
              <Route path="/kumite" element={<LazyRoute><KumitePlaceholderPage /></LazyRoute>} />
              <Route path="/belts" element={<LazyRoute><BeltsPage /></LazyRoute>} />
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
              <Route index element={<Navigate to="/admin/katas" replace />} />
              <Route path="katas" element={<LazyRoute><AdminKatasPage /></LazyRoute>} />
              <Route path="katas/new" element={<LazyRoute><AdminNewKataPage /></LazyRoute>} />
              <Route path="katas/:id/edit" element={<LazyRoute><AdminEditKataPage /></LazyRoute>} />
              <Route path="invitations" element={<LazyRoute><AdminInvitationsPage /></LazyRoute>} />
              <Route path="scrolls" element={<LazyRoute><AdminScrollsPage /></LazyRoute>} />
              <Route path="errors" element={<LazyRoute><AdminErrorsPage /></LazyRoute>} />
              <Route path="health" element={<LazyRoute><AdminHealthPage /></LazyRoute>} />
            </Route>
          </Route>

          <Route path="*" element={<LazyRoute><NotFoundPage /></LazyRoute>} />
        </Routes>
      </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
