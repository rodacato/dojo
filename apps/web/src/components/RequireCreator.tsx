import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireCreator({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return null
  if (!user.isCreator) return <Navigate to="/" replace />
  return <>{children}</>
}
