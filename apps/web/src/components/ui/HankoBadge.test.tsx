import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { HankoBadge } from './HankoBadge'

describe('HankoBadge', () => {
  it('stacks a single word one uppercased character per line (seal aesthetic)', () => {
    render(<HankoBadge text="dan" />)

    const badge = screen.getByLabelText('dan')
    const lines = Array.from(badge.querySelectorAll('span'))
    expect(lines.map((s) => s.textContent)).toEqual(['D', 'A', 'N'])
  })

  it('stacks a multi-word string one uppercased word per line', () => {
    render(<HankoBadge text="black belt" />)

    const badge = screen.getByLabelText('black belt')
    const lines = Array.from(badge.querySelectorAll('span'))
    expect(lines.map((s) => s.textContent)).toEqual(['BLACK', 'BELT'])
  })

  it('collapses irregular whitespace into single word-per-line tokens', () => {
    const { container } = render(<HankoBadge text="  first   second  " />)

    // Label keeps the raw (lowercased) text; only the stacked glyphs are tokenized.
    const badge = container.firstElementChild!
    expect(badge).toHaveAttribute('aria-label', '  first   second  ')
    const lines = Array.from(badge.querySelectorAll('span'))
    expect(lines.map((s) => s.textContent)).toEqual(['FIRST', 'SECOND'])
  })

  it('exposes the original (lowercased) text as the accessible label, not the stacked glyphs', () => {
    render(<HankoBadge text="Dan" />)

    // Label is human-readable even though the visible content is split per char.
    expect(screen.getByLabelText('dan')).toBeInTheDocument()
  })

  it('renders earned by default with full-opacity accent styling', () => {
    render(<HankoBadge text="dan" />)

    const badge = screen.getByLabelText('dan')
    expect(badge).toHaveClass('bg-accent', 'text-on-accent')
    expect(badge).not.toHaveClass('opacity-30')
    expect(badge).not.toHaveClass('grayscale')
  })

  it('dims and desaturates an unearned badge', () => {
    render(<HankoBadge text="dan" earned={false} />)

    const badge = screen.getByLabelText('dan')
    expect(badge).toHaveClass('opacity-30', 'grayscale')
  })

  it('scales the glyph font size with the size prop', () => {
    const { rerender } = render(<HankoBadge text="dan" size="md" />)
    const firstSpan = () => screen.getByLabelText('dan').querySelector('span')!

    expect(firstSpan()).toHaveStyle({ fontSize: '9px' })

    rerender(<HankoBadge text="dan" size="sm" />)
    expect(firstSpan()).toHaveStyle({ fontSize: '7px' })
  })

  it('scales the minimum stamp width with the size prop', () => {
    const { rerender } = render(<HankoBadge text="dan" size="md" />)
    expect(screen.getByLabelText('dan')).toHaveStyle({ minWidth: '32px' })

    rerender(<HankoBadge text="dan" size="sm" />)
    expect(screen.getByLabelText('dan')).toHaveStyle({ minWidth: '24px' })
  })

  it('merges a caller className alongside the base square styling', () => {
    render(<HankoBadge text="dan" className="rotate-3" />)

    const badge = screen.getByLabelText('dan')
    expect(badge).toHaveClass('rotate-3')
    expect(badge).toHaveClass('bg-accent', 'rounded-sm')
  })

  it('renders a single empty line without crashing when text is blank', () => {
    const { container } = render(<HankoBadge text="   " />)

    const badge = container.firstElementChild!
    const lines = Array.from(badge.querySelectorAll('span'))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toHaveTextContent('')
  })
})
