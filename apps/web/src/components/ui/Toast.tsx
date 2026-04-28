import { useCallback, useEffect, useState, type ReactNode } from 'react'

export type ToastKind = 'success' | 'info' | 'warning' | 'error'

interface ToastInput {
  kind?: ToastKind
  /** Caps-mono eyebrow line ("SAVED", "INVITATION COPIED"). */
  eyebrow: string
  /** Inter-13 body line. */
  body?: ReactNode
  /** Inline ghost action (e.g. "Copy ID"). */
  action?: { label: string; onClick: () => void }
  /** Override auto-dismiss in ms. Defaults: success/info 3s, warning 6s, error never (manual dismiss). */
  durationMs?: number
}

interface ToastEntry extends Required<Pick<ToastInput, 'eyebrow'>> {
  id: number
  kind: ToastKind
  body?: ReactNode
  action?: { label: string; onClick: () => void }
  durationMs: number | null
}

const DEFAULT_DURATIONS: Record<ToastKind, number | null> = {
  success: 3000,
  info: 3000,
  warning: 6000,
  error: null,
}

const TONE_BORDER: Record<ToastKind, string> = {
  success: 'border-l-success',
  info: 'border-l-accent',
  warning: 'border-l-warning',
  error: 'border-l-danger',
}

const TONE_TEXT: Record<ToastKind, string> = {
  success: 'text-success',
  info: 'text-accent',
  warning: 'text-warning',
  error: 'text-danger',
}

let nextId = 0
let pushFn: ((t: ToastEntry) => void) | null = null

function push(input: ToastInput) {
  const kind = input.kind ?? 'info'
  const durationMs = input.durationMs ?? DEFAULT_DURATIONS[kind]
  pushFn?.({
    id: ++nextId,
    kind,
    eyebrow: input.eyebrow,
    body: input.body,
    action: input.action,
    durationMs,
  })
}

export const toast = Object.assign(
  function toast(input: ToastInput) {
    push(input)
  },
  {
    success(eyebrow: string, body?: ReactNode, opts?: Omit<ToastInput, 'kind' | 'eyebrow' | 'body'>) {
      push({ kind: 'success', eyebrow, body, ...opts })
    },
    info(eyebrow: string, body?: ReactNode, opts?: Omit<ToastInput, 'kind' | 'eyebrow' | 'body'>) {
      push({ kind: 'info', eyebrow, body, ...opts })
    },
    warning(eyebrow: string, body?: ReactNode, opts?: Omit<ToastInput, 'kind' | 'eyebrow' | 'body'>) {
      push({ kind: 'warning', eyebrow, body, ...opts })
    },
    error(eyebrow: string, body?: ReactNode, opts?: Omit<ToastInput, 'kind' | 'eyebrow' | 'body'>) {
      push({ kind: 'error', eyebrow, body, ...opts })
    },
  },
)

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  const addToast = useCallback((entry: ToastEntry) => {
    setToasts((prev) => [...prev, entry])
    if (entry.durationMs != null) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== entry.id))
      }, entry.durationMs)
    }
  }, [])

  useEffect(() => {
    pushFn = addToast
    return () => {
      pushFn = null
    }
  }, [addToast])

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`bg-surface border border-border border-l-4 ${TONE_BORDER[t.kind]} rounded-md px-4 py-3 animate-slide-in shadow-lg`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className={`font-mono text-[11px] uppercase tracking-wider mb-1 ${TONE_TEXT[t.kind]}`}>
                {t.eyebrow}
              </div>
              {t.body && (
                <div className="text-[13px] text-secondary leading-relaxed">{t.body}</div>
              )}
              {t.action && (
                <button
                  type="button"
                  onClick={t.action.onClick}
                  className="mt-2 font-mono text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-muted hover:text-primary transition-colors text-lg leading-none shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface BadgeUnlockToastInput {
  /** Mono-caps name, e.g. "POLYGLOT". */
  badgeName: string
  /** Inter-13 description. */
  description: string
  onView?: () => void
}

/** Specialized toast for badge unlocks — taller layout per spec. */
export function badgeUnlockToast({ badgeName, description, onView }: BadgeUnlockToastInput) {
  push({
    kind: 'info',
    eyebrow: 'Badge earned',
    durationMs: 6000,
    body: (
      <div className="space-y-1">
        <div className="font-mono uppercase tracking-wider font-bold text-primary text-[20px] leading-tight">
          {badgeName}
        </div>
        <div className="text-secondary">{description}</div>
      </div>
    ),
    action: onView ? { label: 'View all badges →', onClick: onView } : undefined,
  })
}
