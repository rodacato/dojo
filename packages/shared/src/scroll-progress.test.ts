import { describe, expect, it } from 'vitest'
import { MAX_STATE_BYTES } from './scroll-protocol'
import { anonymousIdSchema, recordScrollProgressSchema, scrollProgressDTOSchema } from './scroll-progress'

describe('recordScrollProgressSchema', () => {
  it('accepts a progress report with state', () => {
    const parsed = recordScrollProgressSchema.safeParse({
      type: 'progress',
      unitId: 'u1',
      completed: true,
      state: { step: 3 },
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts complete with and without a unit', () => {
    expect(recordScrollProgressSchema.safeParse({ type: 'complete', unitId: 'u1' }).success).toBe(true)
    expect(recordScrollProgressSchema.safeParse({ type: 'complete' }).success).toBe(true)
  })

  it('requires a unit for progress', () => {
    expect(recordScrollProgressSchema.safeParse({ type: 'progress' }).success).toBe(false)
  })

  it('rejects state over the cap', () => {
    const state = 'x'.repeat(MAX_STATE_BYTES)
    expect(recordScrollProgressSchema.safeParse({ type: 'progress', unitId: 'u1', state }).success).toBe(false)
  })

  it('rejects other message types', () => {
    expect(recordScrollProgressSchema.safeParse({ type: 'resize', height: 1 }).success).toBe(false)
  })
})

describe('anonymousIdSchema', () => {
  it('accepts a uuid and rejects anything else', () => {
    expect(anonymousIdSchema.safeParse(crypto.randomUUID()).success).toBe(true)
    expect(anonymousIdSchema.safeParse('not-a-uuid').success).toBe(false)
  })
})

describe('scrollProgressDTOSchema', () => {
  it('allows an empty progress with no update time', () => {
    const dto = { userRef: 'abc', completed: false, units: {}, updatedAt: null }
    expect(scrollProgressDTOSchema.safeParse(dto).success).toBe(true)
  })
})
