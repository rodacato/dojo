import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon, type IconName } from '../ui/Icon'

type NavItem = { to: string; label: string; icon: IconName; name?: string }

const BASE_NAV: NavItem[] = [
  { to: '/dashboard', label: 'dash', name: 'dashboard', icon: 'dashboard' },
  { to: '/katas', label: 'katas', icon: 'katas' },
  { to: '/scrolls', label: 'scrolls', icon: 'scrolls' },
  { to: '/belts', label: 'belts', icon: 'belts' },
]

export function BottomNav() {
  const { user } = useAuth()
  const items: NavItem[] = [
    ...BASE_NAV,
    user
      ? { to: '/settings', label: 'settings', icon: 'settings' }
      : { to: '/engawa', label: 'engawa', icon: 'engawa' },
  ]

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 bg-page border-t border-border px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
    >
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} aria-label={item.name} className="nav-item nav-item-tab">
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
