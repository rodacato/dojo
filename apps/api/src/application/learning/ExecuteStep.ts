import type { CodeExecutionPort, ExecutionResult } from '../../domain/practice/ports'

export type ExecuteErrorKind =
  | 'runtime'
  | 'compile'
  | 'timeout'
  | 'sandbox'
  | 'output-exceeded'

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

// A compile failure looks different per language and rarely contains the
// literal word "compile": tsc emits `error TS2322`, rustc `error[E0382]`,
// go `./main.go:N: ...`, java `error:`. Recognize the common compiler-error
// signatures so the learner is told "did not compile" (and pointed at the
// type/borrow error), not "crashed at runtime".
const COMPILE_ERROR_RE = /\berror TS\d+\b|error\[E\d+\]|^.*\.go:\d+:\d+:|cannot find symbol|: error:/m

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

    // Output-exceeded comes first because Piston returns SIGKILL for both
    // output-exceeded and real timeouts, but they're different failure modes:
    // output-exceeded means "the program ran fine, it just printed too much",
    // timeout means "the program is stuck or too slow". Telling the learner
    // "infinite loop" when their harness merely overshot the 64 KB cap is
    // the bad UX we lived through during the Ruby capstone marathon.
    if (r.outputExceeded) {
      return {
        passed: false,
        output: 'Output exceeded the runner cap',
        stdout,
        stderr,
        testResults: [],
        errorKind: 'output-exceeded',
        errorMessage:
          'Your program printed more output than the runner allows. Trim debug prints, large arrays, or repeated logs.',
      }
    }

    if (r.timedOut) {
      const seconds = formatTimeoutSeconds(r.runTimeoutMs)
      return {
        passed: false,
        output: `Execution timed out (${seconds}s limit)`,
        stdout,
        stderr,
        testResults: [],
        errorKind: 'timeout',
        errorMessage: `Execution timed out after ${seconds} seconds — check for infinite loops or excessively slow work.`,
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
      const kind: ExecuteErrorKind =
        stderr.toLowerCase().includes('compile') || COMPILE_ERROR_RE.test(combined)
          ? 'compile'
          : 'runtime'
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

function formatTimeoutSeconds(ms: number): string {
  const seconds = ms / 1000
  return Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(1)
}

interface StructuredResult {
  ok: boolean
  tests: { name: string; passed: boolean; message?: string }[]
}

function extractStructuredResult(output: string): StructuredResult | null {
  const match = RESULT_MARKER.exec(output)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1]) as {
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
    const passMatch = /[✓✔]\s+(.+)/.exec(line) || /PASS\s+(.+)/.exec(line) || /ok\s+\d+\s+-\s+(.+)/.exec(line)
    const failMatch = /[✗✘×]\s+(.+)/.exec(line) || /FAIL\s+(.+)/.exec(line) || /not ok\s+\d+\s+-\s+(.+)/.exec(line)

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
