import { useMemo, type ReactNode, type Ref } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { KataDTO } from '@dojo/shared'
import { FocusedHeader } from '../layout/FocusedHeader'
import { buttonClasses } from '../ui/Button'

export type ReviewStatus =
  | 'connecting'
  | 'executing'
  | 'streaming'
  | 'follow-up'
  | 'complete'
  | 'error'
  | 'offline'
  | 'loading'
  | 'unavailable'
  | 'incomplete'
  | 'pending'

const NEUTRAL = 'text-secondary border-border bg-elevated'

// Complete stays neutral: the verdict is the only thing on this screen that grades.
const STATUS: Record<ReviewStatus, { label: string; color: string; cursor?: boolean }> = {
  connecting: { label: 'CONNECTING', color: NEUTRAL, cursor: true },
  executing: { label: 'EXECUTING', color: 'text-warning-text border-warning/40 bg-warning/10', cursor: true },
  streaming: { label: 'STREAMING', color: NEUTRAL, cursor: true },
  'follow-up': { label: 'FOLLOW-UP', color: NEUTRAL },
  complete: { label: 'COMPLETE', color: NEUTRAL },
  error: { label: 'ERROR', color: 'text-danger-text border-danger/40 bg-danger/10' },
  offline: { label: 'OFFLINE', color: 'text-danger-text border-danger/40 bg-danger/10' },
  loading: { label: 'LOADING', color: NEUTRAL, cursor: true },
  unavailable: { label: 'UNAVAILABLE', color: NEUTRAL },
  incomplete: { label: 'INCOMPLETE', color: NEUTRAL },
  pending: { label: 'PENDING', color: NEUTRAL },
}

function StatusChip({ status }: Readonly<{ status: ReviewStatus }>) {
  const { label, color, cursor } = STATUS[status]
  return (
    <span className={`inline-flex items-center font-mono text-xs tracking-[0.08em] uppercase border px-2 py-1 rounded-sm ${color}`}>
      {label}
      {cursor && <span className="animate-cursor ml-0.5" aria-hidden>_</span>}
    </span>
  )
}

const HISTORY_PATH = /^\/history(?:[?#]|$)/

/** The `from` a page hands to the result. Only a history path is honoured; anything else means the Dashboard. */
export function useReturnState(): { from: string } | undefined {
  const { state } = useLocation()
  const from = (state as { from?: unknown } | null)?.from
  return useMemo(() => (typeof from === 'string' && HISTORY_PATH.test(from) ? { from } : undefined), [from])
}

export function ReturnLink() {
  const returnState = useReturnState()
  return (
    <Link
      to={returnState?.from ?? '/dashboard'}
      className={`${buttonClasses({ variant: 'subtle', size: 'lg' })} !px-2 !text-xs`}
    >
      {returnState ? 'Kata history' : 'Dashboard'}
    </Link>
  )
}

interface ReviewShellProps {
  status: ReviewStatus
  leading?: ReactNode
  scrollRef?: Ref<HTMLElement>
  footer?: ReactNode
  children: ReactNode
}

/** One focused view from the wait to the stored result (D60): both routes render inside it. */
export function ReviewShell({ status, leading, scrollRef, footer, children }: Readonly<ReviewShellProps>) {
  return (
    <div className="h-dvh bg-page flex flex-col overflow-hidden">
      <FocusedHeader leading={leading} trailing={<StatusChip status={status} />} />
      <main ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-280 mx-auto px-4 md:px-8 py-7 md:py-10">{children}</div>
      </main>
      {footer}
    </div>
  )
}

export function ReviewTitle({ title, meta }: Readonly<{ title: string; meta?: string }>) {
  return (
    <header className="mb-6 md:mb-8">
      <h1 className="font-sans font-bold text-primary text-2xl max-md:text-[1.75rem] leading-tight tracking-tight wrap-anywhere">
        {title}
      </h1>
      {meta && <p className="paper-note mt-3">{meta}</p>}
    </header>
  )
}

export function kataMeta(kata: KataDTO): string {
  return [kata.type, kata.difficulty, kata.language.join(', '), `${kata.duration} min`].filter(Boolean).join(' · ')
}

interface ReviewGridProps {
  aside?: ReactNode
  followthrough?: ReactNode
  children: ReactNode
}

/** Reasoning on the left with the learner's own answer beside it; below the reasoning on a phone. */
export function ReviewGrid({ aside, followthrough, children }: Readonly<ReviewGridProps>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15.625rem] lg:grid-cols-[minmax(0,1fr)_18.125rem] md:gap-x-7 lg:gap-x-12 items-start">
      <article className="min-w-0 md:col-start-1">{children}</article>
      {aside && (
        <aside className="min-w-0 max-md:mt-7 max-md:border-b max-md:border-border md:col-start-2 md:row-start-1 md:row-span-2 md:sticky md:top-6">
          {aside}
        </aside>
      )}
      {followthrough && <div className="min-w-0 md:col-start-1">{followthrough}</div>}
    </div>
  )
}
