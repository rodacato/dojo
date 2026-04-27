import { Link, useParams } from 'react-router-dom'
import { LogoMark } from '../components/Logo'
import { GitHubIcon } from '../components/GitHubIcon'
import { API_URL } from '../lib/config'

export function InviteRedeemPage() {
  const { token } = useParams<{ token: string }>()
  const truncated = truncateToken(token)

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-130 bg-surface border border-border rounded-md p-6 md:p-12">
        {/* Lockup */}
        <div className="flex items-center gap-2 mb-8">
          <LogoMark size={24} className="text-accent" />
          <span className="font-mono font-bold text-primary text-lg inline-flex items-center select-none">
            dojo<span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
          </span>
        </div>

        {/* Eyebrow + headline + body */}
        <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted mb-3">
          Invitation
        </p>
        <h1 className="text-primary text-[28px] font-semibold leading-tight tracking-tight mb-6">
          You&apos;ve been invited to the dojo.
        </h1>
        <p className="text-secondary text-[15px] leading-relaxed mb-6">
          Daily practice for developers who still have something to prove. To themselves. The
          dojo runs on your reasoning, not your tools — no AI inside the kata, no skip, no
          reroll.
        </p>

        {/* CTA */}
        <a
          href={`${API_URL}/auth/invite/${token ?? ''}`}
          className="inline-flex items-center justify-center gap-2 w-full h-11 bg-accent text-primary font-mono text-[13px] tracking-[0.04em] rounded-sm hover:bg-accent/90 transition-colors"
        >
          <GitHubIcon className="w-4 h-4" />
          Enter the dojo. →
        </a>

        {/* Microcopy */}
        <p className="text-muted text-[11px] text-center mt-4">
          Sign in with GitHub. We don&apos;t email you. We don&apos;t track you.
        </p>

        {/* Divider + fine print */}
        <div className="border-t border-border mt-6 pt-3 flex flex-col gap-2 text-[11px]">
          <p className="text-muted font-mono">
            Token: <span className="text-secondary">{truncated}</span> (expires in 7 days)
          </p>
          <p className="text-muted">
            By continuing you accept the{' '}
            <Link to="/terms" className="text-accent underline hover:text-accent/80">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-accent underline hover:text-accent/80">
              Privacy policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Outside card */}
      <p className="text-muted text-[11px] mt-8 text-center px-4">
        Not invited?{' '}
        <Link to="/" className="text-accent underline hover:text-accent/80">
          Read what dojo is.
        </Link>
      </p>
    </div>
  )
}

function truncateToken(token?: string): string {
  if (!token) return '—'
  if (token.length <= 9) return token
  return `${token.slice(0, 4)}…${token.slice(-4)}`
}
