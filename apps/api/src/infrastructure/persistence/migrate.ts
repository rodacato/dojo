import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { join } from 'path'
import { db } from './drizzle/client'

async function main() {
  await migrate(db, {
    migrationsFolder: join(__dirname, '../../../migrations'),
  })
  console.log('Migrations complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
