import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { join } from 'path'
import { db } from './drizzle/client'

await migrate(db, {
  migrationsFolder: join(import.meta.dirname, '../../../migrations'),
})

console.log('Migrations complete.')
process.exit(0)
