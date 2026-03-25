import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/start', label: 'Practice', icon: '⟩' },
  { to: '/dashboard', label: 'Home', icon: '◫' },
  { to: '/leaderboard', label: 'Board', icon: '≡' },
  { to: '/badges', label: 'Badges', icon: '◆' },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border/40 z-40">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-mono transition-colors ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <span className="text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
