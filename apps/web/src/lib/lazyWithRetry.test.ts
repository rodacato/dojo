import { describe, expect, it, vi, beforeEach } from 'vitest'
import type * as ReactModule from 'react'

// `lazyWithRetry` wraps its retry/reload logic inside the async function it
// hands to React's `lazy`. To exercise that logic directly — without rendering
// a Suspense tree — we mock `lazy` so it returns the captured factory instead
// of a real LazyExoticComponent. Every other line of the module runs for real.
type LazyFactory<T> = () => Promise<{ default: T }>

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactModule>()
  return {
    ...actual,
    // Surface the inner async function so the test can call it. The cast keeps
    // the captured factory typed without leaking `any` into the test body.
    lazy: <T>(factory: LazyFactory<T>) => factory,
  }
})

import { lazyWithRetry } from './lazyWithRetry'

const RELOAD_KEY = 'dojo.chunkReloadAt'
const RELOAD_COOLDOWN_MS = 10_000
const CHUNK_MESSAGE = 'Failed to fetch dynamically imported module: /assets/x.js'

type DummyComponent = () => null
const DummyComponent: DummyComponent = () => null

// `lazyWithRetry` returns the captured inner factory (thanks to the react mock).
// This helper reconstructs that exact type so the tests stay free of `any`.
function innerFactory(
  factory: LazyFactory<DummyComponent>,
): () => Promise<{ default: DummyComponent }> {
  return lazyWithRetry(factory) as unknown as () => Promise<{
    default: DummyComponent
  }>
}

let reloadSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  window.sessionStorage.clear()
  reloadSpy = vi.fn()
  // jsdom's location.reload is a non-configurable native; redefine it cleanly.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: reloadSpy },
  })
  vi.restoreAllMocks()
})

describe('lazyWithRetry', () => {
  describe('successful load', () => {
    it('resolves with the imported module untouched', async () => {
      const mod = { default: DummyComponent }
      const factory = vi.fn().mockResolvedValue(mod)

      const result = await innerFactory(factory)()

      expect(result).toBe(mod)
      expect(factory).toHaveBeenCalledTimes(1)
      expect(reloadSpy).not.toHaveBeenCalled()
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBeNull()
    })

    it('does not touch sessionStorage on the happy path', async () => {
      window.sessionStorage.setItem(RELOAD_KEY, '12345')
      const factory = vi.fn().mockResolvedValue({ default: DummyComponent })

      await innerFactory(factory)()

      // A prior reload marker must survive an unrelated successful load.
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBe('12345')
    })
  })

  describe('non-chunk errors are rethrown unchanged', () => {
    it('rethrows a generic Error whose message does not match', async () => {
      const err = new Error('TypeError: cannot read property of undefined')
      const factory = vi.fn().mockRejectedValue(err)

      await expect(innerFactory(factory)()).rejects.toBe(err)
      expect(reloadSpy).not.toHaveBeenCalled()
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBeNull()
    })

    it('rethrows a non-Error rejection (string) without reloading', async () => {
      const factory = vi.fn().mockRejectedValue(CHUNK_MESSAGE)

      // The message text matches the regex, but it is not an Error instance,
      // so the `instanceof Error` guard must short-circuit and rethrow.
      await expect(innerFactory(factory)()).rejects.toBe(CHUNK_MESSAGE)
      expect(reloadSpy).not.toHaveBeenCalled()
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBeNull()
    })

    it('rethrows a non-Error rejection (plain object) without reloading', async () => {
      const payload = { message: CHUNK_MESSAGE }
      const factory = vi.fn().mockRejectedValue(payload)

      await expect(innerFactory(factory)()).rejects.toBe(payload)
      expect(reloadSpy).not.toHaveBeenCalled()
    })
  })

  describe('chunk-error message matching', () => {
    const matching = [
      'Failed to fetch dynamically imported module: /assets/Page-abc.js',
      'Importing a module script failed.',
      'error loading dynamically imported module',
      // case-insensitive flag on the regex
      'FAILED TO FETCH DYNAMICALLY IMPORTED MODULE',
    ]

    it.each(matching)('reloads for chunk error: %s', async (message) => {
      const factory = vi.fn().mockRejectedValue(new Error(message))

      const pending = innerFactory(factory)()
      // Resolves to a never-settling promise; assert the side effects instead.
      await Promise.resolve()

      expect(reloadSpy).toHaveBeenCalledTimes(1)
      expect(window.sessionStorage.getItem(RELOAD_KEY)).not.toBeNull()
      // Confirm the returned promise never settles (Suspense stays in fallback).
      const settled = await Promise.race([
        pending.then(() => 'settled'),
        Promise.resolve('pending'),
      ])
      expect(settled).toBe('pending')
    })

    it('does NOT reload for an Error whose message is unrelated', async () => {
      const factory = vi
        .fn()
        .mockRejectedValue(new Error('Network request failed'))

      await expect(innerFactory(factory)()).rejects.toThrow(
        'Network request failed',
      )
      expect(reloadSpy).not.toHaveBeenCalled()
    })
  })

  describe('reload cooldown guard', () => {
    it('reloads and records the timestamp on a fresh chunk error', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
      const factory = vi.fn().mockRejectedValue(new Error(CHUNK_MESSAGE))

      innerFactory(factory)()
      await Promise.resolve()

      expect(reloadSpy).toHaveBeenCalledTimes(1)
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBe('1000000')
    })

    it('rethrows instead of reloading when a reload happened within the cooldown', async () => {
      const now = 5_000_000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      // Last reload was 1ms ago — strictly inside the cooldown window.
      window.sessionStorage.setItem(RELOAD_KEY, String(now - 1))
      const err = new Error(CHUNK_MESSAGE)
      const factory = vi.fn().mockRejectedValue(err)

      await expect(innerFactory(factory)()).rejects.toBe(err)
      expect(reloadSpy).not.toHaveBeenCalled()
      // The marker is left untouched (not overwritten with the new now).
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBe(String(now - 1))
    })

    it('rethrows at the exact cooldown boundary minus one (still inside)', async () => {
      const now = 5_000_000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      // diff = COOLDOWN - 1 → strictly less than cooldown → rethrow.
      window.sessionStorage.setItem(
        RELOAD_KEY,
        String(now - (RELOAD_COOLDOWN_MS - 1)),
      )
      const err = new Error(CHUNK_MESSAGE)
      const factory = vi.fn().mockRejectedValue(err)

      await expect(innerFactory(factory)()).rejects.toBe(err)
      expect(reloadSpy).not.toHaveBeenCalled()
    })

    it('reloads at the exact cooldown boundary (diff === cooldown is allowed)', async () => {
      const now = 5_000_000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      // diff = COOLDOWN → NOT less than cooldown → reload proceeds.
      window.sessionStorage.setItem(
        RELOAD_KEY,
        String(now - RELOAD_COOLDOWN_MS),
      )
      const factory = vi.fn().mockRejectedValue(new Error(CHUNK_MESSAGE))

      innerFactory(factory)()
      await Promise.resolve()

      expect(reloadSpy).toHaveBeenCalledTimes(1)
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBe(String(now))
    })

    it('reloads when the stored marker is far in the past', async () => {
      const now = 5_000_000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      window.sessionStorage.setItem(RELOAD_KEY, '1')
      const factory = vi.fn().mockRejectedValue(new Error(CHUNK_MESSAGE))

      innerFactory(factory)()
      await Promise.resolve()

      expect(reloadSpy).toHaveBeenCalledTimes(1)
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBe(String(now))
    })

    it('treats a missing marker as last=0 and reloads', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(RELOAD_COOLDOWN_MS)
      expect(window.sessionStorage.getItem(RELOAD_KEY)).toBeNull()
      const factory = vi.fn().mockRejectedValue(new Error(CHUNK_MESSAGE))

      innerFactory(factory)()
      await Promise.resolve()

      // now(=cooldown) - 0 === cooldown → not less than → reload.
      expect(reloadSpy).toHaveBeenCalledTimes(1)
    })

    it('treats a non-numeric stored marker as 0 (Number("") || 0) and reloads', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(RELOAD_COOLDOWN_MS)
      // Empty string is falsy → `|| 0`. A garbage value would NaN-poison the
      // comparison; this asserts the `|| 0` fallback actually fires.
      window.sessionStorage.setItem(RELOAD_KEY, '')
      const factory = vi.fn().mockRejectedValue(new Error(CHUNK_MESSAGE))

      innerFactory(factory)()
      await Promise.resolve()

      expect(reloadSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('the factory is invoked exactly once per attempt', () => {
    it('calls the underlying import factory a single time', async () => {
      const factory = vi.fn().mockResolvedValue({ default: DummyComponent })

      await innerFactory(factory)()

      expect(factory).toHaveBeenCalledTimes(1)
    })
  })
})
