import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ScrollDetailDTO } from '@dojo/shared'

// The active step is the `:stepId` path segment under /scrolls/:slug/:stepId.
// react-router owns history, so back/forward and refresh are exact for free —
// no hash bookkeeping. The landing decides where a learner starts; the player
// only ever renders the step the URL names.
export function useStepNavigation(scroll: ScrollDetailDTO | null) {
  const navigate = useNavigate()
  const { slug, stepId } = useParams<{ slug: string; stepId: string }>()

  const allSteps = scroll?.lessons.flatMap((l) => l.steps) ?? []
  const activeStepId = allSteps.some((s) => s.id === stepId) ? (stepId as string) : null

  const navigateToStep = useCallback(
    (id: string) => {
      if (slug) navigate(`/scrolls/${slug}/${id}`)
    },
    [navigate, slug],
  )

  const advanceToNextStep = useCallback(() => {
    if (!scroll || !activeStepId || !slug) return
    const steps = scroll.lessons.flatMap((l) => l.steps)
    const idx = steps.findIndex((s) => s.id === activeStepId)
    const next = steps[idx + 1]
    if (next) navigate(`/scrolls/${slug}/${next.id}`)
  }, [scroll, activeStepId, slug, navigate])

  return { activeStepId, navigateToStep, advanceToNextStep }
}
