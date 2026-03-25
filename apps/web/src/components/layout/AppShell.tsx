import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

/** Routes where nav is hidden — focused work screens */
const FOCUSED_ROUTES = ['/kata/', '/eval']

function isFocusedRoute(pathname: string): boolean {
  // Match /kata/:id and /kata/:id/eval but NOT /kata (selection)
  if (pathname === '/kata') return false
  return FOCUSED_ROUTES.some((r) => pathname.includes(r))
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
    return <Outlet />
  }

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
