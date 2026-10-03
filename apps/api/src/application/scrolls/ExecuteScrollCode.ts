import { MAX_RUN_OUTPUT_CHARS, type RunResultKind, type ScrollExecuteRequest, type ScrollExecuteResponse } from '@dojo/shared'
import type { ExecutionResult } from '../../domain/practice/ports'
import type { ScrollCodeRunnerPort, ScrollRepositoryPort } from '../../domain/scrolls/ports'
import { ScrollLanguageNotAllowedError, ScrollNotFoundError, ScrollRunNotDeclaredError } from '../../domain/shared/errors'

function kindOf(result: ExecutionResult): RunResultKind {
  if (result.failure === 'unavailable') return 'unavailable'
  if (result.failure === 'compile') return 'compile'
  if (result.outputExceeded) return 'output-limit'
  if (result.timedOut) return 'timeout'
  return result.exitCode === 0 ? 'ok' : 'runtime'
}

const truncate = (text: string) => text.slice(0, MAX_RUN_OUTPUT_CHARS)

function toResponse(result: ExecutionResult): ScrollExecuteResponse {
  const kind = kindOf(result)
  return {
    kind,
    exitCode: kind === 'unavailable' ? null : result.exitCode,
    stdout: truncate(result.stdout),
    stderr: truncate(result.stderr),
    durationMs: Math.max(0, Math.round(result.executionTimeMs)),
  }
}

const UNAVAILABLE: ScrollExecuteResponse = { kind: 'unavailable', exitCode: null, stdout: '', stderr: '', durationMs: 0 }

export class ExecuteScrollCode {
  constructor(private readonly deps: { scrollRepo: ScrollRepositoryPort; runner: ScrollCodeRunnerPort }) {}

  async execute(slug: string, request: ScrollExecuteRequest): Promise<ScrollExecuteResponse> {
    const entry = await this.deps.scrollRepo.findBySlug(slug)
    if (entry?.status !== 'published') throw new ScrollNotFoundError(slug)
    const { manifest } = entry
    if (!manifest.capabilities.includes('run')) throw new ScrollRunNotDeclaredError(slug)
    if (!manifest.programmingLanguages.includes(request.language)) {
      throw new ScrollLanguageNotAllowedError(request.language)
    }

    try {
      return toResponse(await this.deps.runner.run(request))
    } catch {
      return UNAVAILABLE
    }
  }
}
