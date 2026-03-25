import { NavLink } from 'react-router-dom'
import { LogoMark } from '../Logo'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'dashboard', icon: DashboardIcon },
  { to: '/start', label: 'practice', icon: CodeIcon },
  { to: '/leaderboard', label: 'leaderboard', icon: AnalyticsIcon },
  { to: '/badges', label: 'badges', icon: BadgesIcon },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
            dojo<span className="text-accent animate-pulse">_</span>
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

function BadgesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.43V2H7v8.43c0 .35.18.68.49.86l4.18 2.51-.99 2.34-3.41.29 2.59 2.24L9.07 22 12 20.23 14.93 22l-.79-3.33 2.59-2.24-3.41-.29-.99-2.34 4.18-2.51c.31-.18.49-.51.49-.86zM13 12.12l-1 .6-1-.6V4h2v8.12z" />
    </svg>
  )
}
