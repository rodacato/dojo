import type { CodeExecutionPort } from '../../domain/practice/ports'

export interface StepExecutionResult {
  passed: boolean
  output: string
  testResults: { name: string; passed: boolean; message?: string }[]
}

interface Deps {
  executionPort: CodeExecutionPort
}

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

    const testResults = this.parseTestOutput(result.stdout + result.stderr)
    const passed = result.exitCode === 0 && !result.timedOut

    return {
      passed,
      output: result.timedOut
        ? 'Execution timed out (30s limit)'
        : (result.stdout + result.stderr).trim(),
      testResults,
    }
  }

  private parseTestOutput(output: string): { name: string; passed: boolean; message?: string }[] {
    const lines = output.split('\n')
    const results: { name: string; passed: boolean; message?: string }[] = []

    for (const line of lines) {
      // Match common test output patterns: ✓/✗, PASS/FAIL, ok/not ok
      const passMatch = line.match(/[✓✔]\s+(.+)/) || line.match(/PASS\s+(.+)/) || line.match(/ok\s+\d+\s+-\s+(.+)/)
      const failMatch = line.match(/[✗✘×]\s+(.+)/) || line.match(/FAIL\s+(.+)/) || line.match(/not ok\s+\d+\s+-\s+(.+)/)

      if (passMatch) {
        results.push({ name: passMatch[1].trim(), passed: true })
      } else if (failMatch) {
        // Support "✗ test name: error message" — split on first ": "
        const full = failMatch[1].trim()
        const colonIdx = full.indexOf(': ')
        const name = colonIdx > -1 ? full.slice(0, colonIdx) : full
        const message = colonIdx > -1 ? full.slice(colonIdx + 2) : undefined
        results.push({ name, passed: false, message })
      }
    }

    // If no structured output detected, return a single result based on exit code
    if (results.length === 0) {
      const lower = output.toLowerCase()
      const passed = !lower.includes('error') && !lower.includes('fail')
      results.push({ name: 'Test execution', passed, message: passed ? undefined : output.trim().slice(0, 500) })
    }

    return results
  }
}
