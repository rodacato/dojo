import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../hooks/useTheme', () => ({ useTheme: vi.fn() }))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseTheme = vi.mocked(useTheme)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const logout = vi.fn(() => Promise.resolve())
const setTheme = vi.fn()

beforeEach(() => {
  logout.mockClear()
  setTheme.mockClear()
  mockedUseAuth.mockReturnValue({ user, loading: false, logout })
  mockedUseTheme.mockReturnValue({ theme: 'sumi', setTheme })
})

function renderSidebar(route = '/dashboard') {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar — navigation', () => {
  it('renders every nav item linking to its route', () => {
    renderSidebar()

    const expected: Array<[string, string]> = [
      ['dashboard', '/dashboard'],
      ['katas', '/katas'],
      ['scrolls', '/scrolls'],
      ['engawa', '/engawa'],
      ['kumite', '/kumite'],
      ['belts', '/belts'],
    ]
    for (const [label, href] of expected) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toHaveAttribute('href', href)
    }
  })

  it('names every link in the rail, since each sits under its icon', () => {
    renderSidebar()
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAccessibleName()
    }
  })

  it('marks "soon" items with a soon badge and leaves shipped items unmarked', () => {
    renderSidebar()

    expect(screen.getByRole('link', { name: /kumite/ })).toHaveTextContent(/soon/i)
    expect(screen.getByRole('link', { name: /^katas$/ })).not.toHaveTextContent(/soon/i)
  })

  it('marks only the active route as the current page', () => {
    renderSidebar('/katas')

    expect(screen.getByRole('link', { name: /^katas$/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /^belts$/ })).not.toHaveAttribute('aria-current')
  })

  it('links the logo to the dashboard', () => {
    renderSidebar('/katas')
    expect(screen.getByRole('link', { name: 'Dojo home' })).toHaveAttribute('href', '/dashboard')
  })
})

describe('Sidebar — account section', () => {
  it('shows the handle and links settings under the username', () => {
    renderSidebar()
    expect(screen.getByText('@sensei')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings for sensei' })).toHaveAttribute('href', '/settings')
  })

  it('leaves out the handle when there is no user', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout })
    renderSidebar()
    expect(screen.queryByText(/^@/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  })

  it('does not sign out until the dialog is confirmed', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(logout).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog', { name: 'See you tomorrow.' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('stays signed in when the dialog is dismissed', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Stay' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(logout).not.toHaveBeenCalled()
  })

  it('offers no collapse control', () => {
    renderSidebar()
    expect(screen.queryByRole('button', { name: /collapse/i })).not.toBeInTheDocument()
  })
})
