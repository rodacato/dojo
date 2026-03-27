import type { UserDTO } from '@dojo/shared'
import { request } from './client'

export const auth = {
  getMe: () => request<UserDTO>('/auth/me'),

  logout: () => request<{ ok: boolean }>('/auth/session', { method: 'DELETE' }),
}
