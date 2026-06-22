import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OfflineBanner } from './OfflineBanner'
import { useOnline } from '../../hooks/useOnline'

vi.mock('../../hooks/useOnline', () => ({ useOnline: vi.fn() }))
const mockUseOnline = vi.mocked(useOnline)

const NOW = 1_700_000_000_000

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders nothing while online', () => {
    mockUseOnline.mockReturnValue({ online: true, offlineSince: null })
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when offline but the offline timestamp is missing', () => {
    mockUseOnline.mockReturnValue({ online: false, offlineSince: null })
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the offline banner with seconds-granularity age and a retry button', () => {
    mockUseOnline.mockReturnValue({ online: false, offlineSince: NOW - 5_000 })
    render(<OfflineBanner />)

    expect(screen.getByText(/Last connected 5s ago/)).toBeInTheDocument()
    expect(screen.getByText(/We'll reconnect when your network returns/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry now/i })).toBeInTheDocument()
  })

  it('formats the age in minutes past 60s and hours past 60m', () => {
    mockUseOnline.mockReturnValue({ online: false, offlineSince: NOW - 120_000 })
    const { rerender } = render(<OfflineBanner />)
    expect(screen.getByText(/Last connected 2m ago/)).toBeInTheDocument()

    mockUseOnline.mockReturnValue({ online: false, offlineSince: NOW - 7_200_000 })
    rerender(<OfflineBanner />)
    expect(screen.getByText(/Last connected 2h ago/)).toBeInTheDocument()
  })

  it('reloads the page when retry is clicked', async () => {
    mockUseOnline.mockReturnValue({ online: false, offlineSince: NOW - 1_000 })
    const reload = vi.fn()
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { ...globalThis.location, reload },
    })

    const user = userEvent.setup()
    render(<OfflineBanner />)
    await user.click(screen.getByRole('button', { name: /retry now/i }))

    expect(reload).toHaveBeenCalledOnce()
  })
})
