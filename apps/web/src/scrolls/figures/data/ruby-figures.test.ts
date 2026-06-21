import { describe, expect, it } from 'vitest'

import { RUBY_FIGURES } from './ruby-figures'

const KNOWN_FIGURE_TYPES = new Set([
  'array-track',
  'before-after',
  'disambiguation',
  'metric-pair',
  'tabbed-card',
  'two-by-two',
])

describe('RUBY_FIGURES', () => {
  it('exports a non-empty record', () => {
    expect(Object.keys(RUBY_FIGURES).length).toBeGreaterThan(0)
  })

  it('keys each entry under its own id so directive lookups resolve', () => {
    for (const [key, figure] of Object.entries(RUBY_FIGURES)) {
      expect(figure.id).toBe(key)
    }
  })

  it('gives every entry a type FigureRenderer can dispatch on', () => {
    for (const figure of Object.values(RUBY_FIGURES)) {
      expect(KNOWN_FIGURE_TYPES).toContain(figure.type)
    }
  })

  it('keeps each disambiguation highlightAttribute resolvable across every entry', () => {
    const seen = Object.values(RUBY_FIGURES).filter(
      (f) => f.type === 'disambiguation',
    )
    expect(seen.length).toBeGreaterThan(0)

    for (const figure of seen) {
      if (figure.type !== 'disambiguation') continue
      expect(figure.attributes).toContain(figure.highlightAttribute)
      expect(figure.entries.length).toBeGreaterThan(0)
      for (const entry of figure.entries) {
        for (const attr of figure.attributes) {
          expect(entry.values[attr]).toBeDefined()
        }
      }
    }
  })

  it('points each metric-pair highlight at a real entry index', () => {
    const seen = Object.values(RUBY_FIGURES).filter(
      (f) => f.type === 'metric-pair',
    )
    expect(seen.length).toBeGreaterThan(0)

    for (const figure of seen) {
      if (figure.type !== 'metric-pair') continue
      if (figure.highlight === undefined) continue
      expect(figure.highlight).toBeGreaterThanOrEqual(0)
      expect(figure.highlight).toBeLessThan(figure.entries.length)
    }
  })

  it('keeps each two-by-two highlightCell inside the cell grid', () => {
    const seen = Object.values(RUBY_FIGURES).filter(
      (f) => f.type === 'two-by-two',
    )
    expect(seen.length).toBeGreaterThan(0)

    for (const figure of seen) {
      if (figure.type !== 'two-by-two') continue
      if (!figure.highlightCell) continue
      const [row, col] = figure.highlightCell
      expect(figure.cells[row]).toBeDefined()
      expect(figure.cells[row][col]).toBeDefined()
    }
  })

  it('gives every before-after figure both panes with code', () => {
    const seen = Object.values(RUBY_FIGURES).filter(
      (f) => f.type === 'before-after',
    )
    expect(seen.length).toBeGreaterThan(0)

    for (const figure of seen) {
      if (figure.type !== 'before-after') continue
      expect(figure.left.code.length).toBeGreaterThan(0)
      expect(figure.right.code.length).toBeGreaterThan(0)
    }
  })
})
