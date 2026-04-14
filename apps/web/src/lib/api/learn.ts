import type {
  CourseDTO,
  CourseDetailDTO,
  ExecuteStepRequest,
  ExecuteStepResponse,
  CourseProgressDTO,
} from '@dojo/shared'
import { request } from './client'

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
}
