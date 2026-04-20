import * as Sentry from '@sentry/node'
import type { ErrorReport, ErrorReporterPort } from './ports'

interface SentryConfig {
  dsn: string
  environment?: string
  tracesSampleRate?: number
  release?: string
}

// Wraps @sentry/node. Sentry.init is idempotent-ish but we call it here so
// the adapter is self-contained — anyone reading container.ts sees the whole
// wiring in one place. Sanitizes obvious PII before send: we do not want user
// response text or code snippets leaving the box.
export class SentryErrorReporter implements ErrorReporterPort {
  constructor(config: SentryConfig) {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment ?? 'production',
      tracesSampleRate: config.tracesSampleRate ?? 0.0,
      release: config.release,
      // Scrub request bodies / URL query strings that could carry PII.
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request) {
          delete event.request.data
          delete event.request.cookies
        }
        return event
      },
    })
  }

  async report(report: ErrorReport): Promise<void> {
    Sentry.withScope((scope) => {
      scope.setLevel('error')
      scope.setTag('source', report.source)
      if (report.status) scope.setTag('status', String(report.status))
      if (report.route) scope.setTag('route', report.route)
      if (report.method) scope.setTag('method', report.method)
      if (report.userId) scope.setUser({ id: report.userId })
      if (report.requestId) scope.setTag('request_id', report.requestId)
      if (report.context) scope.setContext('report_context', report.context)

      const err = report.stack
        ? Object.assign(new Error(report.message), { stack: report.stack })
        : new Error(report.message)
      Sentry.captureException(err)
    })
    // flush with a short timeout so serverless/short-lived processes don't
    // lose the event; harmless on long-lived processes.
    await Sentry.flush(2000)
  }
}
