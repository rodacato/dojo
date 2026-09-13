import { request } from './client'

export interface ShareData {
  sessionId: string
  kataTitle: string
  kataType: string
  difficulty: string
  verdict: string
  pullQuote: string | null
  completionMinutes: number | null
  username: string
  avatarUrl: string
  ownerRole: string | null
}

export const share = {
  // Public, unauthenticated card. redirectOnAuth:false so a 401 surfaces as
  // an ApiError instead of a session-expired redirect.
  getShareCard: (sessionId: string) =>
    request<ShareData>(`/share/${sessionId}`, { redirectOnAuth: false }),
}
