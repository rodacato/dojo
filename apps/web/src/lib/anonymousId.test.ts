import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getOrCreateAnonymousId,
  getAnonymousId,
  clearAnonymousId,
} from './anonymousId'

const KEY = 'dojo-anon-id'

describe('anonymousId', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getAnonymousId', () => {
    it('returns null when no id is stored', () => {
      expect(getAnonymousId()).toBeNull()
    })

    it('returns the exact value previously written under the key', () => {
      localStorage.setItem(KEY, 'stored-value-123')
      expect(getAnonymousId()).toBe('stored-value-123')
    })

    it('does not create an id as a side effect (read-only)', () => {
      const spy = vi.spyOn(crypto, 'randomUUID')
      expect(getAnonymousId()).toBeNull()
      expect(localStorage.getItem(KEY)).toBeNull()
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('getOrCreateAnonymousId', () => {
    it('generates a new id via crypto.randomUUID when none is stored', () => {
      const spy = vi
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue('11111111-1111-1111-1111-111111111111')

      const id = getOrCreateAnonymousId()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(id).toBe('11111111-1111-1111-1111-111111111111')
    })

    it('persists the generated id to localStorage under the canonical key', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(
        '22222222-2222-2222-2222-222222222222',
      )

      const returned = getOrCreateAnonymousId()

      expect(localStorage.getItem(KEY)).toBe(
        '22222222-2222-2222-2222-222222222222',
      )
      expect(returned).toBe(localStorage.getItem(KEY))
    })

    it('returns the existing id without generating a new one when already stored', () => {
      localStorage.setItem(KEY, 'pre-existing-id')
      const spy = vi.spyOn(crypto, 'randomUUID')

      const id = getOrCreateAnonymousId()

      expect(id).toBe('pre-existing-id')
      expect(spy).not.toHaveBeenCalled()
    })

    it('is idempotent across calls: returns the same id and generates only once', () => {
      const spy = vi
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue('33333333-3333-3333-3333-333333333333')

      const first = getOrCreateAnonymousId()
      const second = getOrCreateAnonymousId()
      const third = getOrCreateAnonymousId()

      expect(first).toBe(second)
      expect(second).toBe(third)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('regenerates an id after the stored value is cleared', () => {
      const spy = vi
        .spyOn(crypto, 'randomUUID')
        .mockReturnValueOnce('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .mockReturnValueOnce('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')

      const first = getOrCreateAnonymousId()
      localStorage.removeItem(KEY)
      const second = getOrCreateAnonymousId()

      expect(first).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      expect(second).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
      expect(first).not.toBe(second)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('treats an empty-string stored value as missing and regenerates', () => {
      localStorage.setItem(KEY, '')
      const spy = vi
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue('44444444-4444-4444-4444-444444444444')

      const id = getOrCreateAnonymousId()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(id).toBe('44444444-4444-4444-4444-444444444444')
      expect(localStorage.getItem(KEY)).toBe(
        '44444444-4444-4444-4444-444444444444',
      )
    })
  })

  describe('clearAnonymousId', () => {
    it('removes a stored id', () => {
      localStorage.setItem(KEY, 'to-be-removed')
      clearAnonymousId()
      expect(localStorage.getItem(KEY)).toBeNull()
      expect(getAnonymousId()).toBeNull()
    })

    it('is a no-op when nothing is stored', () => {
      expect(() => clearAnonymousId()).not.toThrow()
      expect(localStorage.getItem(KEY)).toBeNull()
    })

    it('only removes the canonical key, leaving other entries intact', () => {
      localStorage.setItem(KEY, 'anon')
      localStorage.setItem('unrelated', 'keep-me')

      clearAnonymousId()

      expect(localStorage.getItem(KEY)).toBeNull()
      expect(localStorage.getItem('unrelated')).toBe('keep-me')
    })
  })

  describe('integration across exports', () => {
    it('create then read returns the same id; clear then read returns null', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(
        '55555555-5555-5555-5555-555555555555',
      )

      const created = getOrCreateAnonymousId()
      expect(getAnonymousId()).toBe(created)

      clearAnonymousId()
      expect(getAnonymousId()).toBeNull()
    })
  })
})
