import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { BottomNav } from './BottomNav'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

const mockedUseAuth = vi.mocked(useAuth)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
})

function renderNav(route = '/dashboard') {
  render(
    <MemoryRouter initialEntries={[route]}>
      <BottomNav />
    </MemoryRouter>,
  )
}

describe('BottomNav', () => {
  it('renders the four base nav links', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /dash/ })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /katas/ })).toHaveAttribute('href', '/katas')
    expect(screen.getByRole('link', { name: /scrolls/ })).toHaveAttribute('href', '/scrolls')
    expect(screen.getByRole('link', { name: /belts/ })).toHaveAttribute('href', '/belts')
  })

  it('shows settings as the fifth item when a user is logged in', () => {
    mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
    renderNav()
    expect(screen.getByRole('link', { name: /settings/ })).toHaveAttribute('href', '/settings')
    expect(screen.queryByRole('link', { name: /engawa/ })).not.toBeInTheDocument()
  })

  it('shows engawa as the fifth item when anonymous', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
    renderNav()
    expect(screen.getByRole('link', { name: /engawa/ })).toHaveAttribute('href', '/engawa')
    expect(screen.queryByRole('link', { name: /settings/ })).not.toBeInTheDocument()
  })

  it('highlights the active route with the accent color', () => {
    renderNav('/katas')
    expect(screen.getByRole('link', { name: /katas/ }).className).toContain('text-accent')
    expect(screen.getByRole('link', { name: /belts/ }).className).not.toContain('text-accent')
  })
})
