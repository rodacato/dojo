import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TermsPage } from './TermsPage'

beforeAll(() => {
  // jsdom has no IntersectionObserver; LegalPage observes its sections on mount.
  class StubObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds: ReadonlyArray<number> = []
  }
  vi.stubGlobal('IntersectionObserver', StubObserver)
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/terms']}>
      <TermsPage />
    </MemoryRouter>,
  )
}

describe('TermsPage', () => {
  it('renders the title and effective date header', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Terms of Service' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Last updated 2026-04-15')).toBeInTheDocument()
  })

  it('renders an on-this-page table of contents linking to every section anchor', () => {
    renderPage()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const tocLinks = within(toc).getAllByRole('link')

    expect(tocLinks.map((a) => a.getAttribute('href'))).toEqual([
      '#what-dojo-is',
      '#what-you-agree-to',
      '#honor-code',
      '#termination',
      '#license',
      '#changes',
      '#contact',
    ])
  })

  it('renders each section heading with its ordinal in document order', () => {
    renderPage()

    const sectionHeadings = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)

    expect(sectionHeadings).toEqual([
      '§01What dojo is',
      '§02What you agree to',
      '§03The honor code',
      '§04Account termination',
      '§05Open source license',
      '§06Changes to these terms',
      '§07Contact',
    ])
  })

  it('renders distinctive legal copy from the section bodies', () => {
    renderPage()

    expect(
      screen.getByText(/timer doesn't pause\. The kata is yours\. No AI during the kata\./i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Dojo is open source under the MIT License/i),
    ).toBeInTheDocument()
  })

  it('points the questions aside at the open-source page', () => {
    renderPage()

    const asideLink = screen.getByRole('link', { name: '/open-source' })
    expect(asideLink).toHaveAttribute('href', '/open-source')
  })
})
