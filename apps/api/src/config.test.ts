import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { envSchema } from './config'

// Minimum env a boot needs — every other variable has a default.
const baseEnv = {
  DATABASE_URL: 'postgresql://dojo:dojo@localhost:5432/dojo_test',
  SESSION_SECRET: 'test-secret-minimum-32-characters-long!!',
  GITHUB_CLIENT_ID: 'test-client-id',
  GITHUB_CLIENT_SECRET: 'test-client-secret',
  GITHUB_CALLBACK_URL: 'http://localhost:3001/auth/github/callback',
  WEB_URL: 'http://localhost:5173',
  NODE_ENV: 'test',
}

function parse(env: Record<string, string>) {
  return envSchema.safeParse({ ...baseEnv, ...env })
}

function fieldErrors(result: z.ZodSafeParseResult<unknown>): Record<string, string[] | undefined> {
  return result.success ? {} : z.flattenError(result.error).fieldErrors
}

describe('RESEND_FROM_EMAIL', () => {
  it('is not required when email is disabled', () => {
    const result = parse({})

    expect(result.success).toBe(true)
    expect(result.success && result.data.RESEND_FROM_EMAIL).toBe('')
  })

  it('has no baked-in sender to fall back on', () => {
    const result = parse({ RESEND_API_KEY: '', RESEND_FROM_EMAIL: '' })

    expect(result.success && result.data.RESEND_FROM_EMAIL).toBe('')
  })

  it('is required once RESEND_API_KEY is set', () => {
    const result = parse({ RESEND_API_KEY: 're_test_key' })

    expect(result.success).toBe(false)
    expect(fieldErrors(result)['RESEND_FROM_EMAIL']?.[0]).toContain('RESEND_FROM_EMAIL is required')
  })

  it('rejects a blank sender alongside a key', () => {
    const result = parse({ RESEND_API_KEY: 're_test_key', RESEND_FROM_EMAIL: '   ' })

    expect(result.success).toBe(false)
    expect(fieldErrors(result)['RESEND_FROM_EMAIL']).toBeDefined()
  })

  it('accepts a sender alongside a key', () => {
    const result = parse({
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM_EMAIL: 'dojo <noreply@example.dev>',
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data.RESEND_FROM_EMAIL).toBe('dojo <noreply@example.dev>')
  })
})
