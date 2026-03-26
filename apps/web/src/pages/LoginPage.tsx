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
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Watermark */}
      <span className="absolute text-[12rem] font-mono text-border/10 select-none pointer-events-none" aria-hidden="true">
        dojo_
      </span>

      {/* Card */}
      <div className="bg-surface border border-border/40 rounded-md p-8 max-w-sm w-full flex flex-col items-center gap-8 relative z-10">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-mono text-5xl text-primary">
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
          className="flex items-center gap-3 px-6 py-3 bg-accent text-primary rounded-sm font-mono hover:brightness-110 transition-all duration-150"
        >
          <GitHubIcon className="w-5 h-5" />
          <span>Enter the dojo.</span>
        </a>

        {/* Footer note */}
        <p className="text-muted text-xs text-center">No account needed. Login with GitHub.</p>
      </div>
    </div>
  )
}
