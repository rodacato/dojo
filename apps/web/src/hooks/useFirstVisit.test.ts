import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useFirstVisit } from './useFirstVisit'

const STORAGE_KEY = 'dojo-onboarding-seen'

describe('useFirstVisit', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('stays dormant while inactive: never reads storage, isFirstVisit stays false', () => {
    const { result } = renderHook(() => useFirstVisit(false))

    expect(result.current.isFirstVisit).toBe(false)
  })

  it('shows the overlay on a fresh device once active', () => {
    const { result } = renderHook(() => useFirstVisit(true))

    expect(result.current.isFirstVisit).toBe(true)
  })

  it('hides the overlay when the seen-flag is already persisted', () => {
    window.localStorage.setItem(STORAGE_KEY, 'true')

    const { result } = renderHook(() => useFirstVisit(true))

    expect(result.current.isFirstVisit).toBe(false)
  })

  it('dismiss flips the flag off and persists it so it never returns on this device', () => {
    const { result, unmount } = renderHook(() => useFirstVisit(true))
    expect(result.current.isFirstVisit).toBe(true)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.isFirstVisit).toBe(false)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')

    unmount()
    const remount = renderHook(() => useFirstVisit(true))
    expect(remount.result.current.isFirstVisit).toBe(false)
  })

  it('re-reads storage when toggled from inactive to active', () => {
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => useFirstVisit(active),
      { initialProps: { active: false } },
    )
    expect(result.current.isFirstVisit).toBe(false)

    rerender({ active: true })

    expect(result.current.isFirstVisit).toBe(true)
  })
})
