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

    // Simple heuristic: if code contains "error" or is very short, simulate failure
    const hasCode = params.code.trim().length > 20
    const passed = hasCode

    return {
      stdout: passed
        ? 'All tests passed.\n\n3 tests, 0 failures'
        : 'FAILED\n\nExpected output to match, but got empty response.\n1 test, 1 failure',
      stderr: '',
      exitCode: passed ? 0 : 1,
      timedOut: false,
      executionTimeMs: 200,
    }
  }
}
