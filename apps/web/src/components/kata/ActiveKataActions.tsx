import { Button } from '../ui/Button'

export const ANSWER_HINT_ID = 'answer-hint'

interface ActiveKataActionsProps {
  hint: string
  failed: boolean
  note: string
  label: string
  disabled: boolean
  loading: boolean
  onAction: () => void
}

/** Persistent bottom bar: what the answer still needs, and the screen's one filled action. */
export function ActiveKataActions({
  hint,
  failed,
  note,
  label,
  disabled,
  loading,
  onAction,
}: Readonly<ActiveKataActionsProps>) {
  return (
    <footer className="shrink-0 flex max-md:flex-col md:items-center justify-between gap-2.5 md:gap-8 px-4 md:px-8 pt-3 md:py-4 pb-[max(12px,env(safe-area-inset-bottom))] border-t border-border bg-page">
      <div className="min-w-0">
        {failed ? (
          <p id={ANSWER_HINT_ID} role="alert" className="text-sm text-danger-text">
            {hint}
          </p>
        ) : (
          <p id={ANSWER_HINT_ID} aria-live="polite" className="text-sm text-primary min-h-5">
            {hint}
          </p>
        )}
        <p className="paper-note mt-1">{note}</p>
      </div>
      <Button
        variant="primary"
        size="xl"
        className="shrink-0 max-md:w-full md:min-w-55"
        onClick={onAction}
        loading={loading}
        disabled={disabled}
      >
        {label}
      </Button>
    </footer>
  )
}
