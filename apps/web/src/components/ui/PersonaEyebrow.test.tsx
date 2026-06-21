import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PersonaEyebrow } from './PersonaEyebrow'

describe('PersonaEyebrow', () => {
  it('wraps the role in square brackets so it reads as a persona tag', () => {
    render(<PersonaEyebrow role="SENSEI" />)
    expect(screen.getByText('[SENSEI]')).toBeInTheDocument()
  })

  it('renders the exact role text the caller passes, unmodified', () => {
    render(<PersonaEyebrow role="code reviewer" />)
    // The role is interpolated verbatim between the brackets — no casing change
    // in the DOM (uppercase is a CSS-only concern).
    expect(screen.getByText('[code reviewer]')).toBeInTheDocument()
  })

  it('applies the monospaced uppercase eyebrow styling', () => {
    render(<PersonaEyebrow role="SENSEI" />)
    const eyebrow = screen.getByText('[SENSEI]')
    expect(eyebrow).toHaveClass('font-mono', 'uppercase', 'text-secondary')
  })

  it('merges a caller className alongside the base styling instead of replacing it', () => {
    render(<PersonaEyebrow role="SENSEI" className="mt-4" />)
    const eyebrow = screen.getByText('[SENSEI]')
    expect(eyebrow).toHaveClass('mt-4')
    expect(eyebrow).toHaveClass('font-mono')
  })

  it('renders cleanly with no className so the trailing slot stays empty', () => {
    render(<PersonaEyebrow role="SENSEI" />)
    const eyebrow = screen.getByText('[SENSEI]')
    expect(eyebrow.className).not.toMatch(/undefined/)
    expect(eyebrow.className.trim().endsWith('text-secondary')).toBe(true)
  })
})
