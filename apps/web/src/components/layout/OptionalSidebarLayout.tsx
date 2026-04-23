import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

// Shell for public pages that should pick up the authed chrome (sidebar
// + bottom nav) when the user happens to be signed in. Anonymous
// visitors get the bare page — the route's own component renders its
// full-bleed layout. No RequireAuth wrapper: the route is public by
// design, sidebar is opportunistic.

export function OptionalSidebarLayout() {
  const { user } = useAuth()

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('dojo-sidebar-collapsed') === 'true',
  )

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('dojo-sidebar-collapsed', String(next))
      return next
    })
  }

  if (!user) {
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
