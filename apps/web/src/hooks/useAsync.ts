import { useCallback, useEffect, useState, type DependencyList } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: unknown
  reload: () => void
}

/**
 * Run an async fetch on mount and whenever `deps` change, with the
 * stale-result guard baked in: a result that resolves after unmount or after
 * `deps`/`reload` moved on is dropped instead of setting state. Replaces the
 * hand-rolled `useEffect(() => { let cancelled; fn().then(...) }, [...])` triad.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fn()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
    // `fn` is recreated each render by callers; `deps` + `tick` drive re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, error, reload }
}
