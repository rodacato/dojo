import { useParams } from 'react-router-dom'
import { LogoWordmark } from '../components/Logo'
import { GitHubIcon } from '../components/GitHubIcon'
import { API_URL } from '../lib/config'

export function InviteRedeemPage() {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-10">
          <LogoWordmark />
        </div>

        <h1 className="font-mono text-2xl md:text-3xl text-primary leading-tight mb-4">
          someone opened the doors for you.
        </h1>
        <p className="text-secondary text-sm mb-10">
          You've been invited to the dojo. Create your account with GitHub and start your first kata.
        </p>

        <a
          href={`${API_URL}/auth/invite/${token}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
        >
          <GitHubIcon className="w-4 h-4" />
          Enter the dojo →
        </a>

        <p className="text-muted text-xs mt-8 leading-relaxed">
          By entering, you accept the terms of practice. The sensei is honest.
          The timer doesn't pause. The dojo is real.
        </p>
      </div>
    </div>
  )
}
