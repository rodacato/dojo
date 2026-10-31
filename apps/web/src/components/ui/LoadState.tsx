import type { ReactNode } from 'react'
import { Button } from './Button'

type LoadStateProps =
  | { status: 'loading'; eyebrow: string; children: ReactNode }
  | { status: 'error'; eyebrow: string; title: string; aside?: string; onRetry: () => void; retryLabel?: string }

/** A section's own loading or failed state, in place of its content. */
export function LoadState(props: Readonly<LoadStateProps>) {
  if (props.status === 'loading') {
    return (
      <div role="status" aria-busy="true">
        <p className="paper-eyebrow mb-3">
          {props.eyebrow}
          <span className="animate-cursor" aria-hidden>_</span>
        </p>
        {props.children}
      </div>
    )
  }

  const { eyebrow, title, aside, onRetry, retryLabel = 'Try again' } = props
  return (
    <section role="alert" className="py-7 border-b border-border">
      <p className="paper-eyebrow">{eyebrow}</p>
      <h2 className="paper-heading mt-3 mb-5 wrap-anywhere">
        {title}
        {aside && <span className="block mt-1.5 text-[0.88em] font-normal leading-tight text-secondary">{aside}</span>}
      </h2>
      <Button size="xl" className="max-md:w-full" onClick={onRetry}>
        {retryLabel}
      </Button>
    </section>
  )
}
