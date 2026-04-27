import { Link, useLocation } from 'react-router-dom'
import { LogoWordmark, LogoMark } from './Logo'
import { buttonClasses } from './ui/Button'

interface PublicPageLayoutProps {
  children: React.ReactNode
  /** Hide the right-side `Enter the dojo` CTA. Default is to show it on public pages. */
  hideCta?: boolean
}

export function PublicPageLayout({ children, hideCta = false }: PublicPageLayoutProps) {
  const location = useLocation()

  const navLinks = [
    { to: '/open-source', label: 'Open source' },
    { to: '/changelog', label: 'Changelog' },
  ]
  const footerLinks = [
    { to: '/open-source', label: 'Open source' },
    { to: '/changelog', label: 'Changelog' },
    { to: '/terms', label: 'Terms' },
    { to: '/privacy', label: 'Privacy' },
  ]

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col">
      <nav className="flex items-center justify-between px-4 md:px-8 h-16 border-b border-border/40 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-8 min-w-0">
          <Link to="/">
            <LogoWordmark />
          </Link>
          <div className="hidden sm:flex items-center gap-5">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`font-mono text-[12px] transition-colors ${
                  location.pathname === to
                    ? 'text-primary'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        {!hideCta && (
          <Link to="/" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
            Enter the dojo
          </Link>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={14} className="text-muted" />
            <span className="text-muted text-[11px] font-mono tracking-[0.04em]">
              dojo.notdefined.dev
            </span>
          </div>
          <div className="flex items-center gap-5">
            {footerLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-muted text-[11px] font-mono tracking-[0.04em] hover:text-secondary transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
