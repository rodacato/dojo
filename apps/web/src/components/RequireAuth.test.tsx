import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { RequireAuth } from './RequireAuth'
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

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/" element={<div>landing page</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/protected" element={<div>protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('renders the protected outlet when a user is authenticated', () => {
    mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })

    renderGuard()

    expect(screen.getByText('protected content')).toBeInTheDocument()
    expect(screen.queryByText('landing page')).not.toBeInTheDocument()
  })

  it('redirects anonymous visitors to the landing page', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })

    renderGuard()

    expect(screen.getByText('landing page')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('shows a loading state without rendering or redirecting while auth resolves', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: true, logout: vi.fn() })

    renderGuard()

    expect(screen.getByText('loading...')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
    expect(screen.queryByText('landing page')).not.toBeInTheDocument()
  })
})
