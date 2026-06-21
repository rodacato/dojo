import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PrivacyPage } from './PrivacyPage'

// jsdom has no IntersectionObserver; LegalPage (rendered by PrivacyPage)
// instantiates one in an effect when sections exist. Stub it so the effect runs.
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPrivacy() {
  return render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>,
  )
}

const SECTION_LABELS = [
  'What we collect',
  "What we don't collect",
  'How data is used',
  'GitHub OAuth',
  'Data retention',
  'Your rights',
  'Contact',
]

describe('PrivacyPage', () => {
  it('renders the Privacy Policy title and last-updated date', () => {
    renderPrivacy()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Policy' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Last updated 2026-04-15')).toBeInTheDocument()
  })

  it('lists every privacy section in the table of contents in order', () => {
    renderPrivacy()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const links = within(toc).getAllByRole('link')

    expect(links.map((l) => l.textContent?.replace(/§\d+/, '').trim())).toEqual(
      SECTION_LABELS,
    )
    expect(links[1]).toHaveAttribute('href', "#what-we-dont")
    expect(links[3]).toHaveAttribute('href', '#github-oauth')
  })

  it('renders a level-2 heading for each section with its zero-padded number', () => {
    renderPrivacy()

    for (const label of SECTION_LABELS) {
      expect(
        screen.getByRole('heading', { level: 2, name: new RegExp(label) }),
      ).toBeInTheDocument()
    }

    const oauthHeading = screen.getByRole('heading', { level: 2, name: /GitHub OAuth/ })
    expect(oauthHeading).toHaveTextContent('§04')
  })

  it('surfaces the privacy-defining commitments: no training, minimal OAuth scopes', () => {
    renderPrivacy()

    expect(
      screen.getByText(/We do not use your data to train any/),
    ).toBeInTheDocument()
    expect(screen.getByText('read:user')).toBeInTheDocument()
    expect(screen.getByText('user:email')).toBeInTheDocument()
    expect(
      screen.getByText(/We don't sell them, share them, or use them to train models\./),
    ).toBeInTheDocument()
  })

  it('points unanswered questions to the open-source page', () => {
    renderPrivacy()

    expect(screen.getByRole('link', { name: '/open-source' })).toHaveAttribute(
      'href',
      '/open-source',
    )
  })
})
