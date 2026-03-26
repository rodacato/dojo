import type { CodeExecutionPort, ExecutionResult } from '../../domain/practice/ports'

interface QueueItem {
  resolve: (result: ExecutionResult) => void
  reject: (error: Error) => void
  params: { language: string; code: string; testCode: string; timeoutMs?: number }
}

export class ExecutionQueue {
  private running = 0
  private queue: QueueItem[] = []

  constructor(
    private readonly executor: CodeExecutionPort,
    private readonly maxConcurrency: number = 3,
    private readonly queueTimeoutMs: number = 30000,
  ) {}

  get depth(): number {
    return this.queue.length
  }

  get activeCount(): number {
    return this.running
  }

  async enqueue(params: {
    language: string
    code: string
    testCode: string
    timeoutMs?: number
  }): Promise<ExecutionResult> {
    if (this.running < this.maxConcurrency) {
      return this.run(params)
    }

    return new Promise<ExecutionResult>((resolve, reject) => {
      const item: QueueItem = { resolve, reject, params }
      this.queue.push(item)

      // Queue timeout — don't wait forever
      const timer = setTimeout(() => {
        const idx = this.queue.indexOf(item)
        if (idx !== -1) {
          this.queue.splice(idx, 1)
          resolve({
            stdout: '',
            stderr: 'Execution queue timeout — too many concurrent requests',
            exitCode: 1,
            timedOut: true,
            executionTimeMs: this.queueTimeoutMs,
          })
        }
      }, this.queueTimeoutMs)

      // Clear timeout if the item gets processed before timeout
      const originalResolve = item.resolve
      item.resolve = (result) => {
        clearTimeout(timer)
        originalResolve(result)
      }
    })
  }

  private async run(params: QueueItem['params']): Promise<ExecutionResult> {
    this.running++
    try {
      return await this.executor.execute(params)
    } finally {
      this.running--
      this.processNext()
    }
  }

  private processNext(): void {
    const next = this.queue.shift()
    if (next) {
      this.run(next.params).then(next.resolve).catch(next.reject)
    }
  }
}
