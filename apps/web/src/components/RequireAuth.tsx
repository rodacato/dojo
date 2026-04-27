import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-page text-muted font-mono">
        loading...
      </div>
    )
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}
