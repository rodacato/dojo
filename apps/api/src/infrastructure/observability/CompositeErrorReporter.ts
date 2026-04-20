import type { ErrorReport, ErrorReporterPort } from './ports'

// Fans a single report out to N reporters with independent failure — one
// adapter throwing or hanging must not prevent the others from running.
// We await all of them (Promise.allSettled) so slow sinks don't silently
// drop events, but a caller that wants fire-and-forget can wrap the call.
export class CompositeErrorReporter implements ErrorReporterPort {
  constructor(private readonly reporters: readonly ErrorReporterPort[]) {}

  async report(report: ErrorReport): Promise<void> {
    await Promise.allSettled(this.reporters.map((r) => r.report(report)))
  }
}
