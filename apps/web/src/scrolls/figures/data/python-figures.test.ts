import { describe, expect, it } from 'vitest'

import { PYTHON_FIGURES } from './python-figures'

const DISPATCHABLE_TYPES = new Set([
  'array-track',
  'before-after',
  'disambiguation',
  'metric-pair',
  'tabbed-card',
  'two-by-two',
])

describe('PYTHON_FIGURES', () => {
  it('exports a non-empty record', () => {
    expect(Object.keys(PYTHON_FIGURES).length).toBeGreaterThan(0)
  })

  it('keys every figure under its own id (FigureRenderer resolves ALL_FIGURES[id])', () => {
    for (const [key, figure] of Object.entries(PYTHON_FIGURES)) {
      expect(figure.id).toBe(key)
    }
  })

  it('gives every figure a type the FigureRenderer switch can dispatch', () => {
    for (const figure of Object.values(PYTHON_FIGURES)) {
      expect(DISPATCHABLE_TYPES).toContain(figure.type)
    }
  })

  it('keeps array-track state rows aligned with the input cells they annotate', () => {
    for (const figure of Object.values(PYTHON_FIGURES)) {
      if (figure.type !== 'array-track') continue
      expect(figure.tracks.length).toBeGreaterThan(0)
      for (const track of figure.tracks) {
        expect(track.states.length).toBe(figure.input.length)
      }
    }
  })

  it('keeps every metric-pair highlight index inside its entries', () => {
    for (const figure of Object.values(PYTHON_FIGURES)) {
      if (figure.type !== 'metric-pair') continue
      expect(figure.entries.length).toBeGreaterThan(0)
      if (figure.highlight !== undefined) {
        expect(figure.highlight).toBeGreaterThanOrEqual(0)
        expect(figure.highlight).toBeLessThan(figure.entries.length)
      }
    }
  })

  it('keeps every tabbed-card defaultTab pointing at a real tab', () => {
    for (const figure of Object.values(PYTHON_FIGURES)) {
      if (figure.type !== 'tabbed-card') continue
      expect(figure.tabs.length).toBeGreaterThan(0)
      if (figure.defaultTab !== undefined) {
        expect(figure.defaultTab).toBeGreaterThanOrEqual(0)
        expect(figure.defaultTab).toBeLessThan(figure.tabs.length)
      }
    }
  })

  it('keeps disambiguation highlightAttribute and entry values consistent with the attribute list', () => {
    for (const figure of Object.values(PYTHON_FIGURES)) {
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
})
