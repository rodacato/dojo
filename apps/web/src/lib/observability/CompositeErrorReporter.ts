import type { ErrorReporter, WebErrorReport } from './ports'

// Mirrors the API Composite: all reporters receive the event, one failure
// never prevents the others. Promise.allSettled keeps it a single await.
export class CompositeErrorReporter implements ErrorReporter {
  constructor(private readonly reporters: readonly ErrorReporter[]) {}

  async report(report: WebErrorReport): Promise<void> {
    await Promise.allSettled(this.reporters.map((r) => r.report(report)))
  }
}
