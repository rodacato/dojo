import type { ReactElement } from 'react'
import { NavLink, Outlet, Link, useMatch } from 'react-router-dom'
import { LogoMark } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'
import { useIsMobile } from '../../hooks/useIsMobile'

interface NavItem {
  to: string
  label: string
  icon: (props: { className?: string }) => ReactElement
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin/katas', label: 'Katas', icon: GridIcon },
  { to: '/admin/scrolls', label: 'Scrolls', icon: BookIcon },
  { to: '/admin/invitations', label: 'Invitations', icon: MailIcon },
  { to: '/admin/errors', label: 'Errors', icon: AlertIcon },
  { to: '/admin/health', label: 'Health', icon: HeartIcon },
]

export function AdminLayout() {
  const onNewForm = useMatch('/admin/katas/new')
  const onEditForm = useMatch('/admin/katas/:id/edit')
  const onForm = Boolean(onNewForm ?? onEditForm)
  const isMobile = useIsMobile()

  return (
    <div className={`min-h-screen bg-page ${isMobile ? '' : 'flex'}`}>
      {isMobile ? <MobileHeader /> : <AdminSidebar />}

      <main
        className={`flex-1 overflow-y-auto ${isMobile && !onForm ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      {isMobile && !onForm && (
        <nav
          aria-label="Admin sections"
          className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border/40 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 min-h-14 flex flex-col items-center justify-center gap-0.5 font-mono text-xs transition-colors ${
                    isActive ? 'text-primary font-semibold' : 'text-secondary'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{label.toLowerCase()}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-4 px-4 border-b border-border bg-surface/50 backdrop-blur">
      <Link to="/admin/katas" className="flex items-center gap-2">
        <LogoMark size={20} className="text-accent shrink-0" />
        <span className="font-mono text-sm text-primary tracking-wider">
          dojo<span className="animate-cursor">_</span>
        </span>
        <span className="font-mono text-xs uppercase tracking-wider text-secondary">ADMIN</span>
      </Link>
      <Link
        to="/dashboard"
        className="h-11 inline-flex items-center font-mono text-xs uppercase tracking-wider text-secondary hover:text-primary transition-colors"
      >
        ← Back to dojo
      </Link>
    </header>
  )
}

function AdminSidebar() {
  const { user } = useAuth()

  return (
    <aside className="w-48 shrink-0 border-r border-border/40 bg-surface flex flex-col h-dvh sticky top-0">
      <div className="px-4 py-5 border-b border-border/20">
        <Link to="/admin/katas" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <LogoMark size={20} className="text-accent shrink-0" />
          <span className="font-mono text-sm text-primary tracking-wider">
            dojo<span className="animate-cursor">_</span>
          </span>
        </Link>
        <div className="mt-2 font-mono text-xs uppercase tracking-wider text-secondary">
          ADMIN
        </div>
      </div>

      <nav className="flex-1 py-3" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 h-8 text-sm transition-colors border-l-2 ${
                isActive
                  ? 'bg-elevated text-primary border-primary'
                  : 'text-secondary border-transparent hover:text-primary'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="flex items-center justify-between gap-2 px-3 h-8 text-sm text-muted border-l-2 border-transparent cursor-not-allowed">
          <span className="flex items-center gap-2">
            <PageIcon className="w-4 h-4 shrink-0" />
            <span>Pages</span>
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-secondary">
            PHASE 2
          </span>
        </div>
      </nav>

      <div className="border-t border-border/20 px-3 py-3">
        {user && (
          <div className="flex items-center gap-2 mb-2">
            <img
              src={user.avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm text-primary truncate">{user.username}</div>
              <div className="font-mono text-xs uppercase tracking-wider text-secondary">
                creator
              </div>
            </div>
          </div>
        )}
        <Link
          to="/dashboard"
          className="block font-mono text-xs uppercase tracking-wider text-secondary hover:text-primary transition-colors"
        >
          ← Back to dojo
        </Link>
      </div>
    </aside>
  )
}

function GridIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
    </svg>
  )
}

function BookIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
    </svg>
  )
}

function MailIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

function AlertIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function HeartIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12h4l2-5 4 10 2-5h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PageIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" />
      <path d="M14 3v6h6" />
    </svg>
  )
}
