// Web-side error reporting port. Mirror of the API `ErrorReporterPort` but
// trimmed — the browser never writes to Postgres directly; it posts to the
// API's /errors endpoint, which fans out to all configured sinks.

export interface WebErrorReport {
  message: string
  stack?: string
  route?: string
  context?: Record<string, unknown>
}

export interface ErrorReporter {
  report(report: WebErrorReport): Promise<void>
}
