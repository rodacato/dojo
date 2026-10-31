import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PublicNav } from '../PublicNav'
import { AppChrome } from './AppChrome'

// Shell for public pages that should pick up the authed chrome (sidebar
// + bottom nav) when the user happens to be signed in. Anonymous
// visitors get the bare page, or the public nav with `publicHeader` when
// the page has no header of its own. No RequireAuth wrapper: the route is
// public by design, the chrome is opportunistic.

export function OptionalSidebarLayout({ publicHeader = false }: Readonly<{ publicHeader?: boolean }>) {
  const { user, loading } = useAuth()

  if (user) {
    return (
      <AppChrome>
        <Outlet />
      </AppChrome>
    )
  }

  if (publicHeader && !loading) {
    return (
      <>
        <PublicNav themeToggle />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          <Outlet />
        </main>
      </>
    )
  }

  return <Outlet />
}
