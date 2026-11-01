import { Link, useParams } from 'react-router-dom'
import { LogoMark } from '../components/Logo'
import { GitHubIcon } from '../components/GitHubIcon'
import { buttonClasses } from '../components/ui/Button'
import { API_URL } from '../lib/config'

export function InviteRedeemPage() {
  const { token } = useParams<{ token: string }>()
  const truncated = truncateToken(token)

  return (
    <div className="min-h-screen bg-page flex flex-col md:flex-row">
      <img
        src="/art/interior-800.webp"
        srcSet="/art/interior-800.webp 800w, /art/interior-1600.webp 1600w"
        sizes="(min-width: 768px) 43vw, 100vw"
        width={800}
        height={343}
        alt=""
        className="w-full h-50 object-cover md:w-[43%] md:max-w-155 md:h-auto md:min-h-screen md:shrink-0"
      />

      <main className="flex-1 flex md:items-center px-4 py-8 md:px-16 lg:px-30 md:py-16">
        <div className="w-full max-w-130">
          <div className="flex items-center gap-2 mb-10">
            <LogoMark size={28} className="text-accent" />
            <span className="font-mono font-bold text-primary text-lg inline-flex items-center select-none">
              dojo<span className="animate-cursor ml-0.5 text-accent" aria-hidden>_</span>
            </span>
          </div>

          <p className="paper-eyebrow mb-4">Invitation</p>
          <h1 className="paper-heading mb-4">You&apos;ve been invited to the dojo.</h1>
          <p className="paper-body mb-8">
            Daily practice for developers who still have something to prove. To themselves. The
            dojo runs on your reasoning, not your tools — no AI inside the kata, no skip, no
            reroll.
          </p>

          <a
            href={`${API_URL}/auth/invite/${token ?? ''}`}
            className={`${buttonClasses({ variant: 'primary', size: 'lg' })} w-full`}
          >
            <GitHubIcon className="w-4 h-4" />
            Enter the dojo. →
          </a>

          <p className="text-secondary text-xs text-center mt-3">
            Sign in with GitHub. We don&apos;t send marketing email. We don&apos;t track you.
          </p>

          <div className="border-t border-border mt-5 pt-4 flex flex-col gap-2">
            <p className="paper-note">
              Token: <span>{truncated}</span> (expires in 7 days)
            </p>
            <p className="text-secondary text-xs">
              By continuing you accept the{' '}
              <Link to="/terms" className={fineLinkClass}>
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className={fineLinkClass}>
                Privacy policy
              </Link>
              .
            </p>
          </div>

          <p className="text-secondary text-xs mt-8 max-md:text-center">
            Not invited?{' '}
            <Link to="/" className={fineLinkClass}>
              Read what dojo is.
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

const fineLinkClass =
  'underline decoration-border underline-offset-2 hover:text-primary hover:decoration-primary transition-colors'

function truncateToken(token?: string): string {
  if (!token) return '—'
  if (token.length <= 9) return token
  return `${token.slice(0, 4)}…${token.slice(-4)}`
}
