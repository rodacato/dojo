import { beforeEach, describe, expect, it } from 'vitest'
import { anonymousIdSchema } from '@dojo/shared'
import { clearAnonymousId, getAnonymousId, getOrCreateAnonymousId } from './anonymousId'

beforeEach(() => localStorage.clear())

describe('anonymousId', () => {
  it('does not exist until it is needed', () => {
    expect(getAnonymousId()).toBeNull()
  })

  it('creates a uuid once and keeps it', () => {
    const id = getOrCreateAnonymousId()
    expect(anonymousIdSchema.safeParse(id).success).toBe(true)
    expect(getOrCreateAnonymousId()).toBe(id)
    expect(getAnonymousId()).toBe(id)
  })

  it('can be cleared', () => {
    getOrCreateAnonymousId()
    clearAnonymousId()
    expect(getAnonymousId()).toBeNull()
  })
})
