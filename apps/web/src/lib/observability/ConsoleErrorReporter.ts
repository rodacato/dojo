import type { ErrorReporter, WebErrorReport } from './ports'

export class ConsoleErrorReporter implements ErrorReporter {
  async report(report: WebErrorReport): Promise<void> {
    // Dev-time convenience only — same pattern as the API side.
    // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring -- console has no format-string injection
    console.error(`[web] ${report.route ?? ''} — ${report.message}`, report)
  }
}
