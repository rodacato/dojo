import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { MarkdownContent, PlainMarkdown, stripLeadingH1 } from './markdown'

describe('stripLeadingH1', () => {
  it('drops a leading H1 line plus its trailing blank line', () => {
    const out = stripLeadingH1('# Title\n\nBody paragraph.')
    expect(out).toBe('Body paragraph.')
  })

  it('drops the H1 even with a single trailing newline (no blank line)', () => {
    const out = stripLeadingH1('# Title\nBody paragraph.')
    expect(out).toBe('Body paragraph.')
  })

  it('leaves content untouched when the first line is not an H1', () => {
    const md = '## Subheading\n\nBody.'
    expect(stripLeadingH1(md)).toBe(md)
  })

  it('does not treat a heading further down as the leading H1', () => {
    const md = 'Intro text\n# Later heading\nMore.'
    expect(stripLeadingH1(md)).toBe(md)
  })
})

describe('PlainMarkdown', () => {
  it('renders inline-code markdown inside a paragraph', () => {
    const { container } = render(<PlainMarkdown content="Call `len(x)` now" />)
    const code = container.querySelector('code')
    expect(code).not.toBeNull()
    expect(code).toHaveTextContent('len(x)')
  })

  it('escapes raw HTML instead of rendering it', () => {
    const { container } = render(
      <PlainMarkdown content="Watch out for <script>alert(1)</script>" />,
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.innerHTML).toContain('&lt;script&gt;')
  })

  it('routes a figure directive to FigureRenderer and keeps surrounding text', () => {
    const content =
      'Before the figure.\n\n:figure[before-after]{id="not-a-real-figure-xyz"}\n\nAfter the figure.'
    render(<PlainMarkdown content={content} />)

    // Unknown figure id hits FigureRenderer's "data not registered" fallback.
    expect(screen.getByText('not-a-real-figure-xyz')).toBeInTheDocument()
    expect(screen.getByText(/data not registered/)).toBeInTheDocument()
    expect(screen.getByText(/Before the figure/)).toBeInTheDocument()
    expect(screen.getByText(/After the figure/)).toBeInTheDocument()
  })
})

describe('MarkdownContent', () => {
  it('renders the slot-card layout when the content opens with a known slot heading', () => {
    const content =
      '## Why this matters\n\nIt teaches recursion.\n\n## Your task\n\nWrite the function.'
    render(<MarkdownContent content={content} />)

    expect(screen.getByText('Why this matters')).toBeInTheDocument()
    expect(screen.getByText('Your task')).toBeInTheDocument()
    expect(screen.getByText(/It teaches recursion/)).toBeInTheDocument()
    expect(screen.getByText(/Write the function/)).toBeInTheDocument()
  })

  it('falls back to plain markdown when there is no slot heading', () => {
    render(<MarkdownContent content="Just a **bold** paragraph." />)

    expect(screen.queryByText('Why this matters')).not.toBeInTheDocument()
    const strong = screen.getByText('bold')
    expect(strong.tagName).toBe('STRONG')
  })
})
