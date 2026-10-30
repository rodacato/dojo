import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { Button } from '../components/ui/Button'
import { ErrorPanel } from '../components/ui/ErrorPanel'

export function NotFoundPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const path = location.pathname || '/'

  return (
    <PublicPageLayout hideCta>
      <ErrorPanel
        code="ERR · 404"
        title={
          <>
            Page not defined. Yet.<span className="text-accent animate-cursor">_</span>
          </>
        }
        actions={
          <>
            <Button size="lg" onClick={() => navigate('/dashboard')}>Enter the dojo →</Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/')}>
              ← Go to landing
            </Button>
          </>
        }
        footnote={
          <>
            If this is a mistake —{' '}
            <Link to="/open-source" className="normal-case tracking-normal text-accent-text hover:underline">
              report this URL →
            </Link>
          </>
        }
      >
        <p className="paper-body">
          The URL you tried doesn't exist. Maybe it's coming. Maybe it never was. The dojo is still here.
        </p>
        <div
          className="inline-flex items-center gap-2 font-mono text-xs text-secondary bg-page/60 border border-border rounded-sm px-3 py-1.5 max-w-full"
          title={path}
        >
          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="italic truncate">{path}</span>
        </div>
      </ErrorPanel>
    </PublicPageLayout>
  )
}

function LinkIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1.5 1.5" strokeLinecap="round" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1.5-1.5" strokeLinecap="round" />
    </svg>
  )
}
