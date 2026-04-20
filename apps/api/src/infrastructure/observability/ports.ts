// Error reporting port. Cross-cutting infrastructure concern — intentionally
// not under domain/ (see ADR 017). Consumers are the HTTP layer (router
// onError, middleware) and the web reporting endpoint, never application or
// domain code.

export interface ErrorReport {
  message: string
  stack?: string
  status: number
  source: 'api' | 'web'
  route?: string
  method?: string
  userId?: string
  requestId?: string
  context?: Record<string, unknown>
}

export interface ErrorReporterPort {
  report(report: ErrorReport): Promise<void>
}
