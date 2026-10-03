import type { RegisterScrollInput, ScrollEntryDTO, UpdateScrollInput } from '@dojo/shared'
import { request } from './client'

export const scrolls = {
  getScrolls: () => request<ScrollEntryDTO[]>('/scrolls', { redirectOnAuth: false }),

  // 401 (private, anonymous) must reach the page, not trigger a session-expired redirect.
  getScroll: (slug: string) =>
    request<ScrollEntryDTO>(`/scrolls/${encodeURIComponent(slug)}`, { redirectOnAuth: false }),

  getAdminScrolls: () => request<ScrollEntryDTO[]>('/admin/scrolls'),

  registerScroll: (input: RegisterScrollInput) =>
    request<ScrollEntryDTO>('/admin/scrolls', { method: 'POST', body: JSON.stringify(input) }),

  updateScroll: (id: string, patch: UpdateScrollInput) =>
    request<ScrollEntryDTO>(`/admin/scrolls/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteScroll: (id: string) => request<void>(`/admin/scrolls/${id}`, { method: 'DELETE' }),
}
