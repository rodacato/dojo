import { log } from './logger'
import type { ErrorReport, ErrorReporterPort } from './ports'

export class ConsoleErrorReporter implements ErrorReporterPort {
  async report(report: ErrorReport): Promise<void> {
    const { message, stack, requestId, ...rest } = report
    log.error('error.reported', {
      ...rest,
      ...(requestId && { request_id: requestId }),
      err: Object.assign(new Error(message), { stack }),
    })
  }
}
