import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { KumitePlaceholderPage } from './KumitePlaceholderPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/kumite']}>
      <KumitePlaceholderPage />
    </MemoryRouter>,
  )
}

describe('KumitePlaceholderPage', () => {
  it('renders the Kumite heading as the page title', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Kumite' }),
    ).toBeInTheDocument()
  })

  it('frames the page as a coming-soon placeholder, not a shipped feature', () => {
    renderPage()

    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByText(/Not built yet/)).toBeInTheDocument()
    expect(screen.getByText(/Until then — practice solo\./)).toBeInTheDocument()
  })

  it('explains what kumite is so the route stays honest', () => {
    renderPage()

    expect(
      screen.getByText(/Kumite is sparring\. One kata, two developers/),
    ).toBeInTheDocument()
  })
})
