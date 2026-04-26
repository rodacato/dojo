import { test, expect } from '@playwright/test'

// Playground anon-run smoke — exercises POST /playground/run end-to-end
// against a real deploy without an authenticated session. Validates:
//   - feature flag is on (404 from a flag-off deploy is a clear signal,
//     not a false negative)
//   - Piston is reachable and returns a structured execution result
//   - Turnstile + rate-limit chain doesn't reject a well-formed request
//
// Turnstile prerequisite: the target deploy must be configured with
// Cloudflare's dummy "always-passes" secret key
// (`1x0000000000000000000000000000000AA`). The dummy token below
// (`XXXX.DUMMY.TOKEN.XXXX`) is the canonical sentinel value Cloudflare
// accepts in that mode. Run guards on `SMOKE_PLAYGROUND_ENABLED=1` so a
// prod deploy with a real Turnstile secret skips this spec rather than
// blowing up.

const API_URL = process.env['SMOKE_API_URL']!
const PLAYGROUND_ENABLED = process.env['SMOKE_PLAYGROUND_ENABLED'] === '1'

interface RunResponse {
  stdout: string
  stderr: string
  exitCode: number
  runtimeMs: number
  timedOut: boolean
}

test.describe('smoke: playground anon run', () => {
  test.skip(
    !PLAYGROUND_ENABLED,
    'SMOKE_PLAYGROUND_ENABLED=1 is required (target must run FF_PLAYGROUND_CONSOLE_ENABLED=1 + Turnstile dummy key)',
  )

  test('anonymous python run returns a structured execution result', async ({ request }) => {
    const res = await request.post(`${API_URL}/playground/run`, {
      data: {
        language: 'python',
        version: '3.12.0',
        code: 'print("smoke")',
        // Cloudflare's documented dummy response token. Pairs with the
        // dummy "always-passes" secret key on the server side.
        turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
      },
    })

    expect(
      res.status(),
      `POST /playground/run should return 200 (got ${res.status()}: ${await res.text()})`,
    ).toBe(200)

    const result = (await res.json()) as RunResponse
    expect(result).toHaveProperty('stdout')
    expect(result).toHaveProperty('stderr')
    expect(result).toHaveProperty('exitCode')
    expect(result).toHaveProperty('runtimeMs')
    expect(result.timedOut, 'a one-line print must not time out').toBe(false)
    // Realistic upper bound — Piston cold start is ~1-2s.
    expect(result.runtimeMs).toBeLessThan(5_000)
    // Happy path: print("smoke") should exit cleanly with the literal
    // string on stdout. If Piston is misconfigured the run can succeed
    // structurally with a non-zero exit; assert on stdout to catch that.
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('smoke')
  })
})
