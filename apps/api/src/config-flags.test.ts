import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { envSchema } from './config'

const required = {
  DATABASE_URL: 'postgresql://dojo:dojo@localhost:5432/dojo_test',
  SESSION_SECRET: 'x'.repeat(32),
  GITHUB_CLIENT_ID: 'id',
  GITHUB_CLIENT_SECRET: 'secret',
  GITHUB_CALLBACK_URL: 'http://localhost:3001/auth/github/callback',
  WEB_URL: 'http://localhost:5173',
}

const flags = {
  LLM_STREAM: true,
  MOCK_LLM_FOLLOW_UP: false,
  FF_CODE_EXECUTION_ENABLED: false,
  FF_PLAYGROUND_CONSOLE_ENABLED: false,
  FF_LLM_PREP_STREAMING_ENABLED: false,
  FF_PLAYGROUND_ASK_SENSEI_ENABLED: false,
  METRICS_ENABLED: false,
} as const

type Flag = keyof typeof flags

const parseFlag = (name: Flag, value: string | undefined) => {
  const env: Record<string, string> = { ...required }
  if (value !== undefined) env[name] = value
  return envSchema.safeParse(env)
}

describe.each(Object.entries(flags) as [Flag, boolean][])('%s', (name, fallback) => {
  it.each(['true', '1', 'TRUE', ' True '])('reads %j as true', (value) => {
    const result = parseFlag(name, value)
    expect(result.success && result.data[name]).toBe(true)
  })

  it.each(['false', '0', 'FALSE', ' false\n'])('reads %j as false', (value) => {
    const result = parseFlag(name, value)
    expect(result.success).toBe(true)
    expect(result.success && result.data[name]).toBe(false)
  })

  it.each([undefined, '', '   '])('falls back to the declared default for %j', (value) => {
    const result = parseFlag(name, value)
    expect(result.success).toBe(true)
    expect(result.success && result.data[name]).toBe(fallback)
  })

  it.each(['yes', 'no', 'off', 'on', 'flase', '2'])(
    'rejects %j instead of picking a side',
    (value) => {
      const result = parseFlag(name, value)
      expect(result.success).toBe(false)
      expect(!result.success && result.error.issues[0]?.path).toEqual([name])
    },
  )
})

describe('boot', () => {
  const configModule = join(__dirname, 'config.ts')

  const boot = (extra: Record<string, string>) =>
    execFileSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        `const { config } = await import(${JSON.stringify(configModule)}); console.log(JSON.stringify(config))`,
      ],
      {
        env: { PATH: process.env['PATH'], ...required, ...extra },
        encoding: 'utf8',
        stdio: 'pipe',
      },
    )

  it('keeps the playground console off when the kill switch is set to false', () => {
    const config = JSON.parse(boot({ FF_PLAYGROUND_CONSOLE_ENABLED: 'false' }))
    expect(config.FF_PLAYGROUND_CONSOLE_ENABLED).toBe(false)
  })

  it('streams the sensei when the deploy renders LLM_STREAM empty', () => {
    const config = JSON.parse(boot({ LLM_STREAM: '' }))
    expect(config.LLM_STREAM).toBe(true)
  })

  it('exits at boot naming the variable that holds an unknown value', () => {
    let failure: { status: number; stderr: string } | undefined
    try {
      boot({ FF_PLAYGROUND_CONSOLE_ENABLED: 'off' })
    } catch (error) {
      failure = error as { status: number; stderr: string }
    }
    expect(failure?.status).toBe(1)
    expect(failure?.stderr).toContain('FF_PLAYGROUND_CONSOLE_ENABLED')
  })
})
