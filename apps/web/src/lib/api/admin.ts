import { request } from './client'
import type { AdminExerciseDTO } from './types'

export const admin = {
  getAdminExercises: () => request<AdminExerciseDTO[]>('/admin/exercises'),

  getAdminExercise: (id: string) =>
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
    }>(`/admin/exercises/${id}`),

  updateExercise: (id: string, data: {
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
    request<{ ok: boolean }>(`/admin/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createExercise: (data: {
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
    request<{ id: string }>('/admin/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  archiveExercise: (id: string) =>
    request<{ ok: boolean }>(`/admin/exercises/${id}/archive`, { method: 'POST' }),

  getExerciseFeedback: (id: string) =>
    request<{
      total: number
      clarity: Record<string, number>
      timing: Record<string, number>
      evaluation: Record<string, number>
      notes: Array<{ note: string; variationId: string; submittedAt: string }>
      byVariation: Record<string, { total: number; clarity: Record<string, number>; timing: Record<string, number>; evaluation: Record<string, number> }>
    }>(`/admin/exercises/${id}/feedback`),

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
}
