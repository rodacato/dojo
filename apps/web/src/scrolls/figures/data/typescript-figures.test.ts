import { describe, expect, it } from 'vitest'

import { TYPESCRIPT_FIGURES } from './typescript-figures'

const VALID_TYPES = [
  'array-track',
  'before-after',
  'disambiguation',
  'metric-pair',
  'tabbed-card',
  'two-by-two',
]

describe('TYPESCRIPT_FIGURES', () => {
  it('is a non-empty record', () => {
    expect(Object.keys(TYPESCRIPT_FIGURES).length).toBeGreaterThan(0)
  })

  it('keys each figure under its own id (FigureRenderer looks figures up by key)', () => {
    for (const [key, figure] of Object.entries(TYPESCRIPT_FIGURES)) {
      expect(figure.id).toBe(key)
    }
  })

  it('gives every figure a type FigureRenderer can dispatch on', () => {
    for (const figure of Object.values(TYPESCRIPT_FIGURES)) {
      expect(VALID_TYPES).toContain(figure.type)
    }
  })

  it('keeps every disambiguation highlightAttribute inside its attributes list', () => {
    for (const figure of Object.values(TYPESCRIPT_FIGURES)) {
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

  it('gives every before-after figure both panes with code', () => {
    for (const figure of Object.values(TYPESCRIPT_FIGURES)) {
      if (figure.type !== 'before-after') continue
      expect(figure.left.code.length).toBeGreaterThan(0)
      expect(figure.right.code.length).toBeGreaterThan(0)
    }
  })
})
