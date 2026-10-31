import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoadState } from './LoadState'

describe('LoadState', () => {
  it('marks loading as busy and keeps the caller placeholders', () => {
    render(<LoadState status="loading" eyebrow="Opening"><div>placeholders</div></LoadState>)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('placeholders')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('announces a failure and retries', async () => {
    const onRetry = vi.fn()
    render(
      <LoadState status="error" eyebrow="History" title="Something broke." aside="The dojo is still here." onRetry={onRetry} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('The dojo is still here.')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
