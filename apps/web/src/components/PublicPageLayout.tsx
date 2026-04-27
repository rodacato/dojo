import { Link, useLocation } from 'react-router-dom'
import { LogoWordmark, LogoMark } from './Logo'

interface PublicPageLayoutProps {
  children: React.ReactNode
}

export function PublicPageLayout({ children }: PublicPageLayoutProps) {
  const location = useLocation()

  const navLinks = [
    { to: '/open-source', label: 'Open source' },
    { to: '/changelog', label: 'Changelog' },
    { to: '/terms', label: 'Terms' },
    { to: '/privacy', label: 'Privacy' },
  ]

  return (
    <div className="min-h-screen bg-page text-primary">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/20 max-w-5xl mx-auto">
        <Link to="/">
          <LogoWordmark />
        </Link>
        <div className="flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-mono transition-colors hidden sm:block ${
                location.pathname === to
                  ? 'text-primary'
                  : 'text-muted hover:text-secondary'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {children}

      <footer className="border-t border-border/20 px-8 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={16} className="text-muted" />
            <span className="text-muted text-xs font-mono">dojo.notdefined.dev</span>
          </div>
          <div className="flex items-center gap-4">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className="text-muted text-xs hover:text-secondary transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
