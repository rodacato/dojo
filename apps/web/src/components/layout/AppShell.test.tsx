import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'

// Stub the children — AppShell's own logic is route-focus detection, not what
// the chrome renders.
vi.mock('./Sidebar', () => ({ Sidebar: () => <aside data-testid="sidebar" /> }))
vi.mock('./BottomNav', () => ({ BottomNav: () => <nav data-testid="bottom-nav" /> }))
vi.mock('./OfflineBanner', () => ({ OfflineBanner: () => <div data-testid="offline-banner" /> }))

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

  it('renders a header linking home on a normal route', () => {
    renderShell('/katas')
    expect(screen.getByRole('link', { name: 'Dojo home' })).toHaveAttribute('href', '/dashboard')
  })

  it('renders no header on a focused route', () => {
    renderShell('/katas/closures')
    expect(screen.queryByRole('link', { name: 'Dojo home' })).not.toBeInTheDocument()
  })

  it('leaves the offline notice to focused routes, which carry their own', () => {
    renderShell('/katas/closures')
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument()
  })
})
