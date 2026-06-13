import { request } from './client'
import type { AdminKataDTO } from './types'

export const admin = {
  getAdminKatas: () => request<AdminKataDTO[]>('/admin/katas'),

  getAdminKata: (id: string) =>
    request<{
      id: string
      title: string
      description: string
      duration: number
      difficulty: string
      type: string
      languages: string[]
      tags: string[]
      topics: string[]
      status: string
      variations: Array<{ id: string; ownerRole: string; ownerContext: string }>
    }>(`/admin/katas/${id}`),

  updateKata: (id: string, data: {
    title: string
    description: string
    duration: number
    difficulty: string
    type: string
    status?: string
    languages: string[]
    tags: string[]
    topics: string[]
    adminNotes?: string | null
    variations: Array<{ ownerRole: string; ownerContext: string }>
  }) =>
    request<{ ok: boolean }>(`/admin/katas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createKata: (data: {
    title: string
    description: string
    duration: number
    difficulty: string
    type: string
    languages: string[]
    tags: string[]
    topics: string[]
    variations: Array<{ ownerRole: string; ownerContext: string }>
  }) =>
    request<{ id: string }>('/admin/katas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  archiveKata: (id: string) =>
    request<{ ok: boolean }>(`/admin/katas/${id}/archive`, { method: 'POST' }),

  getKataFeedback: (id: string) =>
    request<{
      total: number
      clarity: Record<string, number>
      timing: Record<string, number>
      evaluation: Record<string, number>
      notes: Array<{ note: string; variationId: string; submittedAt: string }>
      byVariation: Record<string, { total: number; clarity: Record<string, number>; timing: Record<string, number>; evaluation: Record<string, number> }>
    }>(`/admin/katas/${id}/feedback`),

  createInvitation: (email?: string) =>
    request<{ id: string; token: string; url: string; expiresAt: string; emailSent: boolean }>('/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getInvitations: () =>
    request<Array<{
      id: string
      token: string
      status: 'pending' | 'used' | 'expired'
      usedBy: string | null
      expiresAt: string
      createdAt: string
    }>>('/admin/invitations'),

  getAdminScrolls: () =>
    request<Array<{
      id: string
      slug: string
      title: string
      description: string
      language: string
      accentColor: string
      status: 'draft' | 'published'
      isPublic: boolean
      lessonCount: number
      stepCount: number
      createdAt: string
    }>>('/admin/scrolls'),

  updateScroll: (
    id: string,
    patch: { isPublic?: boolean; status?: 'draft' | 'published' },
  ) =>
    request<{ id: string; isPublic: boolean; status: 'draft' | 'published' }>(
      `/admin/scrolls/${id}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    ),

  seedScrolls: () =>
    request<{
      seeded: Array<{ slug: string; title: string; lessonCount: number; stepCount: number }>
    }>('/admin/scrolls/seed', { method: 'POST' }),

  wipeScrollContent: (id: string) =>
    request<{ ok: boolean }>(`/admin/scrolls/${id}/wipe`, { method: 'POST' }),

  reprovisionPiston: () =>
    request<{
      installed: Array<{ language: string; version: string }>
      skipped: Array<{ language: string; version: string }>
      failed: Array<{ language: string; version: string; error: string }>
      runtimes: Array<{ language: string; version: string }>
    }>('/admin/piston/reprovision', { method: 'POST' }),

  getErrors: (params: { source?: 'api' | 'web'; status?: number; limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.source) qs.set('source', params.source)
    if (params.status !== undefined) qs.set('status', String(params.status))
    if (params.limit !== undefined) qs.set('limit', String(params.limit))
    if (params.offset !== undefined) qs.set('offset', String(params.offset))
    const suffix = qs.toString()
    return request<{
      total: number
      limit: number
      offset: number
      rows: Array<{
        id: string
        createdAt: string
        source: 'api' | 'web'
        status: number | null
        route: string | null
        method: string | null
        message: string
        stack: string | null
        requestId: string | null
        userId: string | null
        context: Record<string, unknown> | null
      }>
    }>(`/admin/errors${suffix ? `?${suffix}` : ''}`)
  },
}
