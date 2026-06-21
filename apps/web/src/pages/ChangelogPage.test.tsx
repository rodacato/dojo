import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ChangelogPage } from './ChangelogPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/changelog']}>
      <ChangelogPage />
    </MemoryRouter>,
  )
}

describe('ChangelogPage', () => {
  it('renders the page header inside the public layout chrome', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'What we shipped.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Sprint by sprint. No marketing. Just done.'),
    ).toBeInTheDocument()

    // PublicPageLayout is the real child — its nav marks /changelog active.
    const nav = screen.getByRole('navigation')
    expect(within(nav).getByRole('link', { name: 'Changelog' })).toHaveClass(
      'text-primary',
    )
  })

  it('renders an article per changelog entry with its date and title', () => {
    renderPage()

    const articles = screen.getAllByRole('article')
    // Distinct from the single-entry/empty case: the fixed set ships 9 entries.
    expect(articles).toHaveLength(9)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'The five-language scroll set is live',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Core loop complete' }),
    ).toBeInTheDocument()

    // The date renders in its own <time> element next to the newest entry.
    const newest = screen
      .getByRole('heading', { level: 2, name: 'The five-language scroll set is live' })
      .closest('article')
    expect(newest).not.toBeNull()
    expect(within(newest as HTMLElement).getByText('2026-06-20').tagName).toBe('TIME')
  })

  it('accents Phase 1 entries and mutes Phase 0 entries', () => {
    renderPage()

    const phase1 = screen
      .getByRole('heading', { level: 2, name: 'Scrolls, reshaped' })
      .closest('article') as HTMLElement
    const phase0 = screen
      .getByRole('heading', { level: 2, name: 'Core loop complete' })
      .closest('article') as HTMLElement

    expect(within(phase1).getByText('Phase 1')).toHaveClass('text-accent')
    expect(within(phase0).getByText('Phase 0')).toHaveClass('text-muted')
    expect(within(phase0).getByText('Phase 0')).not.toHaveClass('text-accent')
  })

  it('puts a divider between consecutive entries but not after the last', () => {
    renderPage()

    const articles = screen.getAllByRole('article')
    const first = articles.at(0) as HTMLElement
    const last = articles.at(-1) as HTMLElement

    expect(first.className).toContain('border-b')
    expect(last.className).not.toContain('border-b')
  })

  it('renders the trailing "More history coming." footer note', () => {
    renderPage()
    expect(screen.getByText(/More history coming\./)).toBeInTheDocument()
  })
})
