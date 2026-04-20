import type { ErrorReporter, WebErrorReport } from './ports'

export class ConsoleErrorReporter implements ErrorReporter {
  async report(report: WebErrorReport): Promise<void> {
    // Dev-time convenience only — same pattern as the API side.
    console.error(`[web] ${report.route ?? ''} — ${report.message}`, report)
  }
}
