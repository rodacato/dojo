import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'

type ActionTo = { label: string; to: string }
type ActionHandler = { label: string; onClick: () => void; disabled?: boolean }
type Action = ActionTo | ActionHandler

export type ErrorKind =
  | 'unauthorized'   // 401 — sign-in required
  | 'forbidden'      // 403 — creator-only / audited
  | 'not-found'      // 404 — entity missing
  | 'internal'       // 500 — generic
  | 'rate-limit'     // 429 — too many requests
  | 'unavailable'    // 503 — sensei / LLM down
  | 'generic'        // unspecified

interface ErrorStateProps {
  kind?: ErrorKind
  /** Optional override of the eyebrow ("ERR · 500 · INTERNAL"). */
  eyebrow?: string
  /** Optional override of the headline. Falls back to a kind-specific copy. */
  title?: string
  /** Body line — shorter is better. */
  message: string
  /** Optional muted-mono microcopy under the action cluster. */
  microcopy?: string
  /** Mono request/audit id rendered in a copyable card. */
  requestId?: string
  primaryAction?: Action
  secondaryAction?: Action
  variant?: 'full' | 'inline'
}

const KIND_DEFAULTS: Record<ErrorKind, { eyebrow: string; title: string; tone: 'red' | 'amber' | 'muted' }> = {
  unauthorized: { eyebrow: 'ERR · 401 · UNAUTHORIZED', title: 'Sign in to continue.', tone: 'red' },
  forbidden:    { eyebrow: 'ERR · 403 · FORBIDDEN',    title: 'Not yours. Not yet.',  tone: 'red' },
  'not-found':  { eyebrow: 'ERR · 404 · NOT FOUND',    title: "That isn't here.",      tone: 'red' },
  internal:     { eyebrow: 'ERR · 500 · INTERNAL',     title: 'Something broke. The dojo is still here.', tone: 'red' },
  'rate-limit': { eyebrow: 'RATE LIMITED · 429',       title: 'Too many requests.',   tone: 'amber' },
  unavailable:  { eyebrow: 'SENSEI UNAVAILABLE · LLM 503', title: 'The sensei is unreachable.', tone: 'red' },
  generic:      { eyebrow: 'ERROR',                    title: 'Something went wrong.', tone: 'muted' },
}

const TONE_TEXT: Record<'red' | 'amber' | 'muted', string> = {
  red: 'text-danger',
  amber: 'text-warning',
  muted: 'text-muted',
}

const TONE_DOT: Record<'red' | 'amber' | 'muted', string> = {
  red: 'bg-danger',
  amber: 'bg-warning',
  muted: 'bg-muted',
}

export function ErrorState({
  kind = 'generic',
  eyebrow,
  title,
  message,
  microcopy,
  requestId,
  primaryAction,
  secondaryAction,
  variant = 'full',
}: ErrorStateProps) {
  const defaults = KIND_DEFAULTS[kind]
  const finalEyebrow = eyebrow ?? defaults.eyebrow
  const finalTitle = title ?? defaults.title
  const tone = defaults.tone

  const wrapper =
    variant === 'full'
      ? 'min-h-screen bg-page flex flex-col items-center justify-center px-4 py-16'
      : 'flex flex-col items-center justify-center px-4 py-12'

  return (
    <div className={wrapper}>
      <div className="max-w-xl w-full text-center">
        <div
          className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider mb-4 ${TONE_TEXT[tone]}`}
        >
          <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full ${TONE_DOT[tone]}`} />
          {finalEyebrow}
        </div>
        <h1 className="text-primary text-2xl sm:text-[28px] font-semibold leading-tight">
          {finalTitle}
        </h1>
        <p className="mt-3 text-secondary text-[15px] leading-relaxed">{message}</p>

        {requestId && <RequestIdCard id={requestId} />}

        {(primaryAction ?? secondaryAction) && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {primaryAction && <ErrorAction action={primaryAction} kind="primary" />}
            {secondaryAction && <ErrorAction action={secondaryAction} kind="secondary" />}
          </div>
        )}

        {microcopy && (
          <p className="mt-4 font-mono text-[11px] text-muted">{microcopy}</p>
        )}
      </div>
    </div>
  )
}

function ErrorAction({ action, kind }: { action: Action; kind: 'primary' | 'secondary' }) {
  const variant = kind === 'primary' ? 'primary' : 'ghost'
  if ('to' in action) {
    return (
      <Link
        to={action.to}
        className={
          variant === 'primary'
            ? 'inline-flex items-center justify-center h-9 px-4 font-mono uppercase tracking-wider whitespace-nowrap rounded-sm bg-accent text-primary border border-accent text-[13px] transition-colors hover:bg-accent/90'
            : 'inline-flex items-center justify-center h-9 px-4 font-mono uppercase tracking-wider whitespace-nowrap rounded-sm bg-transparent text-primary border border-border text-[13px] transition-colors hover:border-accent'
        }
      >
        {action.label}
      </Link>
    )
  }
  return (
    <Button variant={variant} size="md" onClick={action.onClick} disabled={action.disabled}>
      {action.label}
    </Button>
  )
}

function RequestIdCard({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="mt-6 mx-auto max-w-md rounded-md border border-border bg-surface px-4 py-3 text-left">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Request ID
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy request ID"
          className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-primary transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="font-mono text-[15px] text-primary tracking-wide break-all">{id}</div>
    </div>
  )
}
