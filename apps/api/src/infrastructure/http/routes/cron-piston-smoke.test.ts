import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { ExecutionResult } from '../../../domain/practice/ports'

// CRON_SECRET is read off the mocked config; reassign in tests to flip the
// authorized/unauthorized branches without re-importing the module.
const { config, execute } = vi.hoisted(() => ({
  config: { CRON_SECRET: 'test-cron-secret' } as { CRON_SECRET: string },
  execute: vi.fn(),
}))

vi.mock('../../../config', () => ({ config }))

vi.mock('../../execution/PistonAdapter', () => ({
  PistonAdapter: vi.fn(() => ({ execute })),
}))

import { cronPistonSmokeRoutes } from './cron-piston-smoke'

const SMOKE_LANGUAGES = ['python', 'ruby', 'typescript', 'rust', 'sql', 'go']

function ok(stdout: string): ExecutionResult {
  return {
    stdout,
    stderr: '',
    exitCode: 0,
    timedOut: false,
    outputExceeded: false,
    runTimeoutMs: 8000,
    executionTimeMs: 12,
  }
}

function fail(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    stdout: 'nope',
    stderr: 'boom',
    exitCode: 1,
    timedOut: false,
    outputExceeded: false,
    runTimeoutMs: 8000,
    executionTimeMs: 7,
    ...overrides,
  }
}

function makeApp() {
  const app = new Hono()
  app.route('/', cronPistonSmokeRoutes)
  return app
}

function bearer(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

describe('POST /cron/piston-smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.CRON_SECRET = 'test-cron-secret'
    // Every language returns its expected stdout by default — the all-green path.
    execute.mockImplementation(({ language }: { language: string }) =>
      Promise.resolve(ok(language === 'sql' ? '1' : 'ok')),
    )
  })

  describe('auth', () => {
    it('returns 401 when no Authorization header is present', async () => {
      const res = await makeApp().request('/cron/piston-smoke', { method: 'POST' })

      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('returns 401 when the bearer token is wrong', async () => {
      const res = await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer('not-the-secret'),
      })

      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('returns 401 when the header is not a Bearer scheme', async () => {
      const res = await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        headers: { Authorization: 'Basic test-cron-secret' },
      })

      expect(res.status).toBe(401)
    })

    it('returns 401 when CRON_SECRET is unset, even with a matching Bearer empty token', async () => {
      // An empty configured secret must never authorize — `Bearer ` would
      // otherwise equal `Bearer ${''}` and silently open the endpoint.
      config.CRON_SECRET = ''
      const res = await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer(''),
      })

      expect(res.status).toBe(401)
      expect(execute).not.toHaveBeenCalled()
    })

    it('does not run any smoke payload when unauthorized', async () => {
      await makeApp().request('/cron/piston-smoke', { method: 'POST' })

      expect(execute).not.toHaveBeenCalled()
    })
  })

  describe('authorized — all languages pass', () => {
    it('returns 200 with allPassed and criticalAllPassed true', async () => {
      const res = await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer('test-cron-secret'),
      })

      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        allPassed: boolean
        criticalAllPassed: boolean
        results: Array<{ language: string; passed: boolean; critical: boolean }>
      }
      expect(body.allPassed).toBe(true)
      expect(body.criticalAllPassed).toBe(true)
      expect(body.results.map((r) => r.language)).toEqual(SMOKE_LANGUAGES)
      expect(body.results.every((r) => r.passed)).toBe(true)
      expect(body.results.every((r) => r.critical)).toBe(true)
    })

    it('runs the adapter once per smoke payload (6 languages)', async () => {
      await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer('test-cron-secret'),
      })

      expect(execute).toHaveBeenCalledTimes(6)
    })

    it('blanks stdout/stderr on passing results and surfaces exitCode + timing', async () => {
      const res = await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer('test-cron-secret'),
      })

      const body = (await res.json()) as {
        results: Array<{
          stdout: string
          stderr: string
          exitCode: number
          executionTimeMs: number
        }>
      }
      for (const r of body.results) {
        expect(r.stdout).toBe('')
        expect(r.stderr).toBe('')
        expect(r.exitCode).toBe(0)
        expect(r.executionTimeMs).toBe(12)
      }
    })

    it('passes the per-language code/testCode through to the adapter', async () => {
      await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer('test-cron-secret'),
      })

      const calls = execute.mock.calls.map((c) => (c[0] as { language: string }).language)
      expect(calls).toEqual(SMOKE_LANGUAGES)
      // sql carries code (the query) and an empty testCode; others invert it.
      const sqlCall = execute.mock.calls.find(
        (c) => (c[0] as { language: string }).language === 'sql',
      )?.[0] as { code: string; testCode: string }
      expect(sqlCall.code).toBe('SELECT 1;')
      expect(sqlCall.testCode).toBe('')
      const pyCall = execute.mock.calls.find(
        (c) => (c[0] as { language: string }).language === 'python',
      )?.[0] as { code: string; testCode: string }
      expect(pyCall.code).toBe('')
      expect(pyCall.testCode).toContain('print("ok")')
    })
  })

  describe('authorized — failures', () => {
    it('returns 503 with truncated stderr/stdout when a critical language fails', async () => {
      execute.mockImplementation(({ language }: { language: string }) => {
        if (language === 'ruby') {
          return Promise.resolve(
            fail({ stderr: 'x'.repeat(500), stdout: 'y'.repeat(500), exitCode: 2 }),
          )
        }
        return Promise.resolve(ok(language === 'sql' ? '1' : 'ok'))
      })

      const res = await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer('test-cron-secret'),
      })

      expect(res.status).toBe(503)
      const body = (await res.json()) as {
        allPassed: boolean
        criticalAllPassed: boolean
        results: Array<{
          language: string
          passed: boolean
          stderr: string
          stdout: string
          exitCode: number
        }>
      }
      expect(body.allPassed).toBe(false)
      expect(body.criticalAllPassed).toBe(false)

      const ruby = body.results.find((r) => r.language === 'ruby')!
      expect(ruby.passed).toBe(false)
      expect(ruby.exitCode).toBe(2)
      // Failed results keep diagnostics, capped at 300/100 chars.
      expect(ruby.stderr).toHaveLength(300)
      expect(ruby.stdout).toHaveLength(100)
    })

    it('marks a language failed when exitCode is 0 but stdout lacks expected output', async () => {
      execute.mockImplementation(({ language }: { language: string }) => {
        if (language === 'go') {
          return Promise.resolve(ok('something-else'))
        }
        return Promise.resolve(ok(language === 'sql' ? '1' : 'ok'))
      })

      const res = await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer('test-cron-secret'),
      })

      expect(res.status).toBe(503)
      const body = (await res.json()) as {
        results: Array<{ language: string; passed: boolean }>
      }
      expect(body.results.find((r) => r.language === 'go')!.passed).toBe(false)
    })

    it('substring match counts as a pass (expected stdout embedded in noise)', async () => {
      execute.mockImplementation(({ language }: { language: string }) =>
        Promise.resolve(ok(language === 'sql' ? 'result: 1 row' : 'value=ok\n')),
      )

      const res = await makeApp().request('/cron/piston-smoke', {
        method: 'POST',
        ...bearer('test-cron-secret'),
      })

      expect(res.status).toBe(200)
      const body = (await res.json()) as { allPassed: boolean }
      expect(body.allPassed).toBe(true)
    })
  })
})
