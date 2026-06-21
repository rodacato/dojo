import { describe, expect, it } from 'vitest'

import { RUST_FIGURES } from './rust-figures'

const KNOWN_FIGURE_TYPES = new Set([
  'array-track',
  'before-after',
  'disambiguation',
  'metric-pair',
  'tabbed-card',
  'two-by-two',
])

describe('RUST_FIGURES', () => {
  it('exports a non-empty record', () => {
    const entries = Object.entries(RUST_FIGURES)
    expect(entries.length).toBeGreaterThan(0)
  })

  it('keys each entry by its own id so directive lookups resolve', () => {
    for (const [key, figure] of Object.entries(RUST_FIGURES)) {
      expect(figure.id).toBe(key)
    }
  })

  it('gives every entry a type FigureRenderer can dispatch', () => {
    for (const figure of Object.values(RUST_FIGURES)) {
      expect(KNOWN_FIGURE_TYPES).toContain(figure.type)
    }
  })
})
