import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { join } from 'path'
import { db } from './drizzle/client'

export async function runMigrations() {
  await migrate(db, {
    migrationsFolder: join(__dirname, '../../../migrations'),
  })
  console.log('Migrations complete.')
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}
