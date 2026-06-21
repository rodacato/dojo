import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { AdminLayout } from './AdminLayout'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

const user: UserDTO = {
  id: 'u1',
  username: 'creator-jane',
  avatarUrl: 'https://example.test/jane.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const logout = vi.fn()

function renderLayout(initial = '/admin/katas') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="katas" element={<div>katas outlet</div>} />
          <Route path="scrolls" element={<div>scrolls outlet</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({ user, loading: false, logout })
})

describe('AdminLayout', () => {
  it('renders all five admin nav links with the right destinations', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'Katas' })).toHaveAttribute('href', '/admin/katas')
    expect(screen.getByRole('link', { name: 'Scrolls' })).toHaveAttribute('href', '/admin/scrolls')
    expect(screen.getByRole('link', { name: 'Invitations' })).toHaveAttribute('href', '/admin/invitations')
    expect(screen.getByRole('link', { name: 'Errors' })).toHaveAttribute('href', '/admin/errors')
    expect(screen.getByRole('link', { name: 'Health' })).toHaveAttribute('href', '/admin/health')
  })

  it('marks the active route via NavLink aria-current', () => {
    renderLayout('/admin/scrolls')

    expect(screen.getByRole('link', { name: 'Scrolls' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Katas' })).not.toHaveAttribute('aria-current')
  })

  it('renders the matched child route through the Outlet', () => {
    renderLayout('/admin/scrolls')

    expect(screen.getByText('scrolls outlet')).toBeInTheDocument()
    expect(screen.queryByText('katas outlet')).not.toBeInTheDocument()
  })

  it('renders the signed-in creator identity block', () => {
    const { container } = renderLayout()

    expect(screen.getByText('creator-jane')).toBeInTheDocument()
    expect(screen.getByText('creator')).toBeInTheDocument()
    // Avatar img has alt="" (decorative, out of the a11y tree) → query the DOM.
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.test/jane.png')
  })

  it('omits the identity block but still renders nav + Outlet when no user', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout })

    const { container } = renderLayout()

    // No avatar / username when user is absent — and no crash.
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByText('creator-jane')).not.toBeInTheDocument()
    // Layout chrome and Outlet still present.
    expect(screen.getByRole('link', { name: 'Katas' })).toBeInTheDocument()
    expect(screen.getByText('katas outlet')).toBeInTheDocument()
  })

  it('always exposes the back-to-dojo escape link', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: /Back to dojo/ })).toHaveAttribute('href', '/dashboard')
  })
})
