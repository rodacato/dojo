import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecordScrollProgressInput, ScrollToHostMessage } from '@dojo/shared'
import { api } from '../lib/api'
import { clearAnonymousId, getAnonymousId, getOrCreateAnonymousId } from '../lib/anonymousId'
import type { ScrollInitialState } from '../lib/scrollHost'

export type ScrollProgressStatus = 'loading' | 'ready' | 'error'

interface Options {
  slug: string | null
  enabled: boolean
  authenticated: boolean
}

type Report<T extends ScrollToHostMessage['type']> = Extract<ScrollToHostMessage, { type: T }>

export function useScrollProgress({ slug, enabled, authenticated }: Readonly<Options>) {
  const [status, setStatus] = useState<ScrollProgressStatus>('loading')
  const [initial, setInitial] = useState<ScrollInitialState | undefined>(undefined)
  const [attempt, setAttempt] = useState(0)
  const writes = useRef<Promise<unknown>>(Promise.resolve())

  useEffect(() => {
    if (!enabled || !slug) return
    let cancelled = false
    setStatus('loading')

    async function load(scrollSlug: string): Promise<ScrollInitialState> {
      let anonymousId: string | null = null
      if (authenticated) {
        const leftover = getAnonymousId()
        if (leftover) {
          // A failed merge keeps the anonymous id, so the next visit retries it.
          await api.mergeScrollProgress(leftover).then(clearAnonymousId, () => {})
        }
      } else {
        anonymousId = getOrCreateAnonymousId()
      }
      const stored = await api.getScrollProgress(scrollSlug, anonymousId)
      return { progress: { ...stored.units }, userRef: stored.userRef }
    }

    load(slug)
      .then((state) => {
        if (cancelled) return
        setInitial(state)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [slug, enabled, authenticated, attempt])

  const send = useCallback(
    (input: RecordScrollProgressInput) => {
      if (!slug) return
      const anonymousId = authenticated ? null : getAnonymousId()
      writes.current = writes.current
        .then(() => api.recordScrollProgress(slug, input, anonymousId))
        .catch(() => {})
    },
    [slug, authenticated],
  )

  // The host keeps this object, so a reloaded frame is initialised with what was reported since.
  const remember = useCallback(
    (unitId: string, change: { completed?: boolean; state?: unknown }) => {
      if (!initial) return
      const previous = initial.progress[unitId]
      initial.progress[unitId] = {
        completed: change.completed ?? previous?.completed ?? false,
        state: change.state ?? previous?.state,
      } as ScrollInitialState['progress'][string]
    },
    [initial],
  )

  const onProgress = useCallback(
    ({ unitId, completed, state }: Report<'progress'>) => {
      remember(unitId, { completed, state })
      send({ type: 'progress', unitId, completed, state })
    },
    [remember, send],
  )

  const onComplete = useCallback(
    ({ unitId }: Report<'complete'>) => {
      if (unitId) remember(unitId, { completed: true })
      send({ type: 'complete', unitId })
    },
    [remember, send],
  )

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  if (!enabled) return { status: 'ready' as const, initial: undefined, onProgress, onComplete, retry }
  return { status, initial, onProgress, onComplete, retry }
}
