import { Link } from 'react-router-dom'
import { LogoMark } from './Logo'

const PROJECT_SITE_URL = 'https://rodacato.github.io/dojo/'

const ALL_LINKS = [
  { to: '/open-source', label: 'Open source' },
  { to: '/changelog', label: 'Changelog' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
]

interface PublicFooterProps {
  showOpenSource?: boolean
  showProjectSite?: boolean
  showTagline?: boolean
}

export function PublicFooter({
  showOpenSource = true,
  showProjectSite = false,
  showTagline = false,
}: Readonly<PublicFooterProps>) {
  const links = showOpenSource ? ALL_LINKS : ALL_LINKS.filter(({ to }) => to !== '/open-source')

  return (
    <footer className="border-t border-border">
      <div className="paper-container py-8 md:py-12 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 md:gap-6">
          <div className="flex items-center gap-2">
            <LogoMark size={16} className="text-secondary" />
            <span className="paper-note">{globalThis.location.host}</span>
          </div>
          <div className="flex items-center gap-5">
            {links.map(({ to, label }) => (
              <Link key={to} to={to} className="paper-note hover:text-primary transition-colors">
                {label}
              </Link>
            ))}
          </div>
          {showProjectSite && (
            <a
              href={PROJECT_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="paper-note text-accent-text! hover:underline"
            >
              Runs on Dojo, open source →
            </a>
          )}
        </div>
        {showTagline && <p className="text-secondary text-xs italic">Not for everyone. Exactly as intended.</p>}
      </div>
    </footer>
  )
}
