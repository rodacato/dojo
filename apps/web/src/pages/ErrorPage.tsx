import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { Button } from '../components/ui/Button'
import { ErrorPanel } from '../components/ui/ErrorPanel'

interface ErrorPageProps {
  message?: string
  /** Optional request id for support correlation. */
  requestId?: string
}

export function ErrorPage({ message, requestId }: Readonly<ErrorPageProps>) {
  const [copied, setCopied] = useState(false)

  const onErrorRoute = globalThis.location.pathname === '/error'

  function retry() {
    if (!onErrorRoute) return globalThis.location.reload()
    if (globalThis.history.length > 1) return globalThis.history.back()
    globalThis.location.href = '/dashboard'
  }

  async function copyRequestId() {
    if (!requestId) return
    await navigator.clipboard.writeText(requestId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PublicPageLayout hideCta>
      <ErrorPanel
        code="ERR · 5xx"
        title="Something broke."
        sub={
          <>
            The dojo is still here.<span className="text-accent animate-cursor">_</span>
          </>
        }
        actions={
          <>
            <Button size="lg" onClick={retry}>{onErrorRoute ? '← Go back' : '↻ Retry'}</Button>
            <Button size="lg" variant="ghost" onClick={() => { globalThis.location.href = '/dashboard' }}>
              Go to dashboard
            </Button>
          </>
        }
        footnote={
          <>
            If the error persists — report it via{' '}
            <Link to="/open-source" className="normal-case tracking-normal text-accent-text hover:underline">
              /open-source
            </Link>
          </>
        }
      >
        <p className="paper-body">
          An unexpected error occurred while loading this page. We've recorded it. The kata loop is unaffected if you're already in a session — refresh and continue.
        </p>

        {message && (
          <pre className="w-full max-w-md font-mono text-xs text-secondary bg-surface/60 border border-border rounded-sm px-3 py-2 text-left whitespace-pre-wrap wrap-break-word">
            {message}
          </pre>
        )}

        {requestId && (
          <div className="w-full max-w-md rounded-md border border-border bg-surface/80 p-4 text-left">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-mono text-xs uppercase tracking-wider text-secondary">
                Request ID
              </span>
              <button
                type="button"
                onClick={copyRequestId}
                aria-label="Copy request ID"
                className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-secondary hover:text-primary hover:bg-elevated transition-colors"
              >
                <ClipboardIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="font-mono text-base text-primary tracking-wide break-all">
              {requestId}
            </div>
            <div
              aria-live="polite"
              className={`font-mono text-xs uppercase tracking-wider text-success-text mt-2 transition-opacity ${
                copied ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Copied to clipboard
            </div>
          </div>
        )}
      </ErrorPanel>
    </PublicPageLayout>
  )
}

function ClipboardIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    </svg>
  )
}
