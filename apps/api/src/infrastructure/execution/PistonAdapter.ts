import { config } from '../../config'
import type { CodeExecutionPort, ExecutionResult } from '../../domain/practice/ports'

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  typescript: { language: 'typescript', version: '*' },
  javascript: { language: 'javascript', version: '*' },
  python: { language: 'python', version: '*' },
  ruby: { language: 'ruby', version: '*' },
  go: { language: 'go', version: '*' },
  rust: { language: 'rust', version: '*' },
  sql: { language: 'sqlite3', version: '*' },
}

export class PistonAdapter implements CodeExecutionPort {
  async execute(params: {
    language: string
    code: string
    testCode: string
    timeoutMs?: number
  }): Promise<ExecutionResult> {
    const langConfig = LANGUAGE_MAP[params.language.toLowerCase()]
    if (!langConfig) {
      return {
        stdout: '',
        stderr: `Unsupported language: ${params.language}`,
        exitCode: 1,
        timedOut: false,
        executionTimeMs: 0,
      }
    }

    const isSql = params.language.toLowerCase() === 'sql'
    const files = isSql
      ? [{ name: 'query.sql', content: `${params.testCode}\n${params.code}` }]
      : [
          { name: `solution.${ext(params.language)}`, content: params.code },
          { name: `test.${ext(params.language)}`, content: params.testCode },
        ]

    const runFile = isSql ? 'query.sql' : `test.${ext(params.language)}`
    const timeout = params.timeoutMs ?? config.PISTON_RUN_TIMEOUT

    const start = Date.now()

    try {
      const response = await fetch(`${config.PISTON_URL}/api/v2/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          files,
          run_timeout: timeout,
          compile_timeout: config.PISTON_COMPILE_TIMEOUT,
          compile_memory_limit: 256_000_000,
          run_memory_limit: 256_000_000,
          args: isSql ? [runFile] : [],
        }),
        signal: AbortSignal.timeout(timeout + 5000),
      })

      if (!response.ok) {
        return {
          stdout: '',
          stderr: `Piston error: ${response.status} ${response.statusText}`,
          exitCode: 1,
          timedOut: false,
          executionTimeMs: Date.now() - start,
        }
      }

      const result = (await response.json()) as {
        run: { stdout: string; stderr: string; code: number; signal: string | null }
        compile?: { stdout: string; stderr: string; code: number }
      }

      // If compilation failed, return compile error
      if (result.compile && result.compile.code !== 0) {
        return {
          stdout: result.compile.stdout,
          stderr: result.compile.stderr,
          exitCode: result.compile.code,
          timedOut: false,
          executionTimeMs: Date.now() - start,
        }
      }

      return {
        stdout: result.run.stdout,
        stderr: result.run.stderr,
        exitCode: result.run.code,
        timedOut: result.run.signal === 'SIGKILL',
        executionTimeMs: Date.now() - start,
      }
    } catch (err) {
      return {
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        exitCode: 1,
        timedOut: err instanceof Error && err.name === 'TimeoutError',
        executionTimeMs: Date.now() - start,
      }
    }
  }
}

function ext(language: string): string {
  switch (language.toLowerCase()) {
    case 'typescript': return 'ts'
    case 'javascript': return 'js'
    case 'python': return 'py'
    case 'ruby': return 'rb'
    case 'go': return 'go'
    case 'rust': return 'rs'
    default: return 'txt'
  }
}
