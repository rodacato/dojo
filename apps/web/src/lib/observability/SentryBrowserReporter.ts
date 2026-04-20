import * as Sentry from '@sentry/react'
import type { ErrorReporter, WebErrorReport } from './ports'

interface SentryBrowserConfig {
  dsn: string
  environment?: string
  release?: string
}

export class SentryBrowserReporter implements ErrorReporter {
  constructor(config: SentryBrowserConfig) {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment ?? 'production',
      release: config.release,
      // Keep the network footprint small: no auto-breadcrumbs for console
      // logs or full page navigation history. Phase 1 Alpha doesn't need it.
      integrations: [],
      sendDefaultPii: false,
    })
  }

  async report(report: WebErrorReport): Promise<void> {
    Sentry.withScope((scope) => {
      scope.setLevel('error')
      if (report.route) scope.setTag('route', report.route)
      if (report.context) scope.setContext('report_context', report.context)

      const err = report.stack
        ? Object.assign(new Error(report.message), { stack: report.stack })
        : new Error(report.message)
      Sentry.captureException(err)
    })
  }
}
