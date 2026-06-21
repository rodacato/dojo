import { beforeEach, describe, expect, it } from 'vitest'
import { clearToken, getToken, setToken } from './auth-token'

const KEY = 'dojo_token'

describe('auth-token', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getToken', () => {
    it('returns null when no token is stored', () => {
      expect(getToken()).toBeNull()
    })

    it('returns the exact value persisted under the dojo_token key', () => {
      localStorage.setItem(KEY, 'abc.def.ghi')
      expect(getToken()).toBe('abc.def.ghi')
    })

    it('does not read from an unrelated key', () => {
      localStorage.setItem('other_token', 'nope')
      expect(getToken()).toBeNull()
    })

    it('returns an empty string verbatim when an empty token was stored', () => {
      localStorage.setItem(KEY, '')
      const result = getToken()
      expect(result).toBe('')
      expect(result).not.toBeNull()
    })
  })

  describe('setToken', () => {
    it('persists the token under the dojo_token key', () => {
      setToken('token-123')
      expect(localStorage.getItem(KEY)).toBe('token-123')
    })

    it('round-trips through getToken', () => {
      setToken('round-trip')
      expect(getToken()).toBe('round-trip')
    })

    it('overwrites a previously stored token', () => {
      setToken('first')
      setToken('second')
      expect(getToken()).toBe('second')
    })

    it('writes only to the dojo_token key, leaving other keys untouched', () => {
      localStorage.setItem('keep', 'me')
      setToken('new')
      expect(localStorage.getItem('keep')).toBe('me')
      expect(localStorage.getItem(KEY)).toBe('new')
    })

    it('stores an empty string as a real value, not a removal', () => {
      setToken('present')
      setToken('')
      expect(localStorage.getItem(KEY)).toBe('')
      expect(getToken()).toBe('')
    })

    it('preserves special characters and whitespace verbatim', () => {
      const weird = '  a.b/c+=\n"quoted"  '
      setToken(weird)
      expect(getToken()).toBe(weird)
    })
  })

  describe('clearToken', () => {
    it('removes a previously stored token', () => {
      setToken('to-be-cleared')
      clearToken()
      expect(getToken()).toBeNull()
      expect(localStorage.getItem(KEY)).toBeNull()
    })

    it('is a no-op when no token is stored', () => {
      expect(() => clearToken()).not.toThrow()
      expect(getToken()).toBeNull()
    })

    it('only removes the dojo_token key, leaving other keys intact', () => {
      localStorage.setItem('keep', 'me')
      setToken('drop')
      clearToken()
      expect(localStorage.getItem('keep')).toBe('me')
      expect(localStorage.getItem(KEY)).toBeNull()
    })
  })

  describe('lifecycle integration', () => {
    it('supports set then clear then re-set', () => {
      setToken('one')
      expect(getToken()).toBe('one')
      clearToken()
      expect(getToken()).toBeNull()
      setToken('two')
      expect(getToken()).toBe('two')
    })
  })
})
