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
  FF_CODE_EXECUTION_ENABLED: z.coerce.boolean().default(false),
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
  SENTRY_DSN: z.string().default(''),
  SENTRY_ENVIRONMENT: z.string().default(''), // defaults to NODE_ENV after parse
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  SENTRY_RELEASE: z.string().default(''),
  // Course-player "Ask the sensei" — PRD 026. Feature-flagged so ops can
  // turn it off without redeploying if prompt drift surfaces.
  FF_COURSE_NUDGE_ENABLED: z.coerce.boolean().default(false),
  // Public playground console — PRD 029, spec 027 Part 4. Off by default.
  // When on, exposes anonymous code execution at POST /playground/run.
  // The four-layer abuse stack (Turnstile + per-IP RL + per-session RL
  // + global daily quota) arrives in subsequent commits — do not flip
  // this flag in prod before they all land.
  FF_PLAYGROUND_CONSOLE_ENABLED: z.coerce.boolean().default(false),
  // Playground rate-limit ceilings (spec 027 §4.5). Anonymous traffic is
  // bounded by per-IP + per-session buckets; authenticated users bypass
  // the IP bucket (signed in, accountable) and are bounded per-user.
  PLAYGROUND_RATE_LIMIT_ANON_PER_MIN: z.coerce.number().int().min(1).default(10),
  PLAYGROUND_RATE_LIMIT_ANON_PER_DAY: z.coerce.number().int().min(1).default(100),
  PLAYGROUND_RATE_LIMIT_AUTHED_PER_MIN: z.coerce.number().int().min(1).default(60),
  PLAYGROUND_RATE_LIMIT_AUTHED_PER_DAY: z.coerce.number().int().min(1).default(1000),
  // Global ceiling across all playground traffic (anon + authed). Separate
  // bucket from kata/courses — hitting it returns 503 from /playground/run
  // only. Reset at UTC midnight.
  PLAYGROUND_DAILY_QUOTA_GLOBAL: z.coerce.number().int().min(1).default(5000),
  // Cloudflare Turnstile — Layer 1 of the playground abuse stack. When
  // empty the middleware is a no-op (dev mode). Set both values in prod
  // from a Turnstile site (cloudflare.com → Turnstile → Add site). The
  // site key is ALSO required by the web app as VITE_TURNSTILE_SITE_KEY.
  TURNSTILE_SECRET_KEY: z.string().default(''),
  TURNSTILE_SITE_KEY: z.string().default(''),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Invalid or missing environment variables:')
  console.error(result.error.flatten().fieldErrors)
  process.exit(1)
}

// Derive SENTRY_ENVIRONMENT from NODE_ENV when the caller didn't set it
// explicitly. Keeps `.env` minimal while still tagging events with the right
// env name automatically.
const resolved = {
  ...result.data,
  SENTRY_ENVIRONMENT: result.data.SENTRY_ENVIRONMENT || result.data.NODE_ENV,
}

export const config = resolved
export type Config = typeof config
