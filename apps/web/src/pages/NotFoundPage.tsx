import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const path = location.pathname || '/'

  return (
    <PublicPageLayout>
      <section className="relative min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-16 overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <span className="font-mono font-bold leading-none text-surface/60 text-[16rem] sm:text-[22rem] md:text-[28rem]">
            404
          </span>
        </span>

        <div className="relative z-10 text-center max-w-xl">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted mb-6 px-2 py-1 rounded-sm bg-surface/80 border border-border">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-danger" aria-hidden />
            ERR · 404
          </div>

          <h1 className="text-primary font-mono font-bold leading-tight text-3xl sm:text-4xl md:text-[56px]">
            Page not defined. Yet.
            <span className="text-accent animate-cursor">_</span>
          </h1>
          <p className="mt-5 text-secondary text-base sm:text-lg leading-relaxed">
            The URL you tried doesn't exist. Maybe it's coming. Maybe it never was. The dojo is still here.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => navigate('/dashboard')}>Enter the dojo →</Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← Go to landing
            </Button>
          </div>

          <div
            className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] text-muted bg-page/60 border border-border rounded-sm px-3 py-1.5 max-w-full"
            title={path}
          >
            <LinkIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="italic truncate">{path}</span>
          </div>
        </div>
      </section>

      <div className="border-t border-border/40 px-4 md:px-8">
        <div className="max-w-3xl mx-auto py-5 text-center font-mono text-[11px] uppercase tracking-wider text-muted">
          If this is a mistake —{' '}
          <Link to="/open-source" className="text-accent hover:underline">
            report this URL →
          </Link>
        </div>
      </div>
    </PublicPageLayout>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1.5 1.5" strokeLinecap="round" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1.5-1.5" strokeLinecap="round" />
    </svg>
  )
}
