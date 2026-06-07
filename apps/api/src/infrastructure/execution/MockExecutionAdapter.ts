import type { CodeExecutionPort, ExecutionResult } from '../../domain/practice/ports'

export class MockExecutionAdapter implements CodeExecutionPort {
  async execute(params: {
    language: string
    code: string
    testCode: string
    timeoutMs?: number
  }): Promise<ExecutionResult> {
    // Simulate a short delay
    await new Promise((r) => setTimeout(r, 200))

    // Simple heuristic: if code is non-trivially long, simulate pass. The mock
    // exists so the UI flow is testable without Piston; the verdict here is
    // arbitrary, the goal is to emit output the ExecuteStep parser can read.
    const hasCode = params.code.trim().length > 20
    const passed = hasCode

    // Emit a structured __DOJO_RESULT__ block so the parser uses the same code
    // path it uses for the real Ruby/Python/SQL harnesses. Without this, the
    // legacy fallback regex sees "fail" in "0 failures" and reports the step
    // as failed even though stdout says it passed. This bit Ruby smoke.
    type MockTest = { name: string; passed: boolean; message?: string }
    const tests: MockTest[] = passed
      ? [
          { name: 'mock test 1', passed: true },
          { name: 'mock test 2', passed: true },
          { name: 'mock test 3', passed: true },
        ]
      : [
          {
            name: 'mock test 1',
            passed: false,
            message: 'Mock adapter rejected this submission (code too short to be plausible).',
          },
        ]
    const checkLines = tests
      .map((t) => (t.passed ? `✓ ${t.name}` : `✗ ${t.name}: ${t.message ?? ''}`))
      .join('\n')
    const dojoResult = JSON.stringify({ ok: passed, tests })

    return {
      stdout: `${checkLines}\n__DOJO_RESULT__ ${dojoResult}\n`,
      stderr: '',
      exitCode: passed ? 0 : 1,
      timedOut: false,
      executionTimeMs: 200,
    }
  }

  async run(params: {
    language: string
    version: string
    code: string
  }): Promise<ExecutionResult> {
    await new Promise((r) => setTimeout(r, 50))
    return {
      stdout: `[mock ${params.language}@${params.version}]\n${params.code.length} bytes of code received\n`,
      stderr: '',
      exitCode: 0,
      timedOut: false,
      executionTimeMs: 50,
    }
  }
}
