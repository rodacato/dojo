import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../../../config'
import * as schema from './schema'

const sql = postgres(config.DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})
export const db = drizzle(sql, { schema })
export type DB = typeof db
