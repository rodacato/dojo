import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { RequireCreator } from './RequireCreator'

const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function makeUser(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: 'u1',
    username: 'sensei',
    avatarUrl: 'https://example.test/a.png',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireCreator>
              <div>creator console</div>
            </RequireCreator>
          }
        />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireCreator', () => {
  it('renders children when the user is a creator', () => {
    mockUseAuth.mockReturnValue({ user: makeUser({ isCreator: true }) })

    renderGuard()

    expect(screen.getByText('creator console')).toBeInTheDocument()
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })

  it('redirects an authenticated non-creator to /dashboard', () => {
    mockUseAuth.mockReturnValue({ user: makeUser({ isCreator: false }) })

    renderGuard()

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('creator console')).not.toBeInTheDocument()
  })

  it('renders nothing while there is no user (anonymous)', () => {
    mockUseAuth.mockReturnValue({ user: null })

    renderGuard()

    expect(screen.queryByText('creator console')).not.toBeInTheDocument()
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })
})
