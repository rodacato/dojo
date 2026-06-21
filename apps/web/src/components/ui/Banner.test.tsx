import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Banner } from './Banner'

describe('Banner', () => {
  it('renders the eyebrow and body children inside a status region', () => {
    render(<Banner eyebrow="Heads up">Your session expires soon.</Banner>)

    const region = screen.getByRole('status')
    expect(region).toBeInTheDocument()
    expect(region).toHaveTextContent('Heads up')
    expect(region).toHaveTextContent('Your session expires soon.')
  })

  it('uppercases the eyebrow via the mono caps class while keeping source text intact', () => {
    render(<Banner eyebrow="api down">body</Banner>)

    const eyebrow = screen.getByText('api down')
    expect(eyebrow).toHaveClass('font-mono', 'uppercase', 'tracking-wider')
  })

  it('renders rich-node children, not just strings', () => {
    render(
      <Banner eyebrow="Notice">
        <span data-testid="rich">go to <a href="/docs">docs</a></span>
      </Banner>,
    )

    expect(screen.getByTestId('rich')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', '/docs')
  })

  describe('tone', () => {
    it('defaults to info: accent eyebrow text + left accent border', () => {
      render(<Banner eyebrow="Info">body</Banner>)

      expect(screen.getByText('Info')).toHaveClass('text-accent')
      const region = screen.getByRole('status')
      expect(region).toHaveClass('border-l-4', 'border-l-accent')
      expect(region).not.toHaveClass('text-warning', 'text-danger')
    })

    it('applies warning tone classes', () => {
      render(
        <Banner tone="warning" eyebrow="Warn">
          body
        </Banner>,
      )

      expect(screen.getByText('Warn')).toHaveClass('text-warning')
      expect(screen.getByRole('status')).toHaveClass('border-l-warning')
    })

    it('applies danger tone classes', () => {
      render(
        <Banner tone="danger" eyebrow="Danger">
          body
        </Banner>,
      )

      expect(screen.getByText('Danger')).toHaveClass('text-danger')
      expect(screen.getByRole('status')).toHaveClass('border-l-danger')
    })
  })

  describe('border variant', () => {
    it('uses a left border + rounded card chrome by default', () => {
      render(<Banner eyebrow="Default">body</Banner>)

      const region = screen.getByRole('status')
      expect(region).toHaveClass('border-l-4', 'rounded-md', 'border', 'border-border')
      expect(region).not.toHaveClass('border-b-4')
    })

    it('switches to a bottom border and drops the card chrome when bottomBorder is set', () => {
      render(
        <Banner eyebrow="Bottom" bottomBorder>
          body
        </Banner>,
      )

      const region = screen.getByRole('status')
      expect(region).toHaveClass('border-b-4', 'border-b-accent')
      expect(region).not.toHaveClass('border-l-4', 'rounded-md')
    })

    it('combines bottomBorder with tone to pick the matching bottom color', () => {
      render(
        <Banner tone="danger" eyebrow="Bottom" bottomBorder>
          body
        </Banner>,
      )

      expect(screen.getByRole('status')).toHaveClass('border-b-danger')
    })
  })

  describe('action', () => {
    it('renders an action node when provided', () => {
      render(
        <Banner eyebrow="Update" action={<button type="button">Retry</button>}>
          body
        </Banner>,
      )

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    it('omits the action slot content when not provided', () => {
      render(<Banner eyebrow="Plain">body</Banner>)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('dismiss', () => {
    it('renders no dismiss control when onDismiss is omitted', () => {
      render(<Banner eyebrow="Sticky">body</Banner>)

      expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
    })

    it('renders an accessible × dismiss button when onDismiss is provided', () => {
      render(
        <Banner eyebrow="Closable" onDismiss={vi.fn()}>
          body
        </Banner>,
      )

      const dismiss = screen.getByRole('button', { name: 'Dismiss' })
      expect(dismiss).toBeInTheDocument()
      expect(dismiss).toHaveTextContent('×')
      expect(dismiss).toHaveAttribute('type', 'button')
    })

    it('invokes onDismiss when the user clicks the × button', async () => {
      const onDismiss = vi.fn()
      const user = userEvent.setup()
      render(
        <Banner eyebrow="Closable" onDismiss={onDismiss}>
          body
        </Banner>,
      )

      await user.click(screen.getByRole('button', { name: 'Dismiss' }))

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('renders both an action and a dismiss button together', () => {
      render(
        <Banner
          eyebrow="Both"
          action={<button type="button">Retry</button>}
          onDismiss={vi.fn()}
        >
          body
        </Banner>,
      )

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
    })
  })

  it('appends a custom className without dropping the structural classes', () => {
    render(
      <Banner eyebrow="Custom" className="mt-8">
        body
      </Banner>,
    )

    const region = screen.getByRole('status')
    expect(region).toHaveClass('mt-8')
    expect(region).toHaveClass('flex', 'items-start', 'justify-between')
  })
})
