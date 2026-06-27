import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { OfflineBanner } from './OfflineBanner'

/** Active-kata work screens (/katas/:id and /katas/:id/eval) hide the nav; the /katas list keeps it */
const FOCUSED_ROUTE = /^\/katas\/[^/]+/

function isFocusedRoute(pathname: string): boolean {
  return FOCUSED_ROUTE.test(pathname)
}

export function AppShell() {
  const location = useLocation()
  const focused = isFocusedRoute(location.pathname)

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('dojo-sidebar-collapsed') === 'true'
  })

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('dojo-sidebar-collapsed', String(next))
      return next
    })
  }

  if (focused) {
    return (
      <>
        <OfflineBanner />
        <Outlet />
      </>
    )
  }

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <div className="flex-1 min-w-0 flex flex-col">
        <OfflineBanner />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
