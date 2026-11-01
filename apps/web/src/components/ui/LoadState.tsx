import type { ReactNode } from 'react'
import { Button } from './Button'

type LoadStateProps =
  | { status: 'loading'; eyebrow: string; title?: string; children: ReactNode }
  | {
      status: 'error'
      eyebrow: string
      title: string
      aside?: string
      body?: string
      pageTitle?: boolean
      onRetry: () => void
      retryLabel?: string
    }

/** A section's own loading or failed state, in place of its content. */
export function LoadState(props: Readonly<LoadStateProps>) {
  if (props.status === 'loading') {
    return (
      <div role="status" aria-busy="true">
        <p className="paper-eyebrow mb-3">
          {props.eyebrow}
          {!props.title && <span className="animate-cursor" aria-hidden>_</span>}
        </p>
        {props.title && (
          <h1 className="paper-heading max-md:text-[32px] min-[360px]:max-md:text-[36px] max-md:leading-[1.06] mb-4">
            {props.title}
            <span className="animate-cursor" aria-hidden>_</span>
          </h1>
        )}
        {props.children}
      </div>
    )
  }

  const { eyebrow, title, aside, body, pageTitle = false, onRetry, retryLabel = 'Try again' } = props
  const Title = pageTitle ? 'h1' : 'h2'
  return (
    <section role="alert" className={pageTitle ? undefined : 'py-7 border-b border-border'}>
      <p className="paper-eyebrow">{eyebrow}</p>
      <Title className="paper-heading max-md:text-[32px] min-[360px]:max-md:text-[36px] max-md:leading-[1.06] mt-3 mb-5 wrap-anywhere">
        {title}
        {aside && <span className="block mt-1.5 text-[0.88em] font-normal leading-tight text-secondary">{aside}</span>}
      </Title>
      {body && <p className="paper-body mb-6">{body}</p>}
      <Button size="xl" className="max-md:w-full" onClick={onRetry}>
        {retryLabel}
      </Button>
    </section>
  )
}
