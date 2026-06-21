import { act, renderHook, waitFor } from '@testing-library/react'
import type { ScrollDetailDTO } from '@dojo/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getProgress = vi.fn()
const trackProgress = vi.fn()
const mergeAnonymousProgress = vi.fn()

vi.mock('../../lib/api', () => ({
  api: {
    getProgress: (...args: unknown[]) => getProgress(...args),
    trackProgress: (...args: unknown[]) => trackProgress(...args),
    mergeAnonymousProgress: (...args: unknown[]) => mergeAnonymousProgress(...args),
  },
}))

const getAnonymousId = vi.fn()
const getOrCreateAnonymousId = vi.fn()
const clearAnonymousId = vi.fn()

vi.mock('../../lib/anonymousId', () => ({
  getAnonymousId: () => getAnonymousId(),
  getOrCreateAnonymousId: () => getOrCreateAnonymousId(),
  clearAnonymousId: () => clearAnonymousId(),
}))

import { useScrollProgress } from './useScrollProgress'

function makeScroll(overrides: Partial<ScrollDetailDTO> = {}): ScrollDetailDTO {
  return {
    id: 'scroll-1',
    isPublic: true,
    ...overrides,
  } as unknown as ScrollDetailDTO
}

describe('useScrollProgress', () => {
  beforeEach(() => {
    getProgress.mockResolvedValue({ completedSteps: [] })
    trackProgress.mockResolvedValue(undefined)
    mergeAnonymousProgress.mockResolvedValue(undefined)
    getAnonymousId.mockReturnValue(null)
    getOrCreateAnonymousId.mockReturnValue('anon-xyz')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not load progress while scroll is null', async () => {
    const { result } = renderHook(() => useScrollProgress(null, true))

    expect(result.current.progressLoaded).toBe(false)
    expect(result.current.completedSteps).toEqual([])
    expect(getProgress).not.toHaveBeenCalled()
  })

  it('loads authenticated progress without an anonymous id', async () => {
    getProgress.mockResolvedValue({ completedSteps: ['s1', 's2'] })
    const scroll = makeScroll()

    const { result } = renderHook(() => useScrollProgress(scroll, true))

    await waitFor(() => expect(result.current.progressLoaded).toBe(true))
    expect(result.current.completedSteps).toEqual(['s1', 's2'])
    expect(getProgress).toHaveBeenCalledWith('scroll-1')
    expect(getOrCreateAnonymousId).not.toHaveBeenCalled()
  })

  it('settles to empty steps when the progress fetch rejects', async () => {
    getProgress.mockRejectedValue(new Error('network'))
    const scroll = makeScroll()

    const { result } = renderHook(() => useScrollProgress(scroll, true))

    await waitFor(() => expect(result.current.progressLoaded).toBe(true))
    expect(result.current.completedSteps).toEqual([])
  })

  it('creates an anonymous id and loads progress for a public scroll when unauthenticated', async () => {
    getProgress.mockResolvedValue({ completedSteps: ['anon-step'] })
    const scroll = makeScroll({ isPublic: true })

    const { result } = renderHook(() => useScrollProgress(scroll, false))

    await waitFor(() => expect(result.current.progressLoaded).toBe(true))
    expect(getOrCreateAnonymousId).toHaveBeenCalled()
    expect(getProgress).toHaveBeenCalledWith('scroll-1', 'anon-xyz')
    expect(result.current.completedSteps).toEqual(['anon-step'])
  })

  it('settles empty without hitting the server for a private scroll when unauthenticated', async () => {
    const scroll = makeScroll({ isPublic: false })

    const { result } = renderHook(() => useScrollProgress(scroll, false))

    await waitFor(() => expect(result.current.progressLoaded).toBe(true))
    expect(result.current.completedSteps).toEqual([])
    expect(getProgress).not.toHaveBeenCalled()
    expect(getOrCreateAnonymousId).not.toHaveBeenCalled()
  })

  it('merges leftover anonymous progress on login then clears the id', async () => {
    getAnonymousId.mockReturnValue('left-over')
    const scroll = makeScroll()

    renderHook(() => useScrollProgress(scroll, true))

    expect(mergeAnonymousProgress).toHaveBeenCalledWith('left-over')
    await waitFor(() => expect(clearAnonymousId).toHaveBeenCalled())
  })

  it('does not merge when there is no leftover anonymous id', async () => {
    getAnonymousId.mockReturnValue(null)
    const scroll = makeScroll()

    renderHook(() => useScrollProgress(scroll, true))

    expect(mergeAnonymousProgress).not.toHaveBeenCalled()
  })

  it('marks a step complete optimistically and tracks it (authenticated, no anon id)', async () => {
    const scroll = makeScroll()
    const { result } = renderHook(() => useScrollProgress(scroll, true))
    await waitFor(() => expect(result.current.progressLoaded).toBe(true))

    act(() => result.current.markStepComplete('step-a'))

    expect(result.current.completedSteps).toEqual(['step-a'])
    expect(trackProgress).toHaveBeenCalledWith('scroll-1', 'step-a', undefined)
  })

  it('does not duplicate an already-completed step', async () => {
    getProgress.mockResolvedValue({ completedSteps: ['step-a'] })
    const scroll = makeScroll()
    const { result } = renderHook(() => useScrollProgress(scroll, true))
    await waitFor(() => expect(result.current.completedSteps).toEqual(['step-a']))

    act(() => result.current.markStepComplete('step-a'))

    expect(result.current.completedSteps).toEqual(['step-a'])
  })

  it('passes the anonymous id to trackProgress for an unauthenticated public scroll', async () => {
    getAnonymousId.mockReturnValue('anon-track')
    const scroll = makeScroll({ isPublic: true })
    const { result } = renderHook(() => useScrollProgress(scroll, false))
    await waitFor(() => expect(result.current.progressLoaded).toBe(true))

    act(() => result.current.markStepComplete('step-b'))

    expect(trackProgress).toHaveBeenCalledWith('scroll-1', 'step-b', 'anon-track')
  })
})
