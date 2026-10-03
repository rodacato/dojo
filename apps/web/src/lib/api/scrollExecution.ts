import type { ScrollExecuteRequest, ScrollExecuteResponse, ScrollExecutionStatus } from '@dojo/shared'
import { request } from './client'

export const scrollExecution = {
  getScrollExecutionStatus: () =>
    request<ScrollExecutionStatus>('/scrolls/execution/status', { redirectOnAuth: false }),

  // A 401 here must not bounce the user away from a page that is mid-lesson.
  executeScrollCode: (slug: string, body: ScrollExecuteRequest) =>
    request<ScrollExecuteResponse>(`/scrolls/${encodeURIComponent(slug)}/execute`, {
      method: 'POST',
      body: JSON.stringify(body),
      redirectOnAuth: false,
    }),
}
