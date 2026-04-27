import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/admin/exercises', label: 'Exercises', active: true },
  { path: '/admin/courses', label: 'Courses', active: true },
  { path: '/admin/invitations', label: 'Invitations', active: true },
  { path: '/admin/errors', label: 'Errors', active: true },
  { path: '/admin/users', label: 'Users', active: false },
  { path: '/admin/sessions', label: 'Sessions', active: false },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-page flex">
      {/* Sidebar */}
      <nav className="w-48 border-r border-border bg-surface p-4 shrink-0">
        <div className="font-mono text-primary mb-6">
          dojo<span className="text-accent">_</span>
          <span className="text-muted text-xs ml-1">admin</span>
        </div>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ path, label, active }) =>
            active ? (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-sm text-sm font-mono transition-colors ${
                      isActive ? 'bg-accent/10 text-accent' : 'text-secondary hover:text-primary'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ) : (
              <li key={path}>
                <span className="block px-3 py-2 rounded-sm text-sm font-mono text-muted cursor-not-allowed">
                  {label}
                  <span className="block text-xs text-muted/60 mt-0.5">Phase 1</span>
                </span>
              </li>
            ),
          )}
        </ul>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
