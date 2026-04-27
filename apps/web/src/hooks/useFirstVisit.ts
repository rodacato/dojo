import { useEffect, useState } from 'react'

const STORAGE_KEY = 'dojo-onboarding-seen'

// Read-only first-visit flag backed by localStorage. The hook returns the
// initial value once the component is mounted; calling `dismiss` flips the
// flag and the overlay can never come back on this device.
//
// Server-side first-visit detection (G-NNN — backend gap) would let us
// migrate this to a per-account flag so a user starting on a new device
// still sees the overlay. Until then, localStorage is the cheapest way
// to show-once.
export function useFirstVisit(active: boolean): {
  isFirstVisit: boolean
  dismiss: () => void
} {
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  useEffect(() => {
    if (!active) return
    try {
      setIsFirstVisit(window.localStorage.getItem(STORAGE_KEY) !== 'true')
    } catch {
      // localStorage blocked (private mode, hardened browser) — treat as
      // already-seen. Worst case the overlay is just never shown.
      setIsFirstVisit(false)
    }
  }, [active])

  function dismiss() {
    setIsFirstVisit(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // No-op — the in-memory flag flip above keeps the UI responsive.
    }
  }

  return { isFirstVisit, dismiss }
}
