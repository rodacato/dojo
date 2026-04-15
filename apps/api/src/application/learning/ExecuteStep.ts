import type { CodeExecutionPort, ExecutionResult } from '../../domain/practice/ports'

export type ExecuteErrorKind = 'runtime' | 'compile' | 'timeout' | 'sandbox'

export interface StepExecutionResult {
  passed: boolean
  /** Raw combined stdout+stderr — kept for any legacy UI that still reads it. */
  output: string
  stdout: string
  stderr: string
  testResults: { name: string; passed: boolean; message?: string }[]
  errorKind?: ExecuteErrorKind
  errorMessage?: string
}

interface Deps {
  executionPort: CodeExecutionPort
}

// Harnesses emit a single line on stdout:
//   __DOJO_RESULT__ {"ok":true,"tests":[{"name":"...","passed":true}]}
// When present, we trust it and skip the regex parser entirely.
const RESULT_MARKER = /^__DOJO_RESULT__\s+(\{[\s\S]*\})\s*$/m

// Heuristic keywords for infra failures coming back from PistonAdapter's
// fetch() catch branch (Connection refused, fetch failed, etc.).
const SANDBOX_ERROR_RE = /fetch failed|ECONNREFUSED|ECONNRESET|Connection refused|Piston error/i

export class ExecuteStep {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    code: string
    testCode: string
    language: string
  }): Promise<StepExecutionResult> {
    const result = await this.deps.executionPort.execute({
      language: params.language,
      code: params.code,
      testCode: params.testCode,
      timeoutMs: 30_000,
    })

    return this.toStepResult(result)
  }

  private toStepResult(r: ExecutionResult): StepExecutionResult {
    const stdout = r.stdout ?? ''
    const stderr = r.stderr ?? ''
    const combined = (stdout + '\n' + stderr).trim()

    // 1. Sandbox / infrastructure failure — don't claim "tests failed".
    if (SANDBOX_ERROR_RE.test(stderr) || SANDBOX_ERROR_RE.test(stdout)) {
      return {
        passed: false,
        output: combined,
        stdout,
        stderr,
        testResults: [],
        errorKind: 'sandbox',
        errorMessage:
          "Couldn't reach the code sandbox. The runner is unavailable right now — try again in a moment.",
      }
    }

    if (r.timedOut) {
      return {
        passed: false,
        output: 'Execution timed out (30s limit)',
        stdout,
        stderr,
        testResults: [],
        errorKind: 'timeout',
        errorMessage:
          'Execution timed out after 30 seconds — check for infinite loops or excessively slow work.',
      }
    }

    // 2. Structured result from the harness — trust it.
    const structured = extractStructuredResult(stdout)
    if (structured) {
      return {
        passed: structured.ok,
        output: combined,
        stdout,
        stderr,
        testResults: structured.tests,
      }
    }

    // 3. Non-zero exit with no structured output — treat as compile/runtime error.
    if (r.exitCode !== 0) {
      const kind: ExecuteErrorKind = stderr.toLowerCase().includes('compile') ? 'compile' : 'runtime'
      return {
        passed: false,
        output: combined,
        stdout,
        stderr,
        testResults: [],
        errorKind: kind,
        errorMessage:
          kind === 'compile'
            ? 'Your code did not compile. See the Output tab for details.'
            : 'Your code crashed before tests could finish. See the Output tab for the error.',
      }
    }

    // 4. Legacy fallback — parse ✓/✗ lines from stdout. Kept so harnesses
    //    that haven't migrated to __DOJO_RESULT__ still display tests.
    const testResults = parseLegacyTestOutput(combined)
    const passed = r.exitCode === 0 && testResults.every((t) => t.passed)
    return { passed, output: combined, stdout, stderr, testResults }
  }
}

interface StructuredResult {
  ok: boolean
  tests: { name: string; passed: boolean; message?: string }[]
}

function extractStructuredResult(output: string): StructuredResult | null {
  const match = output.match(RESULT_MARKER)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1] as string) as {
      ok?: unknown
      tests?: Array<{ name?: unknown; passed?: unknown; message?: unknown }>
    }
    if (typeof parsed.ok !== 'boolean' || !Array.isArray(parsed.tests)) return null
    const tests: StructuredResult['tests'] = []
    for (const t of parsed.tests) {
      if (typeof t.name !== 'string' || typeof t.passed !== 'boolean') continue
      tests.push({
        name: t.name,
        passed: t.passed,
        message: typeof t.message === 'string' ? t.message : undefined,
      })
    }
    return { ok: parsed.ok, tests }
  } catch {
    return null
  }
}

function parseLegacyTestOutput(output: string): { name: string; passed: boolean; message?: string }[] {
  const lines = output.split('\n')
  const results: { name: string; passed: boolean; message?: string }[] = []

  for (const line of lines) {
    const passMatch = line.match(/[✓✔]\s+(.+)/) || line.match(/PASS\s+(.+)/) || line.match(/ok\s+\d+\s+-\s+(.+)/)
    const failMatch = line.match(/[✗✘×]\s+(.+)/) || line.match(/FAIL\s+(.+)/) || line.match(/not ok\s+\d+\s+-\s+(.+)/)

    if (passMatch) {
      results.push({ name: (passMatch[1] ?? '').trim(), passed: true })
    } else if (failMatch) {
      const full = (failMatch[1] ?? '').trim()
      const colonIdx = full.indexOf(': ')
      const name = colonIdx > -1 ? full.slice(0, colonIdx) : full
      const message = colonIdx > -1 ? full.slice(colonIdx + 2) : undefined
      results.push({ name, passed: false, message })
    }
  }

  if (results.length === 0) {
    const lower = output.toLowerCase()
    const passed = !lower.includes('error') && !lower.includes('fail')
    results.push({
      name: 'Test execution',
      passed,
      message: passed ? undefined : output.trim().slice(0, 500),
    })
  }

  return results
}
