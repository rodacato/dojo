import { Link } from 'react-router-dom'
import { LogoWordmark } from '../Logo'

export function AppHeader() {
  return (
    <header className="md:hidden h-16 shrink-0 px-4 flex items-center border-b border-border bg-page">
      <Link to="/dashboard" aria-label="Dojo home" className="inline-flex items-center min-h-11">
        <LogoWordmark markSize={26} />
      </Link>
    </header>
  )
}
