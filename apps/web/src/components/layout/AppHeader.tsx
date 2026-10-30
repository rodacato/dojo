import { Link } from 'react-router-dom'
import { LogoWordmark } from '../Logo'

export function AppHeader() {
  return (
    <header className="md:hidden h-14 px-4 flex items-center border-b border-border bg-page">
      <Link to="/dashboard" aria-label="Dojo home">
        <LogoWordmark />
      </Link>
    </header>
  )
}
