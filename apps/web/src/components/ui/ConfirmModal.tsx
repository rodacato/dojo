import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export type ConfirmTone = 'muted' | 'amber' | 'red' | 'indigo'

interface ConfirmModalBaseProps {
  open: boolean
  onCancel: () => void
  /** Caps-mono eyebrow ("Sign out?", "Quit kata?", "Wipe course content"). */
  eyebrow: string
  /** Tone for the eyebrow + (when applicable) the destructive button. */
  tone?: ConfirmTone
  /** Inter-18 headline. */
  title: string
  /** Body content — pass paragraphs/JSX. */
  children?: ReactNode
  /** Cancel button label. Defaults to `Cancel`. */
  cancelLabel?: string
  /** Visual variant of the primary action. `destructive` is text-only red, `danger` is filled red (typed-confirm only). */
  primaryVariant?: 'primary' | 'destructive' | 'danger'
  /** Primary action label. */
  primaryLabel: string
  /** Primary action — disabled when async or (in typed-confirm) until the typed value matches. */
  onConfirm: () => void
  /** Disables both buttons + locks the modal (uses `flow={true}`). */
  busy?: boolean
}

interface StandardConfirmProps extends ConfirmModalBaseProps {
  /** When omitted, the modal acts as a plain confirmation. */
  typedConfirm?: undefined
}

interface TypedConfirmProps extends ConfirmModalBaseProps {
  /** Forces the user to type `expected` exactly before the primary becomes enabled. */
  typedConfirm: {
    expected: string
    label: string
    placeholder?: string
    /** Optional muted-mono microcopy under the input. */
    hint?: string
  }
}

type ConfirmModalProps = StandardConfirmProps | TypedConfirmProps

const TONE_TEXT: Record<ConfirmTone, string> = {
  muted: 'text-muted',
  amber: 'text-warning',
  red: 'text-danger',
  indigo: 'text-accent',
}

/**
 * Confirmation modal — renders a Modal with the dojo confirm shell.
 * Pass `typedConfirm` to require the user to type a value (e.g. a slug)
 * before the primary becomes enabled. Filled-red `danger` variant is
 * reserved for typed-confirm flows per the BRANDING.md note "Filled red
 * is allowed ONLY here — a deliberate second-confirmation."
 */
export function ConfirmModal(props: ConfirmModalProps) {
  const {
    open,
    onCancel,
    eyebrow,
    tone = 'muted',
    title,
    children,
    cancelLabel = 'Cancel',
    primaryVariant = 'destructive',
    primaryLabel,
    onConfirm,
    busy = false,
  } = props
  const typed = 'typedConfirm' in props ? props.typedConfirm : undefined
  const [typedValue, setTypedValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && typed) {
      setTypedValue('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open, typed])

  if (!open) return null

  const matched = typed ? typedValue === typed.expected : true
  const primaryDisabled = busy || !matched

  return (
    <Modal open onClose={() => !busy && onCancel()} flow={busy}>
      <div className="p-8">
        <div
          className={`font-mono text-[11px] uppercase tracking-wider mb-2 ${TONE_TEXT[tone]}`}
        >
          {eyebrow}
        </div>
        <h2 className="text-[18px] font-semibold text-primary leading-snug">{title}</h2>
        {children && (
          <div className="mt-3 text-[13px] text-secondary leading-relaxed space-y-3">
            {children}
          </div>
        )}

        {typed && (
          <div className="mt-5">
            <label
              htmlFor="confirm-typed"
              className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5"
            >
              {typed.label}
            </label>
            <input
              ref={inputRef}
              id="confirm-typed"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={typed.placeholder ?? typed.expected}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              className="admin-input font-mono"
            />
            {typed.hint && (
              <div className="font-mono text-[11px] text-muted mt-2">{typed.hint}</div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          {primaryVariant === 'danger' ? (
            <button
              type="button"
              onClick={() => !primaryDisabled && onConfirm()}
              disabled={primaryDisabled}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 font-mono uppercase tracking-wider whitespace-nowrap rounded-sm bg-danger text-primary border border-danger text-[13px] transition-colors hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-danger/40 disabled:border-danger/40"
            >
              {busy ? `${primaryLabel}…` : primaryLabel}
            </button>
          ) : (
            <Button
              variant={primaryVariant}
              size="md"
              onClick={onConfirm}
              loading={busy}
              disabled={primaryDisabled}
            >
              {primaryLabel}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
