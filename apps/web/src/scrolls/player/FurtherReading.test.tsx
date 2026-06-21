import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ExternalReference } from '@dojo/shared'

import { FurtherReading } from './FurtherReading'

const refs: ExternalReference[] = [
  { title: 'SICP', url: 'https://example.com/sicp', kind: 'book' },
  { title: 'MDN Arrays', url: 'https://example.com/mdn', kind: 'docs' },
  { title: 'Boundaries (talk)', url: 'https://example.com/talk', kind: 'talk' },
  { title: 'On recursion', url: 'https://example.com/article', kind: 'article' },
]

describe('FurtherReading', () => {
  it('renders nothing when there are no references', () => {
    const { container } = render(<FurtherReading refs={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('starts collapsed: the toggle shows but the links are hidden', () => {
    render(<FurtherReading refs={refs} />)
    expect(screen.getByRole('button', { name: /further reading/i })).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('reveals every reference as a link when expanded', async () => {
    const user = userEvent.setup()
    render(<FurtherReading refs={refs} />)

    await user.click(screen.getByRole('button', { name: /further reading/i }))

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(refs.length)
    expect(screen.getByRole('link', { name: 'SICP' })).toHaveAttribute(
      'href',
      'https://example.com/sicp',
    )
  })

  it('opens external links safely in a new tab', async () => {
    const user = userEvent.setup()
    render(<FurtherReading refs={refs} />)

    await user.click(screen.getByRole('button', { name: /further reading/i }))

    const link = screen.getByRole('link', { name: 'MDN Arrays' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows the kind-specific icon next to each reference', async () => {
    const user = userEvent.setup()
    render(<FurtherReading refs={refs} />)

    await user.click(screen.getByRole('button', { name: /further reading/i }))

    expect(screen.getByText('📘')).toBeInTheDocument()
    expect(screen.getByText('📄')).toBeInTheDocument()
    expect(screen.getByText('🎤')).toBeInTheDocument()
    expect(screen.getByText('📝')).toBeInTheDocument()
  })

  it('collapses again on a second click, hiding the links', async () => {
    const user = userEvent.setup()
    render(<FurtherReading refs={refs} />)

    const toggle = screen.getByRole('button', { name: /further reading/i })
    await user.click(toggle)
    expect(screen.getAllByRole('link')).toHaveLength(refs.length)

    await user.click(toggle)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
