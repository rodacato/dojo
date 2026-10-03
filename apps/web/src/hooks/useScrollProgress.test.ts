import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ApiError, api } from '../lib/api'
import type * as ApiModule from '../lib/api'
import { getAnonymousId } from '../lib/anonymousId'
import { useScrollProgress } from './useScrollProgress'

vi.mock('../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof ApiModule>()
  return {
    ...original,
    api: { getScrollProgress: vi.fn(), recordScrollProgress: vi.fn(), mergeScrollProgress: vi.fn() },
  }
})

const mocked = vi.mocked(api)
const stored = {
  userRef: 'ref-1',
  completed: false,
  units: { u1: { completed: true, state: { step: 2 } } },
  updatedAt: '2026-10-03T00:00:00.000Z',
}
const envelope = { dojo: 'scroll', v: 0, session: 's' } as const

function setup(options: { authenticated?: boolean; enabled?: boolean } = {}) {
  return renderHook(() =>
    useScrollProgress({ slug: 'pc', enabled: options.enabled ?? true, authenticated: options.authenticated ?? false }),
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  mocked.getScrollProgress.mockResolvedValue(stored)
  mocked.recordScrollProgress.mockResolvedValue(stored)
  mocked.mergeScrollProgress.mockResolvedValue(undefined)
})

describe('useScrollProgress', () => {
  it('loads stored progress before it reports ready, so the next init carries it', async () => {
    const { result } = setup()
    expect(result.current.status).toBe('loading')
    expect(result.current.initial).toBeUndefined()

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.initial).toEqual({ progress: stored.units, userRef: 'ref-1' })
  })

  it('creates an anonymous id for a visitor and reads with it', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    const id = getAnonymousId()
    expect(id).not.toBeNull()
    expect(mocked.getScrollProgress).toHaveBeenCalledWith('pc', id)
  })

  it('reads as the user without creating an anonymous id when signed in', async () => {
    const { result } = setup({ authenticated: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(mocked.getScrollProgress).toHaveBeenCalledWith('pc', null)
    expect(getAnonymousId()).toBeNull()
    expect(mocked.mergeScrollProgress).not.toHaveBeenCalled()
  })

  it('merges leftover anonymous progress before loading, then forgets the id', async () => {
    localStorage.setItem('dojo-anon-id', 'anon-1')
    const order: string[] = []
    mocked.mergeScrollProgress.mockImplementation(async () => void order.push('merge'))
    mocked.getScrollProgress.mockImplementation(async () => (order.push('get'), stored))

    const { result } = setup({ authenticated: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(order).toEqual(['merge', 'get'])
    expect(mocked.mergeScrollProgress).toHaveBeenCalledWith('anon-1')
    expect(getAnonymousId()).toBeNull()
  })

  it('keeps the anonymous id when the merge fails and still loads', async () => {
    localStorage.setItem('dojo-anon-id', 'anon-1')
    mocked.mergeScrollProgress.mockRejectedValue(new ApiError(500, 'boom'))

    const { result } = setup({ authenticated: true })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(getAnonymousId()).toBe('anon-1')
  })

  it('reports an error instead of ready when loading fails, and recovers on retry', async () => {
    mocked.getScrollProgress.mockRejectedValueOnce(new ApiError(500, 'boom'))
    const { result } = setup()
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.initial).toBeUndefined()

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })

  it('does not touch the API for a scroll without the progress capability', () => {
    const { result } = setup({ enabled: false })
    expect(result.current.status).toBe('ready')
    expect(result.current.initial).toBeUndefined()
    expect(mocked.getScrollProgress).not.toHaveBeenCalled()
    expect(getAnonymousId()).toBeNull()
  })

  it('forwards progress and complete in order and keeps the host state current', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => {
      result.current.onProgress({ ...envelope, type: 'progress', unitId: 'u2', state: { n: 1 } })
      result.current.onProgress({ ...envelope, type: 'progress', unitId: 'u2', completed: true })
      result.current.onComplete({ ...envelope, type: 'complete' })
    })
    await waitFor(() => expect(mocked.recordScrollProgress).toHaveBeenCalledTimes(3))

    const bodies = mocked.recordScrollProgress.mock.calls.map((call) => call[1])
    expect(bodies).toEqual([
      { type: 'progress', unitId: 'u2', completed: undefined, state: { n: 1 } },
      { type: 'progress', unitId: 'u2', completed: true, state: undefined },
      { type: 'complete', unitId: undefined },
    ])
    expect(result.current.initial?.progress['u2']).toEqual({ completed: true, state: { n: 1 } })
  })

  it('keeps writing after a failed write', async () => {
    mocked.recordScrollProgress.mockRejectedValueOnce(new ApiError(500, 'boom'))
    const { result } = setup()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => {
      result.current.onComplete({ ...envelope, type: 'complete', unitId: 'u1' })
      result.current.onComplete({ ...envelope, type: 'complete', unitId: 'u2' })
    })

    await waitFor(() => expect(mocked.recordScrollProgress).toHaveBeenCalledTimes(2))
  })
})
