import { ANONYMOUS_ID_HEADER, type RecordScrollProgressInput, type ScrollProgressDTO } from '@dojo/shared'
import { request } from './client'

const progressPath = (slug: string) => `/scrolls/${encodeURIComponent(slug)}/progress`

// The anonymous id only identifies a visitor who is not signed in; a signed-in token takes precedence.
function asVisitor(anonymousId: string | null): Record<string, string> {
  return anonymousId ? { [ANONYMOUS_ID_HEADER]: anonymousId } : {}
}

export const scrollProgress = {
  getScrollProgress: (slug: string, anonymousId: string | null) =>
    request<ScrollProgressDTO>(progressPath(slug), { redirectOnAuth: false, headers: asVisitor(anonymousId) }),

  recordScrollProgress: (slug: string, input: RecordScrollProgressInput, anonymousId: string | null) =>
    request<ScrollProgressDTO>(progressPath(slug), {
      method: 'POST',
      redirectOnAuth: false,
      headers: asVisitor(anonymousId),
      body: JSON.stringify(input),
    }),

  mergeScrollProgress: (anonymousId: string) =>
    request<void>('/scrolls/progress/merge', {
      method: 'POST',
      redirectOnAuth: false,
      headers: asVisitor(anonymousId),
    }),
}
