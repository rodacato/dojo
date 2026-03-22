import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GitHubIcon } from '../components/GitHubIcon'
import { API_URL } from '../lib/config'

export function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-8 px-4">
      {/* Logo */}
      <div className="text-center">
        <h1 className="font-mono text-4xl text-primary">
          dojo<span className="text-accent animate-pulse">_</span>
        </h1>
        <p className="text-secondary text-sm mt-2">dojo.notdefined.dev</p>
      </div>

      {/* Tagline */}
      <p className="text-secondary text-center max-w-xs">
        The dojo for developers who still have something to prove. To themselves.
      </p>

      {/* GitHub login */}
      <a
        href={`${API_URL}/auth/github`}
        className="flex items-center gap-3 px-6 py-3 bg-surface border border-border rounded-sm text-primary hover:border-accent transition-colors duration-150"
      >
        <GitHubIcon className="w-5 h-5" />
        <span className="font-mono">Continue with GitHub</span>
      </a>

      {/* Invite-only note */}
      <p className="text-muted text-xs text-center">Invite-only. We want practitioners, not tourists.</p>
    </div>
  )
}
