import { describe, expect, it, vi } from 'vitest'
import { ExecutionQueue } from './ExecutionQueue'
import type { CodeExecutionPort, ExecutionResult } from '../../domain/practice/ports'

const ok: ExecutionResult = { stdout: 'ok', stderr: '', exitCode: 0, timedOut: false, executionTimeMs: 10 }

function mockExecutor(delayMs = 0): CodeExecutionPort {
  return {
    execute: vi.fn(async () => {
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
      return ok
    }),
  }
}

describe('ExecutionQueue', () => {
  it('executes immediately when under concurrency limit', async () => {
    const executor = mockExecutor()
    const queue = new ExecutionQueue(executor, 3)
    const result = await queue.enqueue({ language: 'js', code: '1', testCode: '1' })
    expect(result).toEqual(ok)
    expect(executor.execute).toHaveBeenCalledTimes(1)
  })

  it('respects concurrency limit', async () => {
    let running = 0
    let maxRunning = 0
    const executor: CodeExecutionPort = {
      execute: async () => {
        running++
        maxRunning = Math.max(maxRunning, running)
        await new Promise((r) => setTimeout(r, 20))
        running--
        return ok
      },
    }

    const queue = new ExecutionQueue(executor, 2)
    const promises = Array.from({ length: 6 }, () =>
      queue.enqueue({ language: 'js', code: '1', testCode: '1' }),
    )
    await Promise.all(promises)
    expect(maxRunning).toBeLessThanOrEqual(2)
  })

  it('processes queued items in FIFO order', async () => {
    const order: number[] = []
    let callIndex = 0
    const executor: CodeExecutionPort = {
      execute: async () => {
        const idx = callIndex++
        order.push(idx)
        await new Promise((r) => setTimeout(r, 10))
        return { ...ok, stdout: String(idx) }
      },
    }

    const queue = new ExecutionQueue(executor, 1)
    const results = await Promise.all([
      queue.enqueue({ language: 'js', code: '0', testCode: '0' }),
      queue.enqueue({ language: 'js', code: '1', testCode: '1' }),
      queue.enqueue({ language: 'js', code: '2', testCode: '2' }),
    ])
    expect(order).toEqual([0, 1, 2])
    expect(results.map((r) => r.stdout)).toEqual(['0', '1', '2'])
  })

  it('times out queued items after queueTimeoutMs', async () => {
    const slowExecutor: CodeExecutionPort = {
      execute: async () => {
        await new Promise((r) => setTimeout(r, 5000))
        return ok
      },
    }

    const queue = new ExecutionQueue(slowExecutor, 1, 50)
    // First item executes (slow), second queues and should timeout
    // First item occupies the slot; we don't await it
    void queue.enqueue({ language: 'js', code: '1', testCode: '1' })
    const p2 = queue.enqueue({ language: 'js', code: '2', testCode: '2' })

    const result = await p2
    expect(result.timedOut).toBe(true)
    expect(result.stderr).toContain('queue timeout')
  })

  it('reports depth and activeCount', async () => {
    const executor: CodeExecutionPort = {
      execute: async () => {
        await new Promise((r) => setTimeout(r, 50))
        return ok
      },
    }

    const queue = new ExecutionQueue(executor, 1)
    queue.enqueue({ language: 'js', code: '1', testCode: '1' })
    queue.enqueue({ language: 'js', code: '2', testCode: '2' })

    // Give the first one time to start
    await new Promise((r) => setTimeout(r, 5))
    expect(queue.activeCount).toBe(1)
    expect(queue.depth).toBe(1)
  })
})
