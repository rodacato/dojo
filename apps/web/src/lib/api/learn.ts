import type {
  CourseDTO,
  CourseDetailDTO,
  ExecuteStepRequest,
  ExecuteStepResponse,
  CourseProgressDTO,
  StepSolutionDTO,
} from '@dojo/shared'
import { request, ApiError } from './client'

export const learn = {
  getCourses: () =>
    request<{ courses: CourseDTO[] }>('/learn/courses', { redirectOnAuth: false }).then(
      (r) => r.courses,
    ),

  getCourse: (slug: string) =>
    request<{ course: CourseDetailDTO }>(`/learn/courses/${slug}`, {
      redirectOnAuth: false,
    }).then((r) => r.course),

  executeStep: (params: ExecuteStepRequest) =>
    request<ExecuteStepResponse>('/learn/execute', {
      method: 'POST',
      body: JSON.stringify(params),
      redirectOnAuth: false,
    }),

  trackProgress: (courseId: string, stepId: string, anonymousSessionId?: string) =>
    request<{ ok: boolean }>('/learn/progress', {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        stepId,
        ...(anonymousSessionId ? { anonymousSessionId } : {}),
      }),
      redirectOnAuth: false,
    }),

  getProgress: (courseId: string, anonymousSessionId?: string) => {
    const query = anonymousSessionId
      ? `?anonymousSessionId=${encodeURIComponent(anonymousSessionId)}`
      : ''
    return request<CourseProgressDTO>(`/learn/progress/${courseId}${query}`, {
      redirectOnAuth: false,
    })
  },

  mergeAnonymousProgress: (anonymousSessionId: string) =>
    request<{ ok: boolean }>('/learn/progress/merge', {
      method: 'POST',
      body: JSON.stringify({ anonymousSessionId }),
    }),

  getStepSolution: (slug: string, stepId: string, anonymousSessionId?: string) => {
    const query = anonymousSessionId
      ? `?anonymousSessionId=${encodeURIComponent(anonymousSessionId)}`
      : ''
    return request<StepSolutionDTO>(
      `/learn/courses/${slug}/steps/${stepId}/solution${query}`,
      { redirectOnAuth: false },
    )
  },

  // "Ask the sensei" nudge (PRD 026). Can return a 404 when the feature flag
  // is off — the UI interprets that as "disabled" and hides the button.
  requestNudge: async (params: {
    courseSlug: string
    stepId: string
    userCode: string
    stdout?: string
    stderr?: string
  }) => {
    try {
      return await request<{ nudge: string; stepId: string }>('/learn/nudge', {
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
}
