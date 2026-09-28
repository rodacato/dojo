import { existsSync } from 'node:fs'
import type { Config } from 'drizzle-kit'

// drizzle-kit runs from apps/api and never reads the workspace .env on its own.
const workspaceEnv = '../../.env'
if (existsSync(workspaceEnv)) process.loadEnvFile(workspaceEnv)

export default {
  schema: './src/infrastructure/persistence/drizzle/schema.ts',
  out: './src/infrastructure/persistence/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
} satisfies Config
