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

// Hardened Piston limits for untrusted anonymous input (spec 027 §4.6).
// Separate from config.PISTON_RUN_TIMEOUT so a later concurrency bump
// for kata doesn't accidentally widen the playground attack surface.
const PLAYGROUND_RUN_TIMEOUT_MS = 3_000
const PLAYGROUND_COMPILE_TIMEOUT_MS = 10_000
const PLAYGROUND_MEMORY_LIMIT = 128_000_000 // 128 MB, half of kata's 256 MB

export class PistonAdapter implements CodeExecutionPort {
  async run(params: {
    language: string
    version: string
    code: string
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

    const fileName = `main.${ext(params.language)}`
    const start = Date.now()

    try {
      const response = await fetch(`${config.PISTON_URL}/api/v2/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: langConfig.language,
          version: params.version,
          files: [{ name: fileName, content: params.code }],
          run_timeout: PLAYGROUND_RUN_TIMEOUT_MS,
          compile_timeout: PLAYGROUND_COMPILE_TIMEOUT_MS,
          compile_memory_limit: PLAYGROUND_MEMORY_LIMIT,
          run_memory_limit: PLAYGROUND_MEMORY_LIMIT,
        }),
        signal: AbortSignal.timeout(PLAYGROUND_RUN_TIMEOUT_MS + 5_000),
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
    // Combine solution + test into one file so all symbols are in scope.
    // Two-file mode loses stdout in Piston's TypeScript runtime.
    const combined = `${params.code}\n\n${params.testCode}`
    const runFile = isSql ? 'query.sql' : `test.${ext(params.language)}`
    const files = isSql
      ? [{ name: 'query.sql', content: buildSqlScript(params.code, params.testCode) }]
      : [{ name: runFile, content: combined }]
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
          run_timeout: config.PISTON_RUN_TIMEOUT,
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

// SQL testCode convention:
// - testCode defines the schema, seed, and validation assertions
// - A `-- @SOLUTION_FILE` marker is the placeholder for the learner's query
// - The adapter wraps the learner's code as `CREATE VIEW solution AS <code>;`
//   so assertions can reference `solution` uniformly.
// If the marker is absent, fall back to appending the learner's code after
// the testCode (the legacy behavior, used by ad-hoc SQL harnesses).
export function buildSqlScript(userCode: string, testCode: string): string {
  const MARKER = '-- @SOLUTION_FILE'
  if (!testCode.includes(MARKER)) {
    return `${testCode}\n${userCode}`
  }
  const userBody = userCode.trim().replace(/;+\s*$/, '')
  const wrapped = `DROP VIEW IF EXISTS solution;\nCREATE VIEW solution AS\n${userBody};`
  return testCode.replace(MARKER, wrapped)
}
