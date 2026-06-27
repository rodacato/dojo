import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'

// Stub the children — AppShell's own logic is route-focus detection and the
// localStorage-backed collapse toggle, not what Sidebar renders. The Sidebar
// stub exposes the collapsed prop and a toggle button so we can drive it.
vi.mock('./Sidebar', () => ({
  Sidebar: ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
    <aside data-testid="sidebar" data-collapsed={String(collapsed)}>
      <button onClick={onToggle}>toggle-sidebar</button>
    </aside>
  ),
}))
vi.mock('./BottomNav', () => ({ BottomNav: () => <nav data-testid="bottom-nav" /> }))
vi.mock('./OfflineBanner', () => ({ OfflineBanner: () => <div data-testid="offline-banner" /> }))

beforeEach(() => {
  localStorage.clear()
})

function renderShell(route: string) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<div>dashboard outlet</div>} />
          <Route path="/katas" element={<div>kata selection outlet</div>} />
          <Route path="/katas/:id" element={<div>kata work outlet</div>} />
          <Route path="/katas/:id/eval" element={<div>kata eval outlet</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell — focused-route chrome', () => {
  it('renders full chrome (sidebar + bottom nav) on a normal route', () => {
    renderShell('/dashboard')
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    expect(screen.getByText('dashboard outlet')).toBeInTheDocument()
  })

  it('hides sidebar and bottom nav on a focused /katas/:id route', () => {
    renderShell('/katas/closures')
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    expect(screen.getByText('kata work outlet')).toBeInTheDocument()
  })

  it('hides chrome on an /eval route', () => {
    renderShell('/katas/closures/eval')
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
    expect(screen.getByText('kata eval outlet')).toBeInTheDocument()
  })

  it('keeps full chrome on the /katas selection screen (list page, not focused)', () => {
    renderShell('/katas')
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByText('kata selection outlet')).toBeInTheDocument()
  })

  it('always shows the offline banner, even on focused routes', () => {
    renderShell('/katas/closures')
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument()
  })
})

describe('AppShell — collapse persistence', () => {
  it('defaults to expanded when no preference is stored', () => {
    renderShell('/dashboard')
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false')
  })

  it('initializes collapsed from localStorage', () => {
    localStorage.setItem('dojo-sidebar-collapsed', 'true')
    renderShell('/dashboard')
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true')
  })

  it('toggling persists the new state to localStorage and reflects it in the prop', async () => {
    renderShell('/dashboard')
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'toggle-sidebar' }))

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'true')
    expect(localStorage.getItem('dojo-sidebar-collapsed')).toBe('true')
  })
})
