import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthCallbackPage } from './AuthCallbackPage'
import { getToken } from '../lib/auth-token'

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/dashboard" element={<div>dashboard screen</div>} />
        <Route path="/" element={<div>landing screen</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('persists the token and redirects to the dashboard when the callback carries a credential', () => {
    renderAt('/auth/callback?token=ghp_secret_abc')

    expect(getToken()).toBe('ghp_secret_abc')
    expect(screen.getByText('dashboard screen')).toBeInTheDocument()
    expect(screen.queryByText('Auth_Failed: handshake timeout.')).not.toBeInTheDocument()
  })

  it('shows the failure state (not the loading state) when no token is present', () => {
    vi.useFakeTimers()
    renderAt('/auth/callback')

    expect(screen.getByText('Auth_Failed: handshake timeout.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByText('Connection terminated')).toBeInTheDocument()

    // Loading affordances are gone in the failure state.
    expect(screen.queryByText('Completing sign-in.')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('does not redirect immediately on a missing token, then bounces to landing after the timeout', () => {
    vi.useFakeTimers()
    renderAt('/auth/callback')

    // Still on the callback page right after the failed render.
    expect(screen.getByText('Auth_Failed: handshake timeout.')).toBeInTheDocument()
    expect(screen.queryByText('landing screen')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(screen.getByText('landing screen')).toBeInTheDocument()
    expect(screen.queryByText('Auth_Failed: handshake timeout.')).not.toBeInTheDocument()
  })

  it('navigates to landing right away when the user clicks Try again', async () => {
    const user = userEvent.setup()
    renderAt('/auth/callback')

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('landing screen')).toBeInTheDocument()
    expect(screen.queryByText('Auth_Failed: handshake timeout.')).not.toBeInTheDocument()
  })
})
