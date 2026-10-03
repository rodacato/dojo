import { describe, expect, it } from 'vitest'
import { isPayloadTooLarge, scrollExecuteRequestSchema,scrollExecuteResponseSchema } from './scroll-execution'

const request = { language: 'ruby', files: [{ name: 'main.rb', content: 'puts 1' }], stdin: 'in' }
const response = { kind: 'ok', exitCode: 0, stdout: '1\n', stderr: '', durationMs: 5 }

function without(obj: Record<string, unknown>, key: string) {
  const copy = { ...obj }
  delete copy[key]
  return copy
}

describe('scroll execute request', () => {
  it('accepts a valid request, with or without stdin', () => {
    expect(scrollExecuteRequestSchema.safeParse(request).success).toBe(true)
    expect(scrollExecuteRequestSchema.safeParse(without(request, 'stdin')).success).toBe(true)
  })

  it.each(['language', 'files'])('rejects a request without %s', (field) => {
    expect(scrollExecuteRequestSchema.safeParse(without(request, field)).success).toBe(false)
  })

  it('flags oversized payloads, by bytes and by file count, as too large', () => {
    const big = { ...request, files: [{ name: 'main.rb', content: 'x'.repeat(65_537) }] }
    const many = { ...request, files: Array.from({ length: 9 }, (_, i) => ({ name: `f${i}.rb`, content: '' })) }
    for (const body of [big, many]) {
      const parsed = scrollExecuteRequestSchema.safeParse(body)
      expect(parsed.success).toBe(false)
      expect(isPayloadTooLarge(parsed.error?.issues ?? [])).toBe(true)
    }
  })

  it('does not flag an ordinary validation failure as too large', () => {
    const parsed = scrollExecuteRequestSchema.safeParse({ ...request, language: 'Ruby!' })
    expect(isPayloadTooLarge(parsed.error?.issues ?? [])).toBe(false)
  })
})

describe('scroll execute response', () => {
  it('accepts a valid response', () => {
    expect(scrollExecuteResponseSchema.safeParse(response).success).toBe(true)
  })

  it.each(['kind', 'exitCode', 'stdout', 'stderr', 'durationMs'])('rejects a response without %s', (field) => {
    expect(scrollExecuteResponseSchema.safeParse(without(response, field)).success).toBe(false)
  })
})
