import { describe, expect, it } from 'vitest'
import { parseInsight } from './parse-insight'

describe('parseInsight', () => {
  describe('strengths / improvements bullet extraction', () => {
    it('returns null for a tag that is absent from the text', () => {
      const result = parseInsight('no tags here at all')
      expect(result.strengths).toBeNull()
      expect(result.improvements).toBeNull()
    })

    it('extracts dash bullets, stripping the "- " prefix and trimming each line', () => {
      const text = [
        '<strengths>',
        '-   clean naming',
        '- tight scope  ',
        '</strengths>',
      ].join('\n')
      const result = parseInsight(text)
      expect(result.strengths).toEqual(['clean naming', 'tight scope'])
    })

    it('keeps only dash-prefixed lines and drops prose lines inside the tag', () => {
      const text = [
        '<improvements>',
        'Here is some intro prose that is not a bullet',
        '- handle the null case',
        'another non-bullet line',
        '- add a test',
        '</improvements>',
      ].join('\n')
      const result = parseInsight(text)
      expect(result.improvements).toEqual(['handle the null case', 'add a test'])
    })

    it('returns null when the tag exists but contains no dash bullets', () => {
      const text = '<strengths>\njust prose, no bullets here\n</strengths>'
      expect(parseInsight(text).strengths).toBeNull()
    })

    it('returns null when the tag is present but empty', () => {
      expect(parseInsight('<strengths></strengths>').strengths).toBeNull()
    })

    it('does not treat a line whose trimmed form starts with "- " unless leading whitespace is stripped first', () => {
      // Lines are trimmed before the startsWith('- ') check, so indented
      // bullets still count.
      const text = '<strengths>\n      - indented bullet\n</strengths>'
      expect(parseInsight(text).strengths).toEqual(['indented bullet'])
    })

    it('requires the space after the dash: a bare "-" line is not a bullet', () => {
      const text = '<strengths>\n-nodash\n- real\n</strengths>'
      expect(parseInsight(text).strengths).toEqual(['real'])
    })

    it('uses the first occurrence when the same tag appears twice (non-greedy match)', () => {
      const text =
        '<strengths>\n- first block\n</strengths>\n<strengths>\n- second block\n</strengths>'
      expect(parseInsight(text).strengths).toEqual(['first block'])
    })

    it('extracts strengths and improvements independently from the same text', () => {
      const text = [
        '<strengths>',
        '- correct edge handling',
        '</strengths>',
        '<improvements>',
        '- name the variable better',
        '- extract the helper',
        '</improvements>',
      ].join('\n')
      const result = parseInsight(text)
      expect(result.strengths).toEqual(['correct edge handling'])
      expect(result.improvements).toEqual([
        'name the variable better',
        'extract the helper',
      ])
    })

    it('drops a dash with only trailing whitespace because trimming removes the required space', () => {
      // '- '.trim() === '-', which no longer startsWith('- '), so it is filtered out.
      const text = '<strengths>\n- \n- real one\n</strengths>'
      expect(parseInsight(text).strengths).toEqual(['real one'])
    })

    it('keeps a bullet whose payload is whitespace-then-text as the trimmed text', () => {
      const text = '<strengths>\n-    spaced payload\n</strengths>'
      expect(parseInsight(text).strengths).toEqual(['spaced payload'])
    })

    it('does not match across a malformed (unclosed) tag', () => {
      const text = '<strengths>\n- orphan bullet\nno closing tag'
      expect(parseInsight(text).strengths).toBeNull()
    })
  })

  describe('approachNote extraction', () => {
    it('returns the trimmed content when the note is present', () => {
      const text = '<approach_note>\n  Consider a streaming parser.\n</approach_note>'
      expect(parseInsight(text).approachNote).toBe('Consider a streaming parser.')
    })

    it('returns null when the note tag is absent', () => {
      expect(parseInsight('nothing relevant').approachNote).toBeNull()
    })

    it('returns null when the note tag is present but empty', () => {
      expect(parseInsight('<approach_note></approach_note>').approachNote).toBeNull()
    })

    it('returns null when the note contains only whitespace', () => {
      expect(parseInsight('<approach_note>   \n\t </approach_note>').approachNote).toBeNull()
    })

    it('preserves internal whitespace while trimming the edges', () => {
      const text = '<approach_note>line one\n\nline two</approach_note>'
      expect(parseInsight(text).approachNote).toBe('line one\n\nline two')
    })

    it('uses the first occurrence when the note tag repeats', () => {
      const text =
        '<approach_note>first</approach_note><approach_note>second</approach_note>'
      expect(parseInsight(text).approachNote).toBe('first')
    })
  })

  describe('combined output', () => {
    it('returns all three fields populated for a fully-formed insight payload', () => {
      const text = [
        'preamble that should be ignored',
        '<strengths>',
        '- idiomatic loop',
        '- no off-by-one',
        '</strengths>',
        '<improvements>',
        '- add input validation',
        '</improvements>',
        '<approach_note>',
        'Solid baseline; tighten the error path.',
        '</approach_note>',
        'trailing noise',
      ].join('\n')

      expect(parseInsight(text)).toEqual({
        strengths: ['idiomatic loop', 'no off-by-one'],
        improvements: ['add input validation'],
        approachNote: 'Solid baseline; tighten the error path.',
      })
    })

    it('returns all-null fields for an empty string', () => {
      expect(parseInsight('')).toEqual({
        strengths: null,
        improvements: null,
        approachNote: null,
      })
    })

    it('returns all-null fields when no recognized tags are present', () => {
      expect(parseInsight('<other>- nope</other>')).toEqual({
        strengths: null,
        improvements: null,
        approachNote: null,
      })
    })
  })
})
