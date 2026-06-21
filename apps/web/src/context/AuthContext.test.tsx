import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserDTO } from '@dojo/shared'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from '../lib/api'
import { getToken, clearToken } from '../lib/auth-token'

vi.mock('../lib/api', () => ({
  api: { getMe: vi.fn(), logout: vi.fn() },
}))
vi.mock('../lib/auth-token', () => ({
  getToken: vi.fn(),
  clearToken: vi.fn(),
}))

const mockedGetMe = vi.mocked(api.getMe)
const mockedLogout = vi.mocked(api.logout)
const mockedGetToken = vi.mocked(getToken)
const mockedClearToken = vi.mocked(clearToken)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function Probe() {
  const { user, loading, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.username : 'anonymous'}</span>
      <button onClick={() => void logout()}>logout</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthProvider — bootstrap', () => {
  it('does not call the API and ends loading when there is no token', async () => {
    mockedGetToken.mockReturnValue(null)

    renderProvider()

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(mockedGetMe).not.toHaveBeenCalled()
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
  })

  it('loads the current user when a token is present', async () => {
    mockedGetToken.mockReturnValue('tok')
    mockedGetMe.mockResolvedValue(user)

    renderProvider()

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('sensei'))
    expect(mockedGetMe).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('clears the user and ends loading when getMe rejects (e.g. expired token)', async () => {
    mockedGetToken.mockReturnValue('stale')
    mockedGetMe.mockRejectedValue(new Error('401'))

    renderProvider()

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
  })
})

describe('AuthProvider — logout', () => {
  it('calls the API, clears the token, and drops the user', async () => {
    mockedGetToken.mockReturnValue('tok')
    mockedGetMe.mockResolvedValue(user)
    mockedLogout.mockResolvedValue({ ok: true })

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('sensei'))

    await userEvent.click(screen.getByRole('button', { name: 'logout' }))

    expect(mockedLogout).toHaveBeenCalledTimes(1)
    expect(mockedClearToken).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'))
  })

  it('still clears the token and user even when the logout request fails', async () => {
    mockedGetToken.mockReturnValue('tok')
    mockedGetMe.mockResolvedValue(user)
    mockedLogout.mockRejectedValue(new Error('network'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('sensei'))

    await userEvent.click(screen.getByRole('button', { name: 'logout' }))

    expect(mockedClearToken).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'))
    consoleError.mockRestore()
  })
})

describe('useAuth — default context', () => {
  it('returns the anonymous default when used outside a provider', () => {
    render(<Probe />)
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
  })
})
