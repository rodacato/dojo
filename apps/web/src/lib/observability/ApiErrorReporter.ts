import type { ErrorReporter, WebErrorReport } from './ports'
import { API_URL } from '../config'

// Posts reports to the API's /errors endpoint. That endpoint runs through the
// server-side CompositeErrorReporter so a single POST reaches all configured
// sinks (Postgres, Sentry, stdout) with the same code path as API errors.
// Intentionally uses raw `fetch` instead of the api client so a bug in the
// client doesn't make reporting re-enter itself.
export class ApiErrorReporter implements ErrorReporter {
  async report(report: WebErrorReport): Promise<void> {
    await fetch(`${API_URL}/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: report.message,
        stack: report.stack,
        route: report.route,
        context: report.context,
      }),
      keepalive: true,
    })
  }
}
