import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken } from '../lib/auth-token'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      setToken(token)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/?error=auth', { replace: true })
    }
  }, [params, navigate])

  return (
    <div className="flex items-center justify-center h-screen bg-base text-muted font-mono text-sm">
      loading...
    </div>
  )
}
