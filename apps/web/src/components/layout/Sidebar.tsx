import { NavLink } from 'react-router-dom'
import { LogoMark } from '../Logo'

const NAV_ITEMS = [
  { to: '/start', label: 'Practice', icon: PracticeIcon },
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
  { to: '/badges', label: 'Badges', icon: BadgesIcon },
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
            <item.icon className="w-4 h-4 shrink-0" />
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

function PracticeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 3l8 5-8 5V3z" />
    </svg>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}

function LeaderboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 10v4M8 6v8M12 8v6" />
    </svg>
  )
}

function BadgesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5z" />
    </svg>
  )
}
