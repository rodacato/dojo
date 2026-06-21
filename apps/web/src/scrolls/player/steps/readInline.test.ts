import type { ReadInlineInteraction } from '@dojo/shared'
import { describe, expect, it } from 'vitest'
import { splitOnInteractionMarkers } from './readInline'

function reveal(after: string): ReadInlineInteraction {
  return { kind: 'reveal', after, prompt: 'p', answer: 'a' }
}

describe('splitOnInteractionMarkers', () => {
  it('pairs a marker with the interaction whose `after` matches and splits prose around it', () => {
    const r = reveal('one')
    const segments = splitOnInteractionMarkers(
      'before<!-- interact:one -->after',
      [r],
    )

    expect(segments).toEqual([
      { prose: 'before', interaction: r },
      { prose: 'after', interaction: null },
    ])
  })

  it('drops a marker with no matching interaction (renders as plain prose, marker removed)', () => {
    const segments = splitOnInteractionMarkers('a<!-- interact:nope -->b', [])

    expect(segments.every((s) => s.interaction === null)).toBe(true)
    expect(segments.map((s) => s.prose).join('')).toBe('ab')
  })

  it('appends an interaction whose marker never appears at the end, in authored order', () => {
    const used = reveal('used')
    const orphanA = reveal('orphanA')
    const orphanB = reveal('orphanB')

    const segments = splitOnInteractionMarkers('x<!-- interact:used -->y', [
      orphanA,
      used,
      orphanB,
    ])

    expect(segments).toEqual([
      { prose: 'x', interaction: used },
      { prose: 'y', interaction: null },
      { prose: '', interaction: orphanA },
      { prose: '', interaction: orphanB },
    ])
  })

  it('handles instruction with no markers as a single prose segment', () => {
    const segments = splitOnInteractionMarkers('just prose', [])

    expect(segments).toEqual([{ prose: 'just prose', interaction: null }])
  })

  it('pairs multiple markers each to its own interaction', () => {
    const one = reveal('one')
    const two = reveal('two')

    const segments = splitOnInteractionMarkers(
      'a<!-- interact:one -->b<!-- interact:two -->c',
      [two, one],
    )

    expect(segments).toEqual([
      { prose: 'a', interaction: one },
      { prose: 'b', interaction: two },
      { prose: 'c', interaction: null },
    ])
  })
})
