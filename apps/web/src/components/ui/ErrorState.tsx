import { Link } from 'react-router-dom'

type ActionTo = { label: string; to: string }
type ActionHandler = { label: string; onClick: () => void; disabled?: boolean }
type Action = ActionTo | ActionHandler

interface ErrorStateProps {
  title?: string
  message: string
  primaryAction?: Action
  secondaryAction?: Action
  variant?: 'full' | 'inline'
}

export function ErrorState({
  title,
  message,
  primaryAction,
  secondaryAction,
  variant = 'full',
}: ErrorStateProps) {
  const container =
    variant === 'full'
      ? 'min-h-screen bg-base flex flex-col items-center justify-center px-4 gap-2'
      : 'flex flex-col items-center justify-center text-center px-4 py-10 gap-2'

  return (
    <div className={container}>
      {title && <h1 className="font-mono text-lg text-primary mb-1">{title}</h1>}
      <p className="text-secondary text-sm mb-4 font-mono text-center">{message}</p>
      {(primaryAction ?? secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && <ErrorAction action={primaryAction} kind="primary" />}
          {secondaryAction && <ErrorAction action={secondaryAction} kind="secondary" />}
        </div>
      )}
    </div>
  )
}

function ErrorAction({ action, kind }: { action: Action; kind: 'primary' | 'secondary' }) {
  const className =
    kind === 'primary'
      ? 'px-4 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-50'
      : 'px-4 py-2 bg-surface border border-border text-secondary font-mono text-sm rounded-sm hover:text-primary hover:border-accent transition-colors'

  if ('to' in action) {
    return (
      <Link to={action.to} className={className}>
        {action.label}
      </Link>
    )
  }

  return (
    <button onClick={action.onClick} disabled={action.disabled} className={className}>
      {action.label}
    </button>
  )
}
