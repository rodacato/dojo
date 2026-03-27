import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.string().url(),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().default(''),
  LLM_MODEL: z.string().default('claude-opus-4-6'),
  LLM_ADAPTER_FORMAT: z.enum(['mock', 'anthropic', 'openai']).default('mock'),
  LLM_STREAM: z.coerce.boolean().default(true),
  MOCK_LLM_STREAM_DELAY_MS: z.coerce.number().int().min(0).default(50),
  MOCK_LLM_VERDICT: z.enum(['passed', 'passed_with_notes', 'needs_work']).default('needs_work'),
  MOCK_LLM_RESPONSE_TOKENS: z.coerce.number().int().min(1).default(20),
  MOCK_LLM_FOLLOW_UP: z.coerce.boolean().default(false),
  CODE_EXECUTION_ENABLED: z.coerce.boolean().default(false),
  PISTON_URL: z.string().url().default('http://piston:2000'),
  PISTON_MAX_CONCURRENT: z.coerce.number().int().min(1).default(3),
  PISTON_RUN_TIMEOUT: z.coerce.number().int().min(1000).default(3000),
  PISTON_COMPILE_TIMEOUT: z.coerce.number().int().min(1000).default(30000),
  DRAWHAUS_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM_EMAIL: z.string().default('dojo <noreply@notdefined.dev>'),
  CRON_SECRET: z.string().default(''),
  CREATOR_GITHUB_ID: z.string().default(''),
  API_PORT: z.coerce.number().default(3001),
  WEB_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Invalid or missing environment variables:')
  console.error(result.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = result.data
export type Config = typeof config
