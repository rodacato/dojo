import { describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { ErrorState } from './ErrorState'

function renderErrorState(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('ErrorState', () => {
  describe('kind → copy mapping', () => {
    it('renders the generic eyebrow + title by default', () => {
      renderErrorState(<ErrorState message="Try again later." />)

      expect(
        screen.getByRole('heading', { name: 'Something went wrong.' }),
      ).toBeInTheDocument()
      expect(screen.getByText('ERROR')).toBeInTheDocument()
      expect(screen.getByText('Try again later.')).toBeInTheDocument()
    })

    it('maps unauthorized to the 401 eyebrow and sign-in title', () => {
      renderErrorState(<ErrorState kind="unauthorized" message="msg" />)

      expect(
        screen.getByRole('heading', { name: 'Sign in to continue.' }),
      ).toBeInTheDocument()
      expect(screen.getByText('ERR · 401 · UNAUTHORIZED')).toBeInTheDocument()
    })

    it('maps unavailable to the sensei/LLM 503 copy', () => {
      renderErrorState(<ErrorState kind="unavailable" message="msg" />)

      expect(
        screen.getByRole('heading', { name: 'The sensei is unreachable.' }),
      ).toBeInTheDocument()
      expect(screen.getByText('SENSEI UNAVAILABLE · LLM 503')).toBeInTheDocument()
    })

    it('uses the amber tone for rate-limit (warning, not danger)', () => {
      renderErrorState(<ErrorState kind="rate-limit" message="msg" />)

      const eyebrow = screen.getByText('RATE LIMITED · 429')
      expect(eyebrow).toHaveClass('text-warning')
      expect(eyebrow).not.toHaveClass('text-danger')
    })

    it('uses the danger tone for not-found', () => {
      renderErrorState(<ErrorState kind="not-found" message="msg" />)

      expect(screen.getByText('ERR · 404 · NOT FOUND')).toHaveClass('text-danger')
    })
  })

  describe('overrides', () => {
    it('lets the caller override eyebrow and title while keeping the message', () => {
      renderErrorState(
        <ErrorState
          kind="internal"
          eyebrow="CUSTOM EYEBROW"
          title="Custom headline"
          message="Custom body."
        />,
      )

      expect(screen.getByRole('heading', { name: 'Custom headline' })).toBeInTheDocument()
      expect(screen.getByText('CUSTOM EYEBROW')).toBeInTheDocument()
      // The kind defaults must NOT leak through once overridden.
      expect(screen.queryByText('ERR · 500 · INTERNAL')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Something broke. The dojo is still here.' }),
      ).not.toBeInTheDocument()
    })

    it('renders the optional microcopy when provided', () => {
      renderErrorState(<ErrorState message="msg" microcopy="aud-id: 42" />)
      expect(screen.getByText('aud-id: 42')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('renders a link action that navigates via its `to` target', () => {
      renderErrorState(
        <ErrorState
          message="msg"
          primaryAction={{ label: 'Go home', to: '/dashboard' }}
        />,
      )

      const link = screen.getByRole('link', { name: 'Go home' })
      expect(link).toHaveAttribute('href', '/dashboard')
    })

    it('renders a handler action as a button and fires onClick', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      renderErrorState(
        <ErrorState
          message="msg"
          primaryAction={{ label: 'Retry', onClick }}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('does not fire a disabled handler action', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      renderErrorState(
        <ErrorState
          message="msg"
          primaryAction={{ label: 'Retry', onClick, disabled: true }}
        />,
      )

      const btn = screen.getByRole('button', { name: 'Retry' })
      expect(btn).toBeDisabled()
      await user.click(btn)
      expect(onClick).not.toHaveBeenCalled()
    })

    it('renders both primary and secondary actions, each wired to its own handler', async () => {
      const user = userEvent.setup()
      const onPrimary = vi.fn()
      const onSecondary = vi.fn()
      renderErrorState(
        <ErrorState
          message="msg"
          primaryAction={{ label: 'Primary', onClick: onPrimary }}
          secondaryAction={{ label: 'Secondary', onClick: onSecondary }}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Secondary' }))
      expect(onSecondary).toHaveBeenCalledTimes(1)
      expect(onPrimary).not.toHaveBeenCalled()
    })

    it('styles the primary action as the filled accent variant', () => {
      renderErrorState(
        <ErrorState
          message="msg"
          primaryAction={{ label: 'Primary', to: '/x' }}
          secondaryAction={{ label: 'Secondary', to: '/y' }}
        />,
      )

      expect(screen.getByRole('link', { name: 'Primary' })).toHaveClass('bg-accent')
      expect(screen.getByRole('link', { name: 'Secondary' })).not.toHaveClass('bg-accent')
    })

    it('renders no action cluster when neither action is given', () => {
      renderErrorState(<ErrorState message="msg" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('request id card', () => {
    it('shows the request id and copies it to the clipboard on click', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      // setup() installs its own clipboard stub; override after so the
      // component's navigator.clipboard.writeText is the one we assert on.
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      })

      renderErrorState(<ErrorState message="msg" requestId="req_abc123" />)

      expect(screen.getByText('req_abc123')).toBeInTheDocument()

      const copyBtn = screen.getByRole('button', { name: 'Copy request ID' })
      expect(copyBtn).toHaveTextContent('Copy')

      await user.click(copyBtn)

      expect(writeText).toHaveBeenCalledWith('req_abc123')
      expect(copyBtn).toHaveTextContent('Copied')
    })

    it('omits the request id card when no requestId is given', () => {
      renderErrorState(<ErrorState message="msg" />)
      expect(screen.queryByText('Request ID')).not.toBeInTheDocument()
    })
  })

  describe('variant', () => {
    it('uses the full-screen wrapper by default', () => {
      const { container } = renderErrorState(<ErrorState message="msg" />)
      expect(container.querySelector('.min-h-screen')).not.toBeNull()
    })

    it('drops the full-screen wrapper for the inline variant', () => {
      const { container } = renderErrorState(<ErrorState message="msg" variant="inline" />)
      expect(container.querySelector('.min-h-screen')).toBeNull()
    })
  })
})
