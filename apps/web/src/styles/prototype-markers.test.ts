import { describe, expect, it } from 'vitest'

const MARKER = /\[PROPOSED\]|prototype-/

const sources = import.meta.glob<string>(
  ['../**/*.{ts,tsx,css}', '!**/prototype-markers.test.ts'],
  { query: '?raw', import: 'default', eager: true },
)

describe('prototype markers', () => {
  it('recognises both markers', () => {
    expect(MARKER.test('Opening the dojo [PROPOSED]')).toBe(true)
    expect(MARKER.test('<dialog class="prototype-dialog">')).toBe(true)
    expect(MARKER.test('Array.prototype.map')).toBe(false)
  })

  it('never reach the source tree', () => {
    const files = Object.entries(sources)
    expect(files.length).toBeGreaterThan(100)
    expect(files.filter(([, source]) => MARKER.test(source)).map(([path]) => path)).toEqual([])
  })
})
