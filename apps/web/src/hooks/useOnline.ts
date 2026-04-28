import { useEffect, useState } from 'react'

interface OnlineState {
  online: boolean
  /** Timestamp of the last transition to offline. Null while online. */
  offlineSince: number | null
}

/**
 * Tracks `navigator.onLine` and surfaces an `offlineSince` timestamp so
 * the offline banner can render `Last connected · Xs ago`.
 *
 * SSR-safe: defaults to online when navigator is undefined.
 */
export function useOnline(): OnlineState {
  const [state, setState] = useState<OnlineState>(() => {
    const online = typeof navigator === 'undefined' ? true : navigator.onLine
    return { online, offlineSince: online ? null : Date.now() }
  })

  useEffect(() => {
    function onOnline() {
      setState({ online: true, offlineSince: null })
    }
    function onOffline() {
      setState({ online: false, offlineSince: Date.now() })
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return state
}
