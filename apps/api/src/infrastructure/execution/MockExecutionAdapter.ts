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

    const passed = params.code.trim().length > 20
    const checkLines = passed
      ? ['✓ mock test 1', '✓ mock test 2', '✓ mock test 3'].join('\n')
      : '✗ mock test 1: Mock adapter rejected this submission (code too short to be plausible).'

    return {
      stdout: `${checkLines}\n`,
      stderr: '',
      exitCode: passed ? 0 : 1,
      timedOut: false,
      outputExceeded: false,
      runTimeoutMs: 8000,
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
      outputExceeded: false,
      runTimeoutMs: 3000,
      executionTimeMs: 50,
    }
  }
}
