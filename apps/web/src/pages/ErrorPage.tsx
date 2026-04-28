import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { Button } from '../components/ui/Button'

interface ErrorPageProps {
  message?: string
  /** Optional request id for support correlation. */
  requestId?: string
}

export function ErrorPage({ message, requestId }: ErrorPageProps) {
  const [copied, setCopied] = useState(false)

  async function copyRequestId() {
    if (!requestId) return
    await navigator.clipboard.writeText(requestId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PublicPageLayout>
      <section className="relative min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-16 overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <span className="font-mono font-bold leading-none text-surface/60 text-[14rem] sm:text-[20rem] md:text-[26rem] tracking-tight">
            ERR
          </span>
        </span>

        <div className="relative z-10 text-center max-w-xl w-full">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-danger mb-6 px-2 py-1 rounded-sm bg-surface/80 border border-danger/40">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-danger" aria-hidden />
            ERR · 5xx
          </div>

          <h1 className="text-primary font-semibold leading-tight text-3xl sm:text-4xl">
            Something broke.
          </h1>
          <p className="mt-3 font-mono text-muted text-lg sm:text-xl">
            The dojo is still here.<span className="text-accent animate-cursor">_</span>
          </p>
          <p className="mt-6 text-secondary text-[15px] leading-relaxed">
            An unexpected error occurred while loading this page. We've recorded it. The kata loop is unaffected if you're already in a session — refresh and continue.
          </p>

          {message && (
            <pre className="mt-5 mx-auto max-w-md font-mono text-[12px] text-secondary bg-surface/60 border border-border rounded-sm px-3 py-2 text-left whitespace-pre-wrap wrap-break-word">
              {message}
            </pre>
          )}

          {requestId && (
            <div className="mt-6 mx-auto max-w-md rounded-md border border-border bg-surface/80 p-4 text-left">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  Request ID
                </span>
                <button
                  type="button"
                  onClick={copyRequestId}
                  aria-label="Copy request ID"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-muted hover:text-primary hover:bg-elevated transition-colors"
                >
                  <ClipboardIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="font-mono text-[15px] text-primary tracking-wide break-all">
                {requestId}
              </div>
              <div
                aria-live="polite"
                className={`font-mono text-[11px] uppercase tracking-wider text-success mt-2 transition-opacity ${
                  copied ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Copied to clipboard
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => window.location.reload()}>↻ Retry</Button>
            <Button variant="ghost" onClick={() => { window.location.href = '/dashboard' }}>
              Go to dashboard
            </Button>
          </div>
        </div>
      </section>

      <div className="border-t border-border/40 px-4 md:px-8">
        <div className="max-w-3xl mx-auto py-5 text-center font-mono text-[11px] uppercase tracking-wider text-muted">
          If the error persists — share the request ID via{' '}
          <Link to="/open-source" className="text-accent hover:underline">
            /open-source
          </Link>
        </div>
      </div>
    </PublicPageLayout>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    </svg>
  )
}
