import { describe, expect, it } from 'vitest'
import { EvaluationStreamParser } from './evaluation-parser'

const wellFormed = {
  verdict: 'passed',
  analysis: 'Solid reasoning, clean separation of concerns.',
  topicsToReview: ['indexing', 'transactions'],
  followUpQuestion: 'What would change at 10x scale?',
  isFinalEvaluation: false,
}

const wrapStream = (prose: string, json: object) => `${prose}<evaluation>${JSON.stringify(json)}</evaluation>`

// Push the whole payload as one chunk and finalize — the common single-shot path.
const parseWhole = (text: string) => {
  const parser = new EvaluationStreamParser()
  parser.push(text)
  return parser.finalize()
}

describe('EvaluationStreamParser', () => {
  describe('prose forwarding', () => {
    it('forwards prose before the evaluation block and withholds the block itself', () => {
      const parser = new EvaluationStreamParser()
      const forwarded = parser.push(wrapStream('Here is my read on it. ', wellFormed))

      expect(forwarded).toBe('Here is my read on it. ')
      expect(parser.proseChunks).toEqual(['Here is my read on it. '])
    })

    it('forwards plain prose chunks verbatim when no block has started', () => {
      const parser = new EvaluationStreamParser()
      expect(parser.push('First. ')).toBe('First. ')
      expect(parser.push('Second.')).toBe('Second.')
      expect(parser.proseChunks).toEqual(['First. ', 'Second.'])
    })

    it('does not forward chunks that arrive after the block opened', () => {
      const parser = new EvaluationStreamParser()
      parser.push('Intro <evaluation>{"verdict":')
      const afterOpen = parser.push('"passed"}')
      expect(afterOpen).toBe('')
      expect(parser.proseChunks).toEqual(['Intro '])
    })

    it('ignores pushes after finalize (done guard)', () => {
      const parser = new EvaluationStreamParser()
      parser.push(wrapStream('', wellFormed))
      parser.finalize()
      expect(parser.push('late chunk')).toBe('')
      expect(parser.proseChunks).toEqual([])
    })
  })

  describe('verdict variants', () => {
    it('parses passed', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, verdict: 'passed' }))
      expect(error).toBeNull()
      expect(result?.verdict).toBe('passed')
    })

    it('parses passed_with_notes', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, verdict: 'passed_with_notes' }))
      expect(error).toBeNull()
      expect(result?.verdict).toBe('passed_with_notes')
    })

    it('parses needs_work', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, verdict: 'needs_work' }))
      expect(error).toBeNull()
      expect(result?.verdict).toBe('needs_work')
    })

    it('rejects an unknown verdict', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, verdict: 'PASSED' }))
      expect(result).toBeNull()
      expect(error).toContain('Invalid verdict: PASSED')
    })
  })

  describe('full parse shape', () => {
    it('returns the exact parsed structure for a well-formed block', () => {
      const { result, error } = parseWhole(wrapStream('Some prose. ', wellFormed))
      expect(error).toBeNull()
      expect(result).toEqual({
        verdict: 'passed',
        analysis: 'Solid reasoning, clean separation of concerns.',
        topicsToReview: ['indexing', 'transactions'],
        followUpQuestion: 'What would change at 10x scale?',
        isFinalEvaluation: false,
      })
    })

    it('coerces a null followUpQuestion (final evaluation)', () => {
      const { result } = parseWhole(
        wrapStream('', { ...wellFormed, followUpQuestion: null, isFinalEvaluation: true }),
      )
      expect(result?.followUpQuestion).toBeNull()
      expect(result?.isFinalEvaluation).toBe(true)
    })

    it('drops non-string entries from topicsToReview', () => {
      const { result } = parseWhole(
        wrapStream('', { ...wellFormed, topicsToReview: ['valid', 42, null, 'also-valid', { x: 1 }] }),
      )
      expect(result?.topicsToReview).toEqual(['valid', 'also-valid'])
    })

    it('accepts an empty topicsToReview array', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, topicsToReview: [] }))
      expect(error).toBeNull()
      expect(result?.topicsToReview).toEqual([])
    })

    it('trims surrounding whitespace/newlines inside the block before JSON.parse', () => {
      const parser = new EvaluationStreamParser()
      parser.push(`<evaluation>\n  ${JSON.stringify(wellFormed)}\n</evaluation>`)
      const { result, error } = parser.finalize()
      expect(error).toBeNull()
      expect(result?.verdict).toBe('passed')
    })
  })

  describe('field validation', () => {
    it('rejects a missing analysis', () => {
      const { verdict: _v, analysis: _a, ...rest } = wellFormed
      const { result, error } = parseWhole(wrapStream('', { verdict: 'passed', ...rest }))
      expect(result).toBeNull()
      expect(error).toContain('Missing or empty analysis')
    })

    it('rejects an empty/whitespace analysis', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, analysis: '   ' }))
      expect(result).toBeNull()
      expect(error).toContain('Missing or empty analysis')
    })

    it('rejects a non-array topicsToReview', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, topicsToReview: 'indexing' }))
      expect(result).toBeNull()
      expect(error).toContain('topicsToReview must be an array')
    })

    it('rejects a numeric followUpQuestion', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, followUpQuestion: 7 }))
      expect(result).toBeNull()
      expect(error).toContain('followUpQuestion must be a string or null')
    })

    it('rejects a non-boolean isFinalEvaluation', () => {
      const { result, error } = parseWhole(wrapStream('', { ...wellFormed, isFinalEvaluation: 'yes' }))
      expect(result).toBeNull()
      expect(error).toContain('isFinalEvaluation must be a boolean')
    })
  })

  describe('structural / fallback errors', () => {
    it('errors when the stream ends without an opening tag', () => {
      const { result, error } = parseWhole('Just prose, the model forgot the block.')
      expect(result).toBeNull()
      expect(error).toBe('Stream ended without <evaluation> block')
    })

    it('errors when the block opens but never closes', () => {
      const parser = new EvaluationStreamParser()
      parser.push(`<evaluation>${JSON.stringify(wellFormed)}`)
      const { result, error } = parser.finalize()
      expect(result).toBeNull()
      expect(error).toBe('Stream ended before </evaluation> closing tag')
    })

    it('errors on malformed JSON inside a well-delimited block', () => {
      const parser = new EvaluationStreamParser()
      parser.push('<evaluation>{verdict: passed, not json}</evaluation>')
      const { result, error } = parser.finalize()
      expect(result).toBeNull()
      expect(error).toContain('Failed to parse <evaluation> JSON')
    })
  })

  describe('chunked streaming', () => {
    it('reassembles the JSON body across many chunks once the opening tag is seen', () => {
      // Once the block opens, every subsequent chunk is buffered, so the JSON
      // can be split arbitrarily. Feed the opening tag whole, then dribble the
      // body + closing tag in 1-char chunks.
      const head = 'Thinking out loud... <evaluation>'
      const tail = `${JSON.stringify(wellFormed)}</evaluation>`
      const parser = new EvaluationStreamParser()
      const forwarded: string[] = []
      forwarded.push(parser.push(head))
      for (const ch of tail) forwarded.push(parser.push(ch))
      const { result, error } = parser.finalize()

      expect(error).toBeNull()
      expect(result?.verdict).toBe('passed')
      expect(result?.analysis).toBe('Solid reasoning, clean separation of concerns.')
      // Prose is forwarded; the evaluation block never leaks to the client.
      expect(forwarded.join('')).toBe('Thinking out loud... ')
      expect(forwarded.join('')).not.toContain('<evaluation>')
    })

    it('does NOT detect an opening tag split across two chunks (documented limitation)', () => {
      // The parser matches the tag against the per-call buffer, which is cleared
      // when no tag is found. A tag straddling a chunk boundary is therefore
      // missed and the whole payload leaks as prose. This test pins that real
      // behavior so a future "fix" that changes it is a deliberate, visible change.
      const parser = new EvaluationStreamParser()
      const a = parser.push('prose <eval')
      const b = parser.push(`uation>${JSON.stringify(wellFormed)}</evaluation>`)
      const { result, error } = parser.finalize()

      expect(a).toBe('prose <eval')
      expect(b).toContain('uation>') // leaked as prose
      expect(result).toBeNull()
      expect(error).toBe('Stream ended without <evaluation> block')
    })
  })
})
