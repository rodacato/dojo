import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { UserDTO } from '@dojo/shared'
import { api } from '../lib/api'
import { getToken, clearToken } from '../lib/auth-token'

interface AuthContextValue {
  user: UserDTO | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, logout: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const logout = useCallback(async () => {
    await api.logout().catch(() => {})
    clearToken()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
