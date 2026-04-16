import { describe, it, expect } from 'vitest'
import { renderSlots } from '../slots'

describe('renderSlots', () => {
  it('returns null when the instruction does not open with a slot heading', () => {
    expect(renderSlots('Hello world\n\nJust some markdown')).toBeNull()
    expect(renderSlots('## Intro\n\nNot a slot')).toBeNull()
    expect(renderSlots('')).toBeNull()
  })

  it('parses all four slots when present', () => {
    const md = [
      '## Why this matters',
      'Reason',
      '',
      '## Your task',
      'Do X',
      '',
      '## Examples',
      'foo -> bar',
      '',
      '## Edge cases',
      'handle null',
    ].join('\n')

    const result = renderSlots(md)
    expect(result).toHaveLength(4)
    expect(result?.[0]).toEqual({ slot: 'Why this matters', body: 'Reason' })
    expect(result?.[1]).toEqual({ slot: 'Your task', body: 'Do X' })
    expect(result?.[2]).toEqual({ slot: 'Examples', body: 'foo -> bar' })
    expect(result?.[3]).toEqual({ slot: 'Edge cases', body: 'handle null' })
  })

  it('leaves non-slot headings embedded in the preceding slot body', () => {
    const md = [
      '## Your task',
      'Do X',
      '',
      '### Subheading',
      'nested content',
    ].join('\n')

    const result = renderSlots(md)
    expect(result).toHaveLength(1)
    expect(result![0]!.slot).toBe('Your task')
    expect(result![0]!.body).toContain('### Subheading')
    expect(result![0]!.body).toContain('nested content')
  })

  it('tolerates leading whitespace before the first slot heading', () => {
    const md = '\n\n## Why this matters\nSomething\n'
    const result = renderSlots(md)
    expect(result).toHaveLength(1)
    expect(result?.[0]).toEqual({ slot: 'Why this matters', body: 'Something' })
  })

  it('preserves empty slot bodies', () => {
    const md = '## Why this matters\n\n## Your task\nDo X\n'
    const result = renderSlots(md)
    expect(result).toHaveLength(2)
    expect(result?.[0]).toEqual({ slot: 'Why this matters', body: '' })
    expect(result?.[1]).toEqual({ slot: 'Your task', body: 'Do X' })
  })

  it('ignores a second slot heading only when not at the start (still parsed normally)', () => {
    // A non-slot H2 followed by a slot H2 should still return null
    // because the document does not open with a slot.
    const md = '## Prelude\n\nSomething\n\n## Your task\nDo X\n'
    expect(renderSlots(md)).toBeNull()
  })
})
