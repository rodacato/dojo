import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { LoginPage } from './LoginPage'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>landing page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders the login content for an anonymous visitor', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })

    renderLogin()

    expect(
      screen.getByText(/The dojo for developers who still have something to prove/i),
    ).toBeInTheDocument()
    expect(screen.getByText('No account needed. Login with GitHub.')).toBeInTheDocument()
    expect(screen.queryByText('landing page')).not.toBeInTheDocument()
  })

  it('points the GitHub login CTA at the OAuth start endpoint', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })

    renderLogin()

    const cta = screen.getByRole('link', { name: /Enter the dojo/i })
    expect(cta.getAttribute('href')).toMatch(/\/auth\/github$/)
  })

  it('redirects an authenticated user to the landing page', () => {
    mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })

    renderLogin()

    expect(screen.getByText('landing page')).toBeInTheDocument()
    expect(
      screen.queryByText(/The dojo for developers who still have something to prove/i),
    ).not.toBeInTheDocument()
  })
})
