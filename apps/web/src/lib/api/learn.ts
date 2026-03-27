import type { CourseDTO, CourseDetailDTO, ExecuteStepRequest, ExecuteStepResponse, CourseProgressDTO } from '@dojo/shared'
import { request } from './client'

export const learn = {
  getCourses: () =>
    request<{ courses: CourseDTO[] }>('/learn/courses').then((r) => r.courses),

  getCourse: (slug: string) =>
    request<{ course: CourseDetailDTO }>(`/learn/courses/${slug}`).then((r) => r.course),

  executeStep: (params: ExecuteStepRequest) =>
    request<ExecuteStepResponse>('/learn/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  trackProgress: (courseId: string, stepId: string) =>
    request<{ ok: boolean }>('/learn/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId, stepId }),
    }),

  getProgress: (courseId: string) =>
    request<CourseProgressDTO>(`/learn/progress/${courseId}`),
}
