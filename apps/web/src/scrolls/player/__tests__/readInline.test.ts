import { describe, it, expect } from 'vitest'
import type { ReadInlineInteraction } from '@dojo/shared'
import { splitOnInteractionMarkers } from '../steps/readInline'

const reveal: ReadInlineInteraction = {
  kind: 'reveal',
  after: 'think-first',
  prompt: 'Before reading on — what does this print?',
  answer: 'It prints `nil`.',
}

const quiz: ReadInlineInteraction = {
  kind: 'micro-quiz',
  after: 'check-point',
  question: 'Is a Symbol mutable?',
  options: ['Yes', 'No'],
  correct: 1,
  feedback: ['Strings are mutable; Symbols are frozen identities.', 'Right — one object per name, frozen.'],
}

describe('splitOnInteractionMarkers', () => {
  it('returns the whole prose as one segment when there are no markers or interactions', () => {
    const segments = splitOnInteractionMarkers('Just prose.', [])
    expect(segments).toEqual([{ prose: 'Just prose.', interaction: null }])
  })

  it('pairs a marker with its interaction and keeps surrounding prose', () => {
    const md = 'Intro prose.\n\n<!-- interact:think-first -->\n\nAfter prose.'
    const segments = splitOnInteractionMarkers(md, [reveal])
    expect(segments).toHaveLength(2)
    expect(segments[0]).toEqual({ prose: 'Intro prose.\n\n', interaction: reveal })
    expect(segments[1]).toEqual({ prose: '\n\nAfter prose.', interaction: null })
  })

  it('handles multiple interactions in document order', () => {
    const md = 'A <!-- interact:check-point --> B <!-- interact:think-first --> C'
    const segments = splitOnInteractionMarkers(md, [reveal, quiz])
    expect(segments.map((s) => s.interaction?.after ?? null)).toEqual([
      'check-point',
      'think-first',
      null,
    ])
  })

  it('drops a marker with no matching interaction but keeps the prose', () => {
    const md = 'Before <!-- interact:missing --> after.'
    const segments = splitOnInteractionMarkers(md, [])
    expect(segments).toEqual([
      { prose: 'Before ', interaction: null },
      { prose: ' after.', interaction: null },
    ])
  })

  it('appends interactions whose marker never appears so they degrade visibly', () => {
    const segments = splitOnInteractionMarkers('No markers here.', [quiz])
    expect(segments).toEqual([
      { prose: 'No markers here.', interaction: null },
      { prose: '', interaction: quiz },
    ])
  })

  it('tolerates whitespace inside the marker comment', () => {
    const segments = splitOnInteractionMarkers('x <!--  interact:check-point  --> y', [quiz])
    expect(segments[0]?.interaction).toBe(quiz)
  })
})
