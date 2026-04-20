import type { ErrorReport, ErrorReporterPort } from './ports'
import { errors } from '../persistence/drizzle/schema'
import type { DB } from '../persistence/drizzle/client'

export class PostgresErrorReporter implements ErrorReporterPort {
  constructor(private readonly db: DB) {}

  async report(report: ErrorReport): Promise<void> {
    await this.db.insert(errors).values({
      source: report.source,
      status: report.status,
      route: report.route,
      method: report.method,
      message: report.message,
      stack: report.stack,
      requestId: report.requestId,
      userId: report.userId,
      context: report.context,
    })
  }
}
