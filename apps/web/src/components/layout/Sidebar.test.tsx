import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

function renderSidebar(props?: { collapsed?: boolean; onToggle?: () => void; route?: string }) {
  const onToggle = props?.onToggle ?? vi.fn()
  render(
    <MemoryRouter initialEntries={[props?.route ?? '/dashboard']}>
      <Sidebar collapsed={props?.collapsed ?? false} onToggle={onToggle} />
    </MemoryRouter>,
  )
  return { onToggle }
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

  it('marks "soon" items with a soon badge and leaves shipped items unmarked', () => {
    renderSidebar()

    const kumite = screen.getByRole('link', { name: /kumite/ })
    expect(kumite).toHaveTextContent(/soon/i)

    const katas = screen.getByRole('link', { name: /^katas$/ })
    expect(katas).not.toHaveTextContent(/soon/i)
  })

  it('highlights the active route with the accent classes', () => {
    renderSidebar({ route: '/scrolls' })

    const active = screen.getByRole('link', { name: /scrolls/ })
    expect(active.className).toContain('text-accent')

    const inactive = screen.getByRole('link', { name: /^katas$/ })
    expect(inactive.className).not.toContain('text-accent')
  })
})

describe('Sidebar — account section', () => {
  it('shows the logged-in username on the settings link', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: 'sensei' })).toHaveAttribute('href', '/settings')
  })

  it('falls back to "settings" label when no username is present', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout })
    renderSidebar()
    expect(screen.getByRole('link', { name: 'settings' })).toHaveAttribute('href', '/settings')
  })

  it('invokes logout when the log out button is clicked', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /log out/i }))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})

describe('Sidebar — theme + collapse', () => {
  it('cycles the theme sumi → washi on click', async () => {
    mockedUseTheme.mockReturnValue({ theme: 'sumi', setTheme })
    renderSidebar()
    await userEvent.click(screen.getByTitle('theme: sumi (click to cycle)'))
    expect(setTheme).toHaveBeenCalledWith('washi')
  })

  it('wraps the cycle slate → sumi', async () => {
    mockedUseTheme.mockReturnValue({ theme: 'slate', setTheme })
    renderSidebar()
    await userEvent.click(screen.getByTitle('theme: slate (click to cycle)'))
    expect(setTheme).toHaveBeenCalledWith('sumi')
  })

  it('starts the cycle at sumi from the "auto" choice', async () => {
    mockedUseTheme.mockReturnValue({ theme: 'auto', setTheme })
    renderSidebar()
    await userEvent.click(screen.getByTitle('theme: auto (click to cycle)'))
    expect(setTheme).toHaveBeenCalledWith('sumi')
  })

  it('calls onToggle when the collapse control is clicked', async () => {
    const { onToggle } = renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /collapse/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('hides the collapsed-only labels when collapsed', () => {
    renderSidebar({ collapsed: true })
    // The "log out" text label is hidden when collapsed (button still exists).
    expect(screen.queryByText('log out')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })
})
