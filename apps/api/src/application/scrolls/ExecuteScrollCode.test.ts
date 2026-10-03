import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExecutionResult } from '../../domain/practice/ports'
import type { ScrollCodeRunnerPort } from '../../domain/scrolls/ports'
import {
  ScrollLanguageNotAllowedError,
  ScrollNotFoundError,
  ScrollRunNotDeclaredError,
} from '../../domain/shared/errors'
import { InMemoryScrollRepository, testManifest, testScrollEntry } from '../../test/scrolls'
import { ExecuteScrollCode } from './ExecuteScrollCode'

const request = { language: 'ruby', files: [{ name: 'main.rb', content: 'puts 1' }] }
const done: ExecutionResult = {
  stdout: '1\n',
  stderr: '',
  exitCode: 0,
  timedOut: false,
  outputExceeded: false,
  runTimeoutMs: 8000,
  executionTimeMs: 12.4,
}

let scrollRepo: InMemoryScrollRepository
let runner: ScrollCodeRunnerPort & { run: ReturnType<typeof vi.fn> }

const manifestWith = (over: Record<string, unknown>) => ({ ...testManifest, capabilities: ['run' as const], ...over })

async function seed(manifest = manifestWith({}), status: 'draft' | 'published' = 'published') {
  const entry = testScrollEntry({ slug: 'circuit', manifest, status })
  await scrollRepo.insert(entry)
}

const useCase = () => new ExecuteScrollCode({ scrollRepo, runner })

beforeEach(() => {
  scrollRepo = new InMemoryScrollRepository()
  runner = { run: vi.fn(async () => done) }
})

describe('ExecuteScrollCode', () => {
  it('runs the files and returns the raw output without interpreting it', async () => {
    await seed()
    const outcome = await useCase().execute('circuit', { ...request, stdin: 'in' })

    expect(runner.run).toHaveBeenCalledWith({ ...request, stdin: 'in' })
    expect(outcome).toEqual({ kind: 'ok', exitCode: 0, stdout: '1\n', stderr: '', durationMs: 12 })
  })

  it.each([
    ['runtime', { exitCode: 2, stderr: 'boom' }],
    ['compile', { exitCode: 1, failure: 'compile' as const }],
    ['timeout', { exitCode: 1, timedOut: true }],
    ['output-limit', { exitCode: 1, outputExceeded: true }],
  ])('classifies a %s result', async (kind, over) => {
    await seed()
    runner.run.mockResolvedValue({ ...done, ...over })
    expect((await useCase().execute('circuit', request)).kind).toBe(kind)
  })

  it('answers unavailable, with no exit code, when the sandbox is down', async () => {
    await seed()
    runner.run.mockResolvedValue({ ...done, exitCode: 1, stderr: 'ECONNREFUSED', failure: 'unavailable' })
    expect(await useCase().execute('circuit', request)).toMatchObject({ kind: 'unavailable', exitCode: null })
  })

  it('answers unavailable instead of throwing when the runner rejects', async () => {
    await seed()
    runner.run.mockRejectedValue(new Error('socket hang up'))
    expect(await useCase().execute('circuit', request)).toEqual({
      kind: 'unavailable',
      exitCode: null,
      stdout: '',
      stderr: '',
      durationMs: 0,
    })
  })

  it('truncates output so the result message stays valid', async () => {
    await seed()
    runner.run.mockResolvedValue({ ...done, stdout: 'x'.repeat(100_000) })
    expect((await useCase().execute('circuit', request)).stdout).toHaveLength(65_536)
  })

  it('never runs code for an unknown or draft scroll', async () => {
    await expect(useCase().execute('circuit', request)).rejects.toBeInstanceOf(ScrollNotFoundError)
    await seed(manifestWith({}), 'draft')
    await expect(useCase().execute('circuit', request)).rejects.toBeInstanceOf(ScrollNotFoundError)
    expect(runner.run).not.toHaveBeenCalled()
  })

  it('never runs code for a scroll that does not declare run', async () => {
    await seed(manifestWith({ capabilities: ['progress'] }))
    await expect(useCase().execute('circuit', request)).rejects.toBeInstanceOf(ScrollRunNotDeclaredError)
    expect(runner.run).not.toHaveBeenCalled()
  })

  it('never runs a language outside the manifest', async () => {
    await seed()
    await expect(useCase().execute('circuit', { ...request, language: 'python' })).rejects.toBeInstanceOf(
      ScrollLanguageNotAllowedError,
    )
    expect(runner.run).not.toHaveBeenCalled()
  })
})
