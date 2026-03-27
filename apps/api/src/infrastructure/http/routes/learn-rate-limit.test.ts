import { describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import { executionLimiter } from '../middleware/rateLimiter'

// Prevent real DB/config imports
vi.mock('../../container', () => ({
  useCases: {
    executeStep: {
      execute: vi.fn().mockResolvedValue({
        passed: true,
        output: '✓ test passes',
        testResults: [{ name: 'test passes', passed: true }],
      }),
    },
  },
}))
vi.mock('../../persistence/drizzle/client', () => ({ db: {} }))

const VALID_BODY = JSON.stringify({
  code: 'function add(a, b) { return a + b }',
  testCode: '// test',
  language: 'javascript',
})

const HEADERS = { 'Content-Type': 'application/json' }

/**
 * Build a minimal Hono app with only the executionLimiter middleware
 * and a stub handler — isolated from the full router to avoid
 * globalLimiter or other middleware interfering with the count.
 */
function buildTestApp() {
  const app = new Hono()
  app.post(
    '/learn/execute',
    executionLimiter,
    (c) => c.json({ passed: true, output: '', testResults: [] }),
  )
  return app
}

describe('POST /learn/execute — anonymous rate limit', () => {
  it('allows 10 executions and returns 429 on the 11th', async () => {
    const app = buildTestApp()

    // Requests 1–10: all from the same anonymous IP ('unknown' — no CF or X-FF header)
    for (let i = 1; i <= 10; i++) {
      const res = await app.request('/learn/execute', {
        method: 'POST',
        headers: HEADERS,
        body: VALID_BODY,
      })
      expect(res.status, `request #${i} should succeed`).toBe(200)
    }

    // Request 11: should be rate-limited
    const res = await app.request('/learn/execute', {
      method: 'POST',
      headers: HEADERS,
      body: VALID_BODY,
    })
    expect(res.status).toBe(429)

    const body = await res.json() as { error: string }
    expect(body.error).toContain('Execution limit reached')
  })

  it('counts per IP — a different IP is not affected', async () => {
    const app = buildTestApp()

    // Exhaust the limit for 'unknown' IP
    for (let i = 0; i < 10; i++) {
      await app.request('/learn/execute', {
        method: 'POST',
        headers: HEADERS,
        body: VALID_BODY,
      })
    }

    // A different IP (via X-Forwarded-For) should still be allowed
    const res = await app.request('/learn/execute', {
      method: 'POST',
      headers: { ...HEADERS, 'x-forwarded-for': '1.2.3.4' },
      body: VALID_BODY,
    })
    expect(res.status).toBe(200)
  })
})
