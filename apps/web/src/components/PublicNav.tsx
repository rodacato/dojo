import { Link, useLocation } from 'react-router-dom'
import { LogoWordmark } from './Logo'
import { buttonClasses } from './ui/Button'
import { API_URL } from '../lib/config'

const NAV_LINKS = [
  { to: '/open-source', label: 'Open source' },
  { to: '/changelog', label: 'Changelog' },
]

interface PublicNavProps {
  showLinks?: boolean
  action?: 'enter' | 'sign-in' | 'none'
}

export function PublicNav({ showLinks = true, action = 'enter' }: Readonly<PublicNavProps>) {
  const location = useLocation()

  return (
    <nav className="flex items-center justify-between h-14 md:h-16 px-4 md:px-10 border-b border-border">
      <Link to="/" aria-label="Dojo home">
        <LogoWordmark />
      </Link>
      <div className="flex items-center gap-5">
        {showLinks &&
          NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`hidden sm:inline font-mono text-xs transition-colors ${
                location.pathname === to ? 'text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        {action === 'enter' && (
          <Link to="/" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
            Enter the dojo
          </Link>
        )}
        {action === 'sign-in' && (
          <a
            href={`${API_URL}/auth/github`}
            className="inline-flex items-center min-h-11 font-mono text-xs text-accent-text hover:underline"
          >
            Sign in
          </a>
        )}
      </div>
    </nav>
  )
}
