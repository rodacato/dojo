import { API_URL } from '../config'
import { getToken, clearToken } from '../auth-token'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export interface RequestOptions extends RequestInit {
  // When false, a 401 response is thrown as ApiError instead of triggering
  // a session-expired redirect. Use this for endpoints that can legitimately
  // return 401 to anonymous users (e.g. private course access).
  redirectOnAuth?: boolean
}

export async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  const redirectOnAuth = init?.redirectOnAuth ?? true
  if (res.status === 401 && redirectOnAuth) {
    clearToken()
    window.location.href = `${window.location.origin}/?error=session_expired`
    throw new Error('Unauthenticated')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}
