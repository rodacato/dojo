import { useCallback, useEffect, useState } from 'react'
import type { ScrollDetailDTO } from '@dojo/shared'
import { api } from '../../lib/api'
import {
  clearAnonymousId,
  getAnonymousId,
  getOrCreateAnonymousId,
} from '../../lib/anonymousId'

export function useScrollProgress(scroll: ScrollDetailDTO | null, isAuthenticated: boolean) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [progressLoaded, setProgressLoaded] = useState(false)

  // When the user logs in and there's leftover anonymous progress, merge it.
  useEffect(() => {
    if (!isAuthenticated) return
    const anonId = getAnonymousId()
    if (!anonId) return
    api.mergeAnonymousProgress(anonId)
      .catch(() => {})
      .finally(() => clearAnonymousId())
  }, [isAuthenticated])

  // Load progress from server — source of truth for both authenticated and
  // anonymous owners. We only create an anonymous id when we actually need
  // to track progress on a public scroll without auth.
  useEffect(() => {
    if (!scroll) return
    const settle = (steps: string[]) => {
      setCompletedSteps(steps)
      setProgressLoaded(true)
    }
    if (isAuthenticated) {
      api.getProgress(scroll.id)
        .then((r) => settle(r.completedSteps))
        .catch(() => settle([]))
    } else if (scroll.isPublic) {
      const anonId = getOrCreateAnonymousId()
      api.getProgress(scroll.id, anonId)
        .then((r) => settle(r.completedSteps))
        .catch(() => settle([]))
    } else {
      settle([])
    }
  }, [scroll, isAuthenticated])

  const markStepComplete = useCallback((stepId: string) => {
    if (!scroll) return
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) return prev
      return [...prev, stepId]
    })
    const anonId = !isAuthenticated && scroll.isPublic ? getAnonymousId() : undefined
    api.trackProgress(scroll.id, stepId, anonId ?? undefined).catch(() => {})
  }, [scroll, isAuthenticated])

  return { completedSteps, progressLoaded, markStepComplete }
}
