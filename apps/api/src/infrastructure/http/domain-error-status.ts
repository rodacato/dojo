import type { ContentfulStatusCode } from 'hono/utils/http-status'

export function domainErrorToStatus(code?: string): ContentfulStatusCode {
  switch (code) {
    case 'SESSION_NOT_FOUND':
    case 'KATA_NOT_FOUND':
    case 'SCROLL_NOT_FOUND':
      return 404
    case 'SCROLL_LOGIN_REQUIRED':
      return 401
    case 'SESSION_ALREADY_COMPLETED':
    case 'SCROLL_SLUG_TAKEN':
      return 409
    case 'SESSION_EXPIRED':
      return 408
    case 'NO_ELIGIBLE_KATAS':
    case 'SCROLL_ORIGIN_NOT_ALLOWED':
      return 422
    default:
      return 500
  }
}
