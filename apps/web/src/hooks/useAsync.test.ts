import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsync } from './useAsync'

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useAsync', () => {
  it('starts loading, then exposes the resolved data', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve('hi'), []))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('hi')
    expect(result.current.error).toBeNull()
  })

  it('captures a rejection as error and stops loading', async () => {
    const boom = new Error('boom')
    const { result } = renderHook(() => useAsync(() => Promise.reject(boom), []))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(boom)
    expect(result.current.data).toBeNull()
  })

  it('reload() re-runs the fetch', async () => {
    const fn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')
    const { result } = renderHook(() => useAsync(fn, []))

    await waitFor(() => expect(result.current.data).toBe('first'))
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.data).toBe('second'))
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('re-runs when deps change', async () => {
    const fn = vi.fn((id: number) => Promise.resolve(`item-${id}`))
    let id = 1
    const { result, rerender } = renderHook(() => useAsync(() => fn(id), [id]))

    await waitFor(() => expect(result.current.data).toBe('item-1'))
    id = 2
    rerender()
    await waitFor(() => expect(result.current.data).toBe('item-2'))
  })

  it('drops a stale result when deps move on mid-flight (last write wins)', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    let phase = 0
    const { result, rerender } = renderHook(() =>
      useAsync(() => (phase === 0 ? first.promise : second.promise), [phase]),
    )

    phase = 1
    rerender()

    // The newer (second) call resolves first and wins.
    await act(async () => {
      second.resolve('new')
      await second.promise
    })
    await waitFor(() => expect(result.current.data).toBe('new'))

    // The stale (first) call resolves later and must NOT overwrite.
    await act(async () => {
      first.resolve('old')
      await first.promise
    })
    expect(result.current.data).toBe('new')
  })

  it('does not throw when a fetch resolves after unmount', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const d = deferred<string>()
    const { unmount } = renderHook(() => useAsync(() => d.promise, []))

    unmount()
    await act(async () => {
      d.resolve('late')
      await d.promise
    })

    // The cancel guard swallows the post-unmount resolution: no act() warning or
    // state-update-after-unmount error is logged.
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
