import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { getAnonymousId } from '../../../lib/anonymousId'
import type { OutputTabId } from './OutputPanel'

// Reference solution — fetched lazily the first time the learner opens the
// Solution tab after passing. Server returns 403 until then, so there's no
// risk of leaking it early even if a curious learner inspects the network
// panel; fetching on demand keeps bandwidth zero for learners who never look.
export function useSolution({
  scrollSlug,
  stepId,
  isCompleted,
  tab,
  isIframeLang,
}: {
  scrollSlug: string
  stepId: string
  isCompleted: boolean
  tab: OutputTabId
  isIframeLang: boolean
}) {
  const [solutionCode, setSolutionCode] = useState<string | null>(null)
  const [alternativeApproach, setAlternativeApproach] = useState<string | null>(null)
  const [solutionError, setSolutionError] = useState<string | null>(null)

  useEffect(() => {
    setSolutionCode(null)
    setAlternativeApproach(null)
    setSolutionError(null)
  }, [stepId])

  useEffect(() => {
    if (tab !== 'solution') return
    if (!isCompleted) return
    if (solutionCode !== null || solutionError !== null) return
    const anonId = !isIframeLang ? getAnonymousId() ?? undefined : undefined
    api
      .getStepSolution(scrollSlug, stepId, anonId)
      .then((r) => {
        setSolutionCode(r.solution ?? '')
        setAlternativeApproach(r.alternativeApproach ?? null)
      })
      .catch((e) => {
        setSolutionError(e instanceof Error ? e.message : 'Could not load solution')
      })
  }, [tab, isCompleted, solutionCode, solutionError, scrollSlug, stepId, isIframeLang])

  // Clearing the error re-arms the fetch effect — this is the retry.
  const retry = () => setSolutionError(null)

  return { solutionCode, alternativeApproach, solutionError, retry }
}
