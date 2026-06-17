import { Hono } from 'hono'
import { config } from '../../../config'
import { PistonAdapter } from '../../execution/PistonAdapter'
import type { AppEnv } from '../app-env'

export const cronPistonSmokeRoutes = new Hono<AppEnv>()

// Minimal hello-world per language. Each must print expectedStdout. Goes
// through PistonAdapter.execute() (same path scrolls use) so a bad
// PISTON_RUN_TIMEOUT / PISTON_COMPILE_TIMEOUT in config.ts surfaces here
// before a learner hits it — the gap that hid the compile-timeout regression
// behind a working /health/piston for hours.
//
// `critical: false` means a failure is reported in the body but doesn't 503
// the endpoint — reserve it for languages we've confirmed are broken at the
// runner layer and not in our control, never as a way to silence noise we
// haven't diagnosed. All six are critical today.
const SMOKE_PAYLOADS: ReadonlyArray<{
  language: string
  code: string
  testCode: string
  expectedStdout: string
  critical: boolean
}> = [
  { language: 'python',     code: '', testCode: 'print("ok")',         expectedStdout: 'ok', critical: true },
  { language: 'ruby',       code: '', testCode: 'puts "ok"',           expectedStdout: 'ok', critical: true },
  { language: 'typescript', code: '', testCode: 'console.log("ok")',   expectedStdout: 'ok', critical: true },
  { language: 'rust',       code: '', testCode: 'fn main() { println!("ok"); }', expectedStdout: 'ok', critical: true },
  { language: 'sql',        code: 'SELECT 1;', testCode: '',           expectedStdout: '1', critical: true },
  { language: 'go',         code: '', testCode: 'package main\nimport "fmt"\nfunc main() { fmt.Println("ok") }', expectedStdout: 'ok', critical: true },
]

cronPistonSmokeRoutes.post('/cron/piston-smoke', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!config.CRON_SECRET || authHeader !== `Bearer ${config.CRON_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const adapter = new PistonAdapter()
  const results = await Promise.all(
    SMOKE_PAYLOADS.map(async (p) => {
      const result = await adapter.execute({
        language: p.language,
        code: p.code,
        testCode: p.testCode,
      })
      const passed = result.exitCode === 0 && result.stdout.includes(p.expectedStdout)
      return {
        language: p.language,
        critical: p.critical,
        passed,
        exitCode: result.exitCode,
        executionTimeMs: result.executionTimeMs,
        stderr: passed ? '' : result.stderr.slice(0, 300),
        stdout: passed ? '' : result.stdout.slice(0, 100),
      }
    }),
  )

  const allPassed = results.every((r) => r.passed)
  const criticalAllPassed = results.every((r) => !r.critical || r.passed)
  return c.json(
    { allPassed, criticalAllPassed, results },
    criticalAllPassed ? 200 : 503,
  )
})
