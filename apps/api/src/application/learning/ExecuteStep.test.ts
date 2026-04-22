import { describe, expect, it, vi } from 'vitest'
import { ExecuteStep } from './ExecuteStep'

function port(result: Partial<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean; executionTimeMs: number }>) {
  return {
    execute: vi.fn().mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      executionTimeMs: 100,
      ...result,
    }),
    run: vi.fn(),
  }
}

describe('ExecuteStep', () => {
  it('trusts structured __DOJO_RESULT__ block when present', async () => {
    const json = JSON.stringify({
      ok: false,
      tests: [
        { name: 'adds numbers', passed: true },
        { name: 'handles zero', passed: false, message: 'expected 0 but got 1' },
      ],
    })
    const executionPort = port({
      stdout: `✓ adds numbers\n✗ handles zero\n__DOJO_RESULT__ ${json}\n`,
      exitCode: 1,
    })

    const useCase = new ExecuteStep({ executionPort })
    const result = await useCase.execute({ code: '', testCode: '', language: 'typescript' })

    expect(result.passed).toBe(false)
    expect(result.testResults).toHaveLength(2)
    expect(result.testResults[1]?.message).toBe('expected 0 but got 1')
    expect(result.errorKind).toBeUndefined()
  })

  it('passes when structured result says ok=true', async () => {
    const json = JSON.stringify({
      ok: true,
      tests: [{ name: 'greets by name', passed: true }],
    })
    const executionPort = port({ stdout: `__DOJO_RESULT__ ${json}`, exitCode: 0 })

    const result = await new ExecuteStep({ executionPort }).execute({
      code: '', testCode: '', language: 'typescript',
    })

    expect(result.passed).toBe(true)
    expect(result.testResults).toHaveLength(1)
  })

  it('reports sandbox errorKind when stderr contains fetch failed', async () => {
    const executionPort = port({ stderr: 'fetch failed', exitCode: 1 })

    const result = await new ExecuteStep({ executionPort }).execute({
      code: '', testCode: '', language: 'typescript',
    })

    expect(result.passed).toBe(false)
    expect(result.errorKind).toBe('sandbox')
    expect(result.errorMessage).toContain("Couldn't reach")
    expect(result.testResults).toHaveLength(0)
  })

  it('reports timeout errorKind on timedOut=true', async () => {
    const executionPort = port({ timedOut: true, exitCode: 1 })

    const result = await new ExecuteStep({ executionPort }).execute({
      code: 'while(true){}', testCode: '', language: 'typescript',
    })

    expect(result.errorKind).toBe('timeout')
    expect(result.errorMessage).toContain('timed out')
  })

  it('reports compile errorKind when exit != 0 and stderr mentions compile', async () => {
    const executionPort = port({ stderr: 'error TS2322: failed to compile', exitCode: 1 })

    const result = await new ExecuteStep({ executionPort }).execute({
      code: '', testCode: '', language: 'typescript',
    })

    expect(result.errorKind).toBe('compile')
    expect(result.passed).toBe(false)
  })

  it('reports runtime errorKind when exit != 0 with no structured output and no compile hint', async () => {
    const executionPort = port({ stderr: 'SyntaxError: Unexpected token', exitCode: 1 })

    const result = await new ExecuteStep({ executionPort }).execute({
      code: '', testCode: '', language: 'typescript',
    })

    expect(result.errorKind).toBe('runtime')
    expect(result.testResults).toHaveLength(0)
  })

  it('surfaces stdout and stderr separately in the DTO', async () => {
    const executionPort = port({
      stdout: 'hello from log',
      stderr: 'a warning',
      exitCode: 0,
    })

    const result = await new ExecuteStep({ executionPort }).execute({
      code: '', testCode: '', language: 'typescript',
    })

    expect(result.stdout).toBe('hello from log')
    expect(result.stderr).toBe('a warning')
  })

  it('legacy fallback — parses ✓/✗ lines when no structured block is present', async () => {
    const executionPort = port({
      stdout: '✓ adds numbers\n✗ handles zero: expected 0 but got 1\n',
      exitCode: 0,
    })

    const result = await new ExecuteStep({ executionPort }).execute({
      code: '', testCode: '', language: 'typescript',
    })

    const failed = result.testResults.find((r) => !r.passed)
    expect(failed?.name).toBe('handles zero')
    expect(failed?.message).toBe('expected 0 but got 1')
  })

  it('legacy fallback — marks passed when stdout has no error/fail keywords', async () => {
    const executionPort = port({ stdout: 'All good', exitCode: 0 })

    const result = await new ExecuteStep({ executionPort }).execute({
      code: '', testCode: '', language: 'typescript',
    })

    expect(result.testResults[0]?.passed).toBe(true)
    expect(result.passed).toBe(true)
  })

  it('passes the right args to the port', async () => {
    const executionPort = port({ stdout: '', exitCode: 0 })
    await new ExecuteStep({ executionPort }).execute({
      code: 'function add(a, b) { return a + b }',
      testCode: 'test code',
      language: 'typescript',
    })

    expect(executionPort.execute).toHaveBeenCalledWith({
      language: 'typescript',
      code: 'function add(a, b) { return a + b }',
      testCode: 'test code',
      timeoutMs: 30_000,
    })
  })
})
