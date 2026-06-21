import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { ErrorPage } from './ErrorPage'

function renderPage(props: Parameters<typeof ErrorPage>[0] = {}) {
  return render(
    <MemoryRouter>
      <ErrorPage {...props} />
    </MemoryRouter>,
  )
}

describe('ErrorPage', () => {
  it('renders the 5xx headline, body copy, and the support link by default', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Something broke.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('ERR · 5xx')).toBeInTheDocument()
    expect(
      screen.getByText(/An unexpected error occurred while loading this page/),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '/open-source' })).toHaveAttribute(
      'href',
      '/open-source',
    )
  })

  it('omits the diagnostic message block and the request-id card when no props are given', () => {
    const { container } = renderPage()

    expect(container.querySelector('pre')).toBeNull()
    expect(screen.queryByText('Request ID')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Copy request ID' }),
    ).not.toBeInTheDocument()
  })

  it('renders the diagnostic message in a pre block when provided', () => {
    const { container } = renderPage({ message: 'TypeError: cannot read foo of undefined' })

    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre).toHaveTextContent('TypeError: cannot read foo of undefined')
  })

  it('shows the request-id card and copies the id to the clipboard, revealing feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    // userEvent.setup() installs its own clipboard stub; override after so the
    // component's navigator.clipboard.writeText is the spy we assert on.
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    renderPage({ requestId: 'req_abc123' })

    expect(screen.getByText('Request ID')).toBeInTheDocument()
    expect(screen.getByText('req_abc123')).toBeInTheDocument()

    const feedback = screen.getByText('Copied to clipboard')
    expect(feedback).toHaveClass('opacity-0')

    await user.click(screen.getByRole('button', { name: 'Copy request ID' }))

    expect(writeText).toHaveBeenCalledWith('req_abc123')
    expect(feedback).toHaveClass('opacity-100')
  })

  it('retries by reloading the current location', async () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload, href: '' },
    })
    const user = userEvent.setup()

    renderPage()

    await user.click(screen.getByRole('button', { name: '↻ Retry' }))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('navigates to the dashboard via a hard location change', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: vi.fn(), href: '' },
    })
    const user = userEvent.setup()

    renderPage()

    await user.click(screen.getByRole('button', { name: 'Go to dashboard' }))
    expect(window.location.href).toBe('/dashboard')
  })
})
