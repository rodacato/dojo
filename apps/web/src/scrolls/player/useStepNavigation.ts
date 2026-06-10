import { useCallback, useEffect, useState } from 'react'
import type { ScrollDetailDTO } from '@dojo/shared'

export function useStepNavigation(
  scroll: ScrollDetailDTO | null,
  completedSteps: string[],
  progressLoaded: boolean,
) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null)

  // navigateToStep — single source of truth for changing the active step.
  // Updates state AND URL hash so refresh/back/forward preserve position.
  const navigateToStep = useCallback((stepId: string) => {
    setActiveStepId(stepId)
    const target = `#step-${stepId}`
    if (window.location.hash !== target) {
      window.history.pushState(null, '', target)
    }
  }, [])

  // Initial step resolution: hash first, then first incomplete step from
  // progress, then first step. Hash wins immediately when present so refresh
  // is exact; progress fills in for new tabs without a hash.
  useEffect(() => {
    if (!scroll || activeStepId) return
    const allSteps = scroll.lessons.flatMap((l) => l.steps)
    if (allSteps.length === 0) return

    const hashMatch = window.location.hash.match(/^#step-([a-f0-9-]+)$/i)
    const hashStepId = hashMatch?.[1]
    if (hashStepId && allSteps.some((s) => s.id === hashStepId)) {
      setActiveStepId(hashStepId)
      return
    }
    if (!progressLoaded) return
    const firstIncomplete = allSteps.find((s) => !completedSteps.includes(s.id))
    const target = firstIncomplete ?? allSteps[0]
    if (target) {
      setActiveStepId(target.id)
      window.history.replaceState(null, '', `#step-${target.id}`)
    }
  }, [scroll, progressLoaded, completedSteps, activeStepId])

  // Browser back/forward syncs the active step from the URL.
  useEffect(() => {
    if (!scroll) return
    const allSteps = scroll.lessons.flatMap((l) => l.steps)
    const handleHashChange = () => {
      const match = window.location.hash.match(/^#step-([a-f0-9-]+)$/i)
      const hashStepId = match?.[1]
      if (hashStepId && allSteps.some((s) => s.id === hashStepId)) {
        setActiveStepId(hashStepId)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [scroll])

  const advanceToNextStep = useCallback(() => {
    if (!scroll || !activeStepId) return
    const allSteps = scroll.lessons.flatMap((l) => l.steps)
    const currentIdx = allSteps.findIndex((s) => s.id === activeStepId)
    const nextStep = allSteps[currentIdx + 1]
    if (nextStep) {
      navigateToStep(nextStep.id)
    }
  }, [scroll, activeStepId, navigateToStep])

  return { activeStepId, navigateToStep, advanceToNextStep }
}
