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
    const runTimeoutMs = PLAYGROUND_RUN_TIMEOUT_MS
    const langConfig = LANGUAGE_MAP[params.language.toLowerCase()]
    if (!langConfig) {
      return {
        stdout: '',
        stderr: `Unsupported language: ${params.language}`,
        exitCode: 1,
        timedOut: false,
        outputExceeded: false,
        runTimeoutMs,
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
        const body = await response.text().catch(() => '')
        return {
          stdout: '',
          stderr: formatPistonHttpError(response.status, response.statusText, body),
          exitCode: 1,
          timedOut: false,
          outputExceeded: false,
          runTimeoutMs,
          executionTimeMs: Date.now() - start,
        }
      }

      const result = (await response.json()) as PistonExecuteResponse

      if (result.compile && result.compile.code !== 0) {
        return {
          stdout: result.compile.stdout,
          stderr: scrubPistonNoise(result.compile.stderr),
          exitCode: result.compile.code ?? 1,
          timedOut: false,
          outputExceeded: false,
          runTimeoutMs,
          executionTimeMs: Date.now() - start,
        }
      }

      return classifyRunResult(result.run, runTimeoutMs, Date.now() - start)
    } catch (err) {
      return {
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        exitCode: 1,
        timedOut: err instanceof Error && err.name === 'TimeoutError',
        outputExceeded: false,
        runTimeoutMs,
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
    const runTimeoutMs = config.PISTON_RUN_TIMEOUT
    const langConfig = LANGUAGE_MAP[params.language.toLowerCase()]
    if (!langConfig) {
      return {
        stdout: '',
        stderr: `Unsupported language: ${params.language}`,
        exitCode: 1,
        timedOut: false,
        outputExceeded: false,
        runTimeoutMs,
        executionTimeMs: 0,
      }
    }

    const isSql = params.language.toLowerCase() === 'sql'
    const isRust = params.language.toLowerCase() === 'rust'
    const isGo = params.language.toLowerCase() === 'go'
    // Combine solution + test into one file so all symbols are in scope.
    // Two-file mode loses stdout in Piston's TypeScript runtime.
    // Rust: a learner-written `fn main` is renamed to `fn __learner_main` so
    // the test harness owns the real entry point. Learner code stays at the
    // top level of the file (same-file items are accessible without `pub` —
    // a `mod` wrapper was tried first and failed on module privacy, validated
    // against real rustc 1.68.2 at the L1 smoke). Zero line-number offset.
    // Playground testCode calls `__learner_main()` to run the learner's main.
    // Go: the order is inverted — Go demands `package main` + one import block
    // at the file top and rejects unused imports, so the learner's code can't
    // lead. The testCode is the full file (package, imports, harness helpers,
    // a `// __DOJO_SOLUTION__` marker, then `func main`); the learner's code is
    // spliced in at the marker. A replacement function avoids `$`-pattern
    // surprises from arbitrary learner code. Validated against Piston Go
    // 1.16.2 (S031): the harness hand-rolls JSON because `encoding/json`
    // crashes the sandbox keeper there.
    let combined: string
    if (isRust) {
      combined = `${params.code.replace(/\bfn\s+main\s*\(/g, 'fn __learner_main(')}\n\n${params.testCode}`
    } else if (isGo) {
      combined = params.testCode.replace('// __DOJO_SOLUTION__', () => params.code)
    } else {
      combined = `${params.code}\n\n${params.testCode}`
    }
    // Rust file is named main.rs so rustc's error paths match the scroll prose
    // ("main.rs:LINE"); Go is main.go for the same reason; others keep test.*.
    let runFile: string
    if (isSql) {
      runFile = 'query.sql'
    } else if (isRust) {
      runFile = 'main.rs'
    } else if (isGo) {
      runFile = 'main.go'
    } else {
      runFile = `test.${ext(params.language)}`
    }
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
        const body = await response.text().catch(() => '')
        return {
          stdout: '',
          stderr: formatPistonHttpError(response.status, response.statusText, body),
          exitCode: 1,
          timedOut: false,
          outputExceeded: false,
          runTimeoutMs,
          executionTimeMs: Date.now() - start,
        }
      }

      const result = (await response.json()) as PistonExecuteResponse

      // If compilation failed, return compile error
      if (result.compile && result.compile.code !== 0) {
        return {
          stdout: result.compile.stdout,
          stderr: scrubPistonNoise(result.compile.stderr),
          // Piston reports a null code when the compile stage dies on a
          // signal (observed with rustc); normalize to 1.
          exitCode: result.compile.code ?? 1,
          timedOut: false,
          outputExceeded: false,
          runTimeoutMs,
          executionTimeMs: Date.now() - start,
        }
      }

      return classifyRunResult(result.run, runTimeoutMs, Date.now() - start)
    } catch (err) {
      return {
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        exitCode: 1,
        timedOut: err instanceof Error && err.name === 'TimeoutError',
        outputExceeded: false,
        runTimeoutMs,
        executionTimeMs: Date.now() - start,
      }
    }
  }
}

interface PistonRunResult {
  stdout: string
  stderr: string
  code: number | null
  signal: string | null
  /**
   * Piston `status` codes for the run stage that we react to:
   *   "OL" — stdout length exceeded the per-stream cap
   *   "EL" — stderr length exceeded the per-stream cap
   *   "TO" — timeout hit
   * Anything else (or `null`) means the run finished normally — the exit
   * code or signal carry the result.
   */
  status?: string | null
  message?: string | null
}

interface PistonExecuteResponse {
  run: PistonRunResult
  compile?: { stdout: string; stderr: string; code: number }
}

// Both adapter entrypoints classify the run result the same way; centralise
// it so the OL/EL distinction lives in exactly one place. Without this the
// caller can't tell "raise the output cap, the program was fine" from
// "the program is slow or stuck" — both arrive as SIGKILL from Piston and
// the dojo harness routinely overshoots the default 1024-byte cap.
function classifyRunResult(
  run: PistonRunResult,
  runTimeoutMs: number,
  executionTimeMs: number,
): ExecutionResult {
  const outputExceeded = run.status === 'OL' || run.status === 'EL'
  return {
    stdout: run.stdout,
    stderr: run.stderr,
    exitCode: run.code ?? 1,
    timedOut: !outputExceeded && run.signal === 'SIGKILL',
    outputExceeded,
    runTimeoutMs,
    executionTimeMs,
  }
}

// Piston returns 400 with a JSON body { message: "..." } when it rejects
// the payload (e.g., run_timeout above MAX_RUN_TIMEOUT, unknown runtime).
// Surfacing the body is the only way to tell sandbox-unreachable apart
// from sandbox-said-no-because-X without shell access to the container.
function formatPistonHttpError(status: number, statusText: string, body: string): string {
  const trimmed = body.trim()
  if (!trimmed) {
    return `Piston error: ${status} ${statusText}`
  }
  let detail = trimmed
  try {
    const parsed = JSON.parse(trimmed) as { message?: string }
    if (typeof parsed.message === 'string' && parsed.message.length > 0) {
      detail = parsed.message
    }
  } catch {
    // Body is plain text — surface as-is.
  }
  return `Piston error: ${status} ${statusText} — ${detail}`
}

// Piston's runner appends its own noise to compile stderr when the compile
// stage fails (its run script still tries to chmod the missing binary, and
// the sandbox keeper logs its signal). Neither line is the learner's error.
function scrubPistonNoise(stderr: string): string {
  return stderr
    .split('\n')
    .filter(
      (line) =>
        !line.startsWith('Sandbox keeper received fatal signal') &&
        !line.startsWith("chmod: cannot access 'binary'"),
    )
    .join('\n')
    .trimEnd()
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
