import { describe, it, expect } from 'vitest'
import { splitOnFigureDirectives } from '../FigureRenderer'

describe('splitOnFigureDirectives', () => {
  it('returns one text segment when no directive is present', () => {
    const segments = splitOnFigureDirectives('Just prose, no figures here.')
    expect(segments).toEqual([{ kind: 'text', content: 'Just prose, no figures here.' }])
  })

  it('extracts a single directive between two text segments', () => {
    const md = 'before\n\n:figure[before-after]{id="npm-vs-bundle"}\n\nafter'
    const segments = splitOnFigureDirectives(md)
    expect(segments).toEqual([
      { kind: 'text', content: 'before\n\n' },
      { kind: 'figure', figureType: 'before-after', id: 'npm-vs-bundle' },
      { kind: 'text', content: '\n\nafter' },
    ])
  })

  it('extracts every canon figure type from a realistic body', () => {
    const md = [
      ':figure[before-after]{id="foreach-vs-each-block"}',
      'mid prose',
      ':figure[disambiguation]{id="string-vs-symbol"}',
      'more prose',
      ':figure[two-by-two]{id="operators-as-messages"}',
      'still more',
      ':figure[array-track]{id="each-vs-map-vs-select"}',
      'almost done',
      ':figure[tabbed-card]{id="block-anatomy"}',
    ].join('\n\n')
    const segments = splitOnFigureDirectives(md)
    const figures = segments.filter((s) => s.kind === 'figure')
    expect(figures).toHaveLength(5)
    expect(
      figures.map((f) => (f.kind === 'figure' ? [f.figureType, f.id] : [])),
    ).toEqual([
      ['before-after', 'foreach-vs-each-block'],
      ['disambiguation', 'string-vs-symbol'],
      ['two-by-two', 'operators-as-messages'],
      ['array-track', 'each-vs-map-vs-select'],
      ['tabbed-card', 'block-anatomy'],
    ])
  })

  it('ignores malformed directives (missing id attr)', () => {
    const segments = splitOnFigureDirectives('before :figure[before-after]{} after')
    expect(segments).toEqual([{ kind: 'text', content: 'before :figure[before-after]{} after' }])
  })
})
