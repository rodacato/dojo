import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardLoadState } from './DashboardLoadState'

describe('DashboardLoadState', () => {
  it('announces the wait once, without reading the placeholders aloud', () => {
    render(<DashboardLoadState status="loading" />)

    expect(screen.getByRole('status', { busy: true })).toHaveTextContent('Opening the dojo')
    expect(screen.getByText('Current streak').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows unavailable sections as not loaded, never as zero', () => {
    render(<DashboardLoadState status="error" onRetry={() => {}} />)

    const record = screen.getByRole('complementary', { name: 'Unavailable dashboard data' })
    expect(within(record).getAllByText('Not loaded', { ignore: '[aria-hidden]' })).toHaveLength(3)
    expect(record).not.toHaveTextContent('0')
  })

  it('names the failure and retries', async () => {
    const onRetry = vi.fn()
    render(<DashboardLoadState status="error" onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load your dashboard.")
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('titles the page when the dashboard fails, so the error keeps a top-level heading', () => {
    render(<DashboardLoadState status="error" onRetry={() => {}} />)
    expect(screen.getByRole('heading', { level: 1, name: /Something broke/ })).toBeInTheDocument()
  })
})
