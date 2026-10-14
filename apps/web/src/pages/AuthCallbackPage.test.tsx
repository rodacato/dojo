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
    expect(screen.queryByText('Auth_Failed: no credential received.')).not.toBeInTheDocument()
  })

  it('shows the failure state (not the loading state) when no token is present', () => {
    vi.useFakeTimers()
    renderAt('/auth/callback')

    expect(screen.getByText('Auth_Failed: no credential received.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByText('Connection terminated')).toBeInTheDocument()

    // Loading affordances are gone in the failure state.
    expect(screen.queryByText('Completing sign-in.')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('stays on the failure state with no automatic redirect, so the message can be read', () => {
    vi.useFakeTimers()
    renderAt('/auth/callback')

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Auth_Failed: no credential received.')
    expect(screen.queryByText('landing screen')).not.toBeInTheDocument()
  })

  it('navigates to landing right away when the user clicks Try again', async () => {
    const user = userEvent.setup()
    renderAt('/auth/callback')

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('landing screen')).toBeInTheDocument()
    expect(screen.queryByText('Auth_Failed: no credential received.')).not.toBeInTheDocument()
  })
})
