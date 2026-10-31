import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LogoMark } from '../Logo'
import { useAuth } from '../../context/AuthContext'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Icon, type IconName } from '../ui/Icon'
import { ThemeToggle } from '../ui/ThemeToggle'

const NAV_ITEMS: Array<{ to: string; label: string; icon: IconName; soon?: boolean }> = [
  { to: '/dashboard', label: 'dashboard', icon: 'dashboard' },
  { to: '/katas', label: 'katas', icon: 'katas' },
  { to: '/scrolls', label: 'scrolls', icon: 'scrolls' },
  { to: '/engawa', label: 'engawa', icon: 'engawa' },
  { to: '/kumite', label: 'kumite', icon: 'kumite', soon: true },
  { to: '/belts', label: 'belts', icon: 'belts' },
]

const RAIL_CONTROL = 'nav-item w-full gap-1 px-0.5 rounded-sm whitespace-nowrap hover:bg-elevated'

export function Sidebar() {
  const { user, logout } = useAuth()
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  return (
    <aside
      aria-label="Sidebar"
      className="hidden md:flex flex-col w-24 shrink-0 h-dvh sticky top-0 bg-surface border-r border-border"
    >
      <div className="h-28 shrink-0 flex items-center justify-center border-b border-border">
        <Link
          to="/dashboard"
          aria-label="Dojo home"
          className="flex items-center justify-center w-20 min-h-22 hover:opacity-80 transition-opacity"
        >
          <LogoMark size={56} className="text-accent" />
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 min-h-0 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-item nav-item-rail">
            <Icon name={item.icon} />
            <span className="flex items-center gap-1">
              {item.label}
              {item.soon && <span className="text-secondary">soon</span>}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 px-2 pt-2 pb-3 border-t border-border">
        {user && (
          <p title={user.username} className="font-mono text-xs text-center text-secondary truncate mb-2">
            @{user.username}
          </p>
        )}
        <NavLink
          to="/settings"
          aria-label={user ? `Settings for ${user.username}` : 'Settings'}
          className={RAIL_CONTROL}
        >
          <Icon name="settings" size={16} />
          <span>settings</span>
        </NavLink>
        <ThemeToggle variant="rail" />
        <button type="button" onClick={() => setConfirmingSignOut(true)} className={RAIL_CONTROL}>
          <Icon name="signout" size={16} />
          <span>sign out</span>
        </button>
      </div>

      <ConfirmModal
        open={confirmingSignOut}
        onCancel={() => setConfirmingSignOut(false)}
        eyebrow="Sign out?"
        tone="muted"
        title="See you tomorrow."
        cancelLabel="Stay"
        primaryVariant="destructive"
        primaryLabel="Sign out"
        onConfirm={() => { void logout() }}
      >
        <p>You&apos;ll lose your session. Active kata in progress will be lost.</p>
      </ConfirmModal>
    </aside>
  )
}
