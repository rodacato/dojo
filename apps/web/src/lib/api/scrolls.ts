import type {
  ScrollDTO,
  ScrollDetailDTO,
  ExecuteStepRequest,
  ExecuteStepResponse,
  ScrollProgressDTO,
  ScrollProgressSummary,
  StepSolutionDTO,
} from '@dojo/shared'
import { request, ApiError } from './client'

export const scrolls = {
  getScrolls: () =>
    request<{ scrolls: ScrollDTO[] }>('/scrolls', { redirectOnAuth: false }).then(
      (r) => r.scrolls,
    ),

  getScroll: (slug: string) =>
    request<{ scroll: ScrollDetailDTO }>(`/scrolls/${slug}`, {
      redirectOnAuth: false,
    }).then((r) => r.scroll),

  executeStep: (params: ExecuteStepRequest) =>
    request<ExecuteStepResponse>('/scrolls/execute', {
      method: 'POST',
      body: JSON.stringify(params),
      redirectOnAuth: false,
    }),

  trackProgress: (scrollId: string, stepId: string, anonymousSessionId?: string) =>
    request<{ ok: boolean }>('/scrolls/progress', {
      method: 'POST',
      body: JSON.stringify({
        scrollId,
        stepId,
        ...(anonymousSessionId ? { anonymousSessionId } : {}),
      }),
      redirectOnAuth: false,
    }),

  getProgress: (scrollId: string, anonymousSessionId?: string) => {
    const query = anonymousSessionId
      ? `?anonymousSessionId=${encodeURIComponent(anonymousSessionId)}`
      : ''
    return request<ScrollProgressDTO>(`/scrolls/progress/${scrollId}${query}`, {
      redirectOnAuth: false,
    })
  },

  // Batch progress for the catalog — one call, completed-step count per scroll.
  // Auth users resolve via bearer; anon callers pass their stored session id.
  getAllProgress: (anonymousSessionId?: string) => {
    const query = anonymousSessionId
      ? `?anonymousSessionId=${encodeURIComponent(anonymousSessionId)}`
      : ''
    return request<{ progress: ScrollProgressSummary[] }>(`/scrolls/progress${query}`, {
      redirectOnAuth: false,
    }).then((r) => r.progress)
  },

  mergeAnonymousProgress: (anonymousSessionId: string) =>
    request<{ ok: boolean }>('/scrolls/progress/merge', {
      method: 'POST',
      body: JSON.stringify({ anonymousSessionId }),
    }),

  getStepSolution: (slug: string, stepId: string, anonymousSessionId?: string) => {
    const query = anonymousSessionId
      ? `?anonymousSessionId=${encodeURIComponent(anonymousSessionId)}`
      : ''
    return request<StepSolutionDTO>(
      `/scrolls/${slug}/steps/${stepId}/solution${query}`,
      { redirectOnAuth: false },
    )
  },

  // "Ask the sensei" nudge (PRD 026). Can return a 404 when the feature flag
  // is off — the UI interprets that as "disabled" and hides the button.
  requestNudge: async (params: {
    scrollSlug: string
    stepId: string
    userCode: string
    stdout?: string
    stderr?: string
  }) => {
    try {
      return await request<{ id: string; nudge: string; stepId: string }>('/scrolls/nudge', {
        method: 'POST',
        body: JSON.stringify(params),
        redirectOnAuth: false,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return { disabled: true as const }
      }
      throw err
    }
  },

  submitNudgeFeedback: (id: string, feedback: 'up' | 'down') =>
    request<{ ok: boolean }>(`/scrolls/nudge/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
      redirectOnAuth: false,
    }),
}
