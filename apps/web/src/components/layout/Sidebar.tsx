import { NavLink } from 'react-router-dom'
import { LogoMark } from '../Logo'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'dashboard', icon: DashboardIcon },
  { to: '/start', label: 'practice', icon: CodeIcon },
  { to: '/learn', label: 'learn', icon: LearnIcon },
  { to: '/playground', label: 'playground', icon: TerminalIcon },
  { to: '/leaderboard', label: 'leaderboard', icon: AnalyticsIcon },
  { to: '/badges', label: 'badges', icon: BadgesIcon },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth()

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-surface border-r border-border/40 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-48'
      }`}
    >
      {/* Logo */}
      <NavLink to="/dashboard" className="flex items-center gap-2 px-4 py-5 border-b border-border/20 hover:opacity-80 transition-opacity overflow-hidden">
        <LogoMark size={20} className="text-primary shrink-0" />
        {!collapsed && (
          <span className="font-mono text-sm text-primary tracking-wider whitespace-nowrap">
            dojo<span className="text-accent animate-cursor">_</span>
          </span>
        )}
      </NavLink>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-colors ${
                isActive
                  ? 'text-accent border-l-2 border-accent bg-accent/5'
                  : 'text-muted hover:text-secondary border-l-2 border-transparent'
              } ${collapsed ? 'justify-center px-2' : ''}`
            }
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Account — settings + logout */}
      <div className="border-t border-border/20">
        <NavLink
          to="/settings"
          title="settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-colors ${
              isActive
                ? 'text-accent border-l-2 border-accent bg-accent/5'
                : 'text-muted hover:text-secondary border-l-2 border-transparent'
            } ${collapsed ? 'justify-center px-2' : ''}`
          }
        >
          <CogIcon className="w-4.5 h-4.5 shrink-0" />
          {!collapsed && <span className="truncate">{user?.username ?? 'settings'}</span>}
        </NavLink>
        <button
          onClick={() => { void logout() }}
          title="log out"
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-mono text-muted hover:text-secondary transition-colors border-l-2 border-transparent ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogoutIcon className="w-4.5 h-4.5 shrink-0" />
          {!collapsed && <span>log out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="px-4 py-3 text-muted/40 text-xs font-mono hover:text-muted transition-colors border-t border-border/20"
      >
        {collapsed ? '→' : '← collapse'}
      </button>
    </aside>
  )
}

/* ── Material Symbols–style SVG icons ── */

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  )
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
    </svg>
  )
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
    </svg>
  )
}

function LearnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
    </svg>
  )
}

function BadgesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.43V2H7v8.43c0 .35.18.68.49.86l4.18 2.51-.99 2.34-3.41.29 2.59 2.24L9.07 22 12 20.23 14.93 22l-.79-3.33 2.59-2.24-3.41-.29-.99-2.34 4.18-2.51c.31-.18.49-.51.49-.86zM13 12.12l-1 .6-1-.6V4h2v8.12z" />
    </svg>
  )
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.484.484 0 0 0 13.79 2h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.6 8.47c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  )
}

function TerminalIcon({ className }: { className?: string }) {
  // A small terminal/console glyph — matches the "sandbox to try code" intent
  // and reads as distinct from the practice (chevrons) and learn (mortar)
  // icons next to it.
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5.7 16.3l-1.41-1.41L7.17 12 4.29 9.12 5.7 7.7 10 12l-4.3 4.3zM20 17h-8v-2h8v2z" />
    </svg>
  )
}
