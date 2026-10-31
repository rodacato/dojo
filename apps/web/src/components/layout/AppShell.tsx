import { Outlet, useLocation } from 'react-router-dom'
import { AppChrome } from './AppChrome'

/** Active-kata work screens (/katas/:id and /katas/:id/eval) hide the nav; the /katas list keeps it */
const FOCUSED_ROUTE = /^\/katas\/[^/]+/

export function AppShell() {
  const { pathname } = useLocation()

  if (FOCUSED_ROUTE.test(pathname)) {
    return <Outlet />
  }

  return (
    <AppChrome>
      <Outlet />
    </AppChrome>
  )
}
