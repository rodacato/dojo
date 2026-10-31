import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './BottomNav'

function renderNav(route = '/dashboard') {
  render(
    <MemoryRouter initialEntries={[route]}>
      <BottomNav />
    </MemoryRouter>,
  )
}

describe('BottomNav', () => {
  it('renders the base nav links', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /katas/ })).toHaveAttribute('href', '/katas')
    expect(screen.getByRole('link', { name: /scrolls/ })).toHaveAttribute('href', '/scrolls')
    expect(screen.getByRole('link', { name: /belts/ })).toHaveAttribute('href', '/belts')
  })

  it('ends with settings, the only account route on a phone', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /settings/ })).toHaveAttribute('href', '/settings')
    expect(screen.queryByRole('link', { name: /engawa/ })).not.toBeInTheDocument()
  })

  it('marks scrolls as current on a scroll page', () => {
    renderNav('/scrolls/pattern-circuit')
    expect(screen.getByRole('link', { name: /scrolls/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /katas/ })).not.toHaveAttribute('aria-current')
  })

  it('marks only the active route as the current page', () => {
    renderNav('/katas')
    expect(screen.getByRole('link', { name: /katas/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /belts/ })).not.toHaveAttribute('aria-current')
  })
})
