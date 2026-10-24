import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { join } from 'node:path'
import { db } from './drizzle/client'
import { log } from '../observability/logger'

export async function runMigrations() {
  await migrate(db, {
    migrationsFolder: join(__dirname, 'drizzle/migrations'),
  })
  log.info('db.migrations_complete')
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      log.error('db.migrations_failed', { err })
      process.exit(1)
    })
}
