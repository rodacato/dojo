import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LegalPage, type LegalSection } from './LegalPage'

// jsdom has no IntersectionObserver; LegalPage instantiates one in an effect
// when sections exist. Stub it so the effect runs, and record observed targets.
const observed: Element[] = []
const disconnect = vi.fn()

class MockIntersectionObserver {
  observe = (el: Element) => observed.push(el)
  unobserve = vi.fn()
  disconnect = disconnect
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}

beforeEach(() => {
  observed.length = 0
  disconnect.mockClear()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const sections: LegalSection[] = [
  { id: 'scope', label: 'Scope', body: <p>This covers the whole dojo.</p> },
  { id: 'data', label: 'Data we keep', body: <p>We keep almost nothing.</p> },
]

function renderLegalPage(props?: Partial<Parameters<typeof LegalPage>[0]>) {
  return render(
    <MemoryRouter>
      <LegalPage
        title="Terms of Service"
        lastUpdated="2026-06-01"
        sections={sections}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('LegalPage', () => {
  it('surfaces the title and last-updated date', () => {
    renderLegalPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Terms of Service' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Last updated 2026-06-01')).toBeInTheDocument()
  })

  it('renders each section heading with its zero-padded number and body', () => {
    renderLegalPage()

    const scopeHeading = screen.getByRole('heading', { level: 2, name: /Scope/ })
    expect(scopeHeading).toHaveTextContent('§01')
    expect(scopeHeading).toHaveTextContent('Scope')

    const dataHeading = screen.getByRole('heading', { level: 2, name: /Data we keep/ })
    expect(dataHeading).toHaveTextContent('§02')

    expect(screen.getByText('This covers the whole dojo.')).toBeInTheDocument()
    expect(screen.getByText('We keep almost nothing.')).toBeInTheDocument()
  })

  it('renders a table-of-contents nav with an anchor link per section', () => {
    renderLegalPage()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const links = within(toc).getAllByRole('link')

    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '#scope')
    expect(links[0]).toHaveTextContent('Scope')
    expect(links[1]).toHaveAttribute('href', '#data')
    expect(links[1]).toHaveTextContent('Data we keep')
  })

  it('reflects the section count and ids when given different legal content', () => {
    renderLegalPage({
      title: 'Privacy Policy',
      sections: [{ id: 'cookies', label: 'Cookies', body: <p>No tracking cookies.</p> }],
    })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Policy' }),
    ).toBeInTheDocument()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const links = within(toc).getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '#cookies')
    expect(screen.getByText('No tracking cookies.')).toBeInTheDocument()
  })

  it('observes one element per section for scroll-spy and disconnects on unmount', () => {
    const { unmount } = renderLegalPage()

    const observedIds = observed.map((el) => el.id).sort()
    expect(observedIds).toEqual(['data', 'scope'])

    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
