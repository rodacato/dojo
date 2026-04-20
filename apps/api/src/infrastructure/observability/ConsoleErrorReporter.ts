import type { ErrorReport, ErrorReporterPort } from './ports'

export class ConsoleErrorReporter implements ErrorReporterPort {
  async report(report: ErrorReport): Promise<void> {
    // Single-line summary + full object so `kamal app logs --grep` works and
    // the stack is still available when inspected. Matches the previous
    // `console.error('Unhandled error:', err)` behaviour closely enough that
    // existing log greps keep working.
    console.error(
      `[${report.source}] ${report.status} ${report.method ?? ''} ${report.route ?? ''} — ${report.message}`,
      report,
    )
  }
}
