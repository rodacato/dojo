import type { CodeExecutionPort, ExecutionResult } from '../../domain/practice/ports'

type ExecuteParams = { language: string; code: string; testCode: string; timeoutMs?: number }
type RunParams = { language: string; version: string; code: string }
type RunFilesParams = Parameters<CodeExecutionPort['runFiles']>[0]

interface QueueItem {
  resolve: (result: ExecutionResult) => void
  reject: (error: Error) => void
  mode: 'execute' | 'run' | 'runFiles'
  params: ExecuteParams | RunParams | RunFilesParams
}

export class ExecutionQueue {
  private running = 0
  private readonly queue: QueueItem[] = []

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

  async enqueue(params: ExecuteParams): Promise<ExecutionResult> {
    return this.schedule('execute', params)
  }

  // Playground / free-form execution path. Shares the same concurrency
  // pool as kata execution so a playground burst cannot starve
  // real practice — see spec 027 §1.5.
  async enqueueRun(params: RunParams): Promise<ExecutionResult> {
    return this.schedule('run', params)
  }

  async enqueueRunFiles(params: RunFilesParams): Promise<ExecutionResult> {
    return this.schedule('runFiles', params)
  }

  private async schedule(
    mode: QueueItem['mode'],
    params: QueueItem['params'],
  ): Promise<ExecutionResult> {
    if (this.running < this.maxConcurrency) {
      return this.runTask(mode, params)
    }

    return new Promise<ExecutionResult>((resolve, reject) => {
      const item: QueueItem = { resolve, reject, mode, params }
      this.queue.push(item)

      const timer = setTimeout(() => {
        const idx = this.queue.indexOf(item)
        if (idx !== -1) {
          this.queue.splice(idx, 1)
          resolve({
            stdout: '',
            stderr: 'Execution queue timeout — too many concurrent requests',
            exitCode: 1,
            timedOut: true,
            outputExceeded: false,
            runTimeoutMs: this.queueTimeoutMs,
            executionTimeMs: this.queueTimeoutMs,
            failure: 'unavailable',
          })
        }
      }, this.queueTimeoutMs)

      const originalResolve = item.resolve
      item.resolve = (result) => {
        clearTimeout(timer)
        originalResolve(result)
      }
    })
  }

  private async runTask(mode: QueueItem['mode'], params: QueueItem['params']): Promise<ExecutionResult> {
    this.running++
    try {
      if (mode === 'execute') return await this.executor.execute(params as ExecuteParams)
      if (mode === 'run') return await this.executor.run(params as RunParams)
      return await this.executor.runFiles(params as RunFilesParams)
    } finally {
      this.running--
      this.processNext()
    }
  }

  private processNext(): void {
    const next = this.queue.shift()
    if (next) {
      this.runTask(next.mode, next.params).then(next.resolve).catch(next.reject)
    }
  }
}
