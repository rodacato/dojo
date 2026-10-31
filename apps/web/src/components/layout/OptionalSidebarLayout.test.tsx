import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { OptionalSidebarLayout } from './OptionalSidebarLayout'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('./AppChrome', () => ({
  AppChrome: ({ children }: { children: React.ReactNode }) => <div data-testid="chrome">{children}</div>,
}))

const mockedUseAuth = vi.mocked(useAuth)
const user: UserDTO = { id: 'u1', username: 'sensei', avatarUrl: '', createdAt: '2026-01-01T00:00:00.000Z' }

beforeEach(() => {
  mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
})

function renderLayout(publicHeader?: boolean) {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<OptionalSidebarLayout publicHeader={publicHeader} />}>
          <Route path="/" element={<div>page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('OptionalSidebarLayout', () => {
  it('gives a signed-in user the app chrome and no public nav', () => {
    mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
    renderLayout(true)
    expect(screen.getByTestId('chrome')).toHaveTextContent('page')
    expect(screen.queryByRole('link', { name: 'Enter the dojo' })).not.toBeInTheDocument()
  })

  it('shows an anonymous visitor the public nav when asked to', () => {
    renderLayout(true)
    expect(screen.getByRole('link', { name: 'Enter the dojo' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('main')).toHaveTextContent('page')
  })

  it('leaves the page bare for an anonymous visitor otherwise', () => {
    renderLayout()
    expect(screen.getByText('page')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chrome')).not.toBeInTheDocument()
  })

  it('holds the public nav back until auth resolves', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: true, logout: vi.fn() })
    renderLayout(true)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
