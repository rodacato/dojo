import { describe, expect, it, vi } from 'vitest'
import { ExecuteStep } from './ExecuteStep'

describe('ExecuteStep', () => {
  it('returns passed when execution succeeds', async () => {
    const executionPort = {
      execute: vi.fn().mockResolvedValue({
        stdout: '✓ adds numbers\n✓ handles zero\n',
        stderr: '',
        exitCode: 0,
        timedOut: false,
        executionTimeMs: 120,
      }),
    }

    const useCase = new ExecuteStep({ executionPort })
    const result = await useCase.execute({
      code: 'function add(a, b) { return a + b }',
      testCode: 'test code',
      language: 'typescript',
    })

    expect(result.passed).toBe(true)
    expect(result.testResults).toHaveLength(2)
    expect(result.testResults[0].passed).toBe(true)
    expect(executionPort.execute).toHaveBeenCalledWith({
      language: 'typescript',
      code: 'function add(a, b) { return a + b }',
      testCode: 'test code',
      timeoutMs: 30_000,
    })
  })

  it('returns failed when execution fails', async () => {
    const executionPort = {
      execute: vi.fn().mockResolvedValue({
        stdout: '✓ adds numbers\n✗ handles zero\n',
        stderr: '',
        exitCode: 1,
        timedOut: false,
        executionTimeMs: 150,
      }),
    }

    const useCase = new ExecuteStep({ executionPort })
    const result = await useCase.execute({
      code: 'function add(a, b) { return 0 }',
      testCode: 'test code',
      language: 'typescript',
    })

    expect(result.passed).toBe(false)
    expect(result.testResults.some((r) => !r.passed)).toBe(true)
  })

  it('handles timeout', async () => {
    const executionPort = {
      execute: vi.fn().mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 1,
        timedOut: true,
        executionTimeMs: 30_000,
      }),
    }

    const useCase = new ExecuteStep({ executionPort })
    const result = await useCase.execute({
      code: 'while(true) {}',
      testCode: 'test code',
      language: 'typescript',
    })

    expect(result.passed).toBe(false)
    expect(result.output).toContain('timed out')
  })

  it('splits "✗ name: message" into name and message fields', async () => {
    const executionPort = {
      execute: vi.fn().mockResolvedValue({
        stdout: '✓ adds numbers\n✗ handles zero: expected 0 but got 1\n',
        stderr: '',
        exitCode: 1,
        timedOut: false,
        executionTimeMs: 100,
      }),
    }

    const useCase = new ExecuteStep({ executionPort })
    const result = await useCase.execute({ code: '', testCode: '', language: 'typescript' })

    const failedTest = result.testResults.find((r) => !r.passed)
    expect(failedTest?.name).toBe('handles zero')
    expect(failedTest?.message).toBe('expected 0 but got 1')
  })

  it('falls back to single result when output has no structured lines', async () => {
    const executionPort = {
      execute: vi.fn().mockResolvedValue({
        stdout: '',
        stderr: 'SyntaxError: Unexpected token',
        exitCode: 1,
        timedOut: false,
        executionTimeMs: 50,
      }),
    }

    const useCase = new ExecuteStep({ executionPort })
    const result = await useCase.execute({ code: '', testCode: '', language: 'typescript' })

    expect(result.testResults).toHaveLength(1)
    expect(result.testResults[0].passed).toBe(false)
    expect(result.testResults[0].name).toBe('Test execution')
  })

  it('fallback marks passed when output contains no error/fail keywords', async () => {
    const executionPort = {
      execute: vi.fn().mockResolvedValue({
        stdout: 'All good',
        stderr: '',
        exitCode: 0,
        timedOut: false,
        executionTimeMs: 50,
      }),
    }

    const useCase = new ExecuteStep({ executionPort })
    const result = await useCase.execute({ code: '', testCode: '', language: 'typescript' })

    expect(result.testResults).toHaveLength(1)
    expect(result.testResults[0].passed).toBe(true)
  })
})
