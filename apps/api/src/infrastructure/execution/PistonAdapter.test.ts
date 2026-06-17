import { describe, expect, it, vi, beforeEach } from 'vitest'
import { PistonAdapter, buildSqlScript } from './PistonAdapter'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('PistonAdapter', () => {
  let adapter: PistonAdapter

  beforeEach(() => {
    adapter = new PistonAdapter()
    mockFetch.mockReset()
  })

  it('returns error for unsupported language', async () => {
    const result = await adapter.execute({
      language: 'cobol',
      code: 'DISPLAY "HELLO"',
      testCode: 'test',
    })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Unsupported language')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('maps successful execution result', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        run: { stdout: 'All tests passed\n', stderr: '', code: 0, signal: null },
      }),
    })

    const result = await adapter.execute({
      language: 'python',
      code: 'print("hello")',
      testCode: 'assert True',
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toBe('All tests passed\n')
    expect(result.timedOut).toBe(false)
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('renames a Rust learner main to __learner_main and names the file main.rs', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        run: { stdout: 'ok', stderr: '', code: 0, signal: null },
      }),
    })

    await adapter.execute({
      language: 'rust',
      code: 'fn helper() -> i32 { 1 }\n\nfn main() {\n    println!("learner");\n}',
      testCode: 'fn main() { _t("explored", || _eq(true, true)); }',
    })

    const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string)
    const file = body.files[0]
    expect(file.name).toBe('main.rs')
    // Learner main is renamed; the harness's fn main is the only entry point.
    expect(file.content).toContain('fn __learner_main(')
    expect(file.content).toContain('fn helper() -> i32')
    expect(file.content.match(/\bfn\s+main\s*\(/g)).toHaveLength(1)
    expect(file.content.indexOf('fn __learner_main(')).toBeLessThan(
      file.content.indexOf('_t("explored"'),
    )
  })

  it('does not rewrite non-Rust languages', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        run: { stdout: 'ok', stderr: '', code: 0, signal: null },
      }),
    })

    await adapter.execute({
      language: 'python',
      code: 'def f():\n    return 1',
      testCode: 'assert f() == 1',
    })

    const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string)
    expect(body.files[0].content).toBe('def f():\n    return 1\n\nassert f() == 1')
  })

  it('detects compilation failure', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        compile: { stdout: '', stderr: 'error: expected semicolon', code: 1 },
        run: { stdout: '', stderr: '', code: 0, signal: null },
      }),
    })

    const result = await adapter.execute({
      language: 'rust',
      code: 'fn main() { x }',
      testCode: 'test',
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('expected semicolon')
  })

  it('detects timeout via SIGKILL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        run: { stdout: '', stderr: 'Killed', code: 137, signal: 'SIGKILL', status: 'TO' },
      }),
    })

    const result = await adapter.execute({
      language: 'python',
      code: 'while True: pass',
      testCode: 'test',
    })

    expect(result.timedOut).toBe(true)
    expect(result.outputExceeded).toBe(false)
  })

  it('classifies status=OL (stdout cap) as outputExceeded, not timedOut', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        run: {
          stdout: '',
          stderr: 'Sandbox keeper received fatal signal 6\n',
          code: null,
          signal: 'SIGKILL',
          status: 'OL',
          message: 'stdout length exceeded',
        },
      }),
    })

    const result = await adapter.execute({
      language: 'ruby',
      code: '',
      testCode: '1.upto(100000) { puts "x" }',
    })

    expect(result.outputExceeded).toBe(true)
    expect(result.timedOut).toBe(false)
  })

  it('classifies status=EL (stderr cap) as outputExceeded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        run: {
          stdout: '',
          stderr: 'Sandbox keeper received fatal signal 6\n',
          code: null,
          signal: 'SIGKILL',
          status: 'EL',
        },
      }),
    })

    const result = await adapter.execute({
      language: 'ruby',
      code: '',
      testCode: '',
    })

    expect(result.outputExceeded).toBe(true)
    expect(result.timedOut).toBe(false)
  })

  it('surfaces runTimeoutMs from config so callers can format the cap correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        run: { stdout: 'hi', stderr: '', code: 0, signal: null },
      }),
    })

    const result = await adapter.execute({
      language: 'python',
      code: '',
      testCode: 'print("hi")',
    })

    expect(result.runTimeoutMs).toBeGreaterThan(0)
  })

  it('handles Piston HTTP error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => '',
    })

    const result = await adapter.execute({
      language: 'javascript',
      code: '1+1',
      testCode: 'test',
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Piston error: 500')
  })

  it('surfaces Piston error body when present', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => '{"message":"run_timeout exceeds maximum"}',
    })

    const result = await adapter.execute({
      language: 'javascript',
      code: '1+1',
      testCode: 'test',
    })

    expect(result.stderr).toContain('run_timeout exceeds maximum')
  })

  it('handles network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'))

    const result = await adapter.execute({
      language: 'javascript',
      code: '1+1',
      testCode: 'test',
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Connection refused')
  })

  it('builds SQL request correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        run: { stdout: 'Alice|95000\n', stderr: '', code: 0, signal: null },
      }),
    })

    await adapter.execute({
      language: 'sql',
      code: 'SELECT * FROM users;',
      testCode: 'CREATE TABLE users(name TEXT, salary INT);',
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.language).toBe('sqlite3')
    expect(body.files[0].content).toContain('CREATE TABLE')
    expect(body.files[0].content).toContain('SELECT * FROM users')
  })
})

describe('buildSqlScript', () => {
  it('substitutes @SOLUTION_FILE marker with a wrapped CREATE VIEW', () => {
    const testCode = `CREATE TABLE t (x INT);
-- @SOLUTION_FILE
SELECT * FROM solution;`
    const script = buildSqlScript('SELECT x FROM t;', testCode)

    expect(script).toContain('DROP VIEW IF EXISTS solution')
    expect(script).toContain('CREATE VIEW solution AS\nSELECT x FROM t')
    expect(script).not.toContain('@SOLUTION_FILE')
  })

  it('strips trailing semicolons from user code before wrapping', () => {
    const script = buildSqlScript('SELECT 1;;;  \n', '-- @SOLUTION_FILE')
    expect(script).toContain('CREATE VIEW solution AS\nSELECT 1;')
    expect(script).not.toContain('SELECT 1;;')
  })

  it('falls back to concat when marker is missing', () => {
    const script = buildSqlScript('SELECT 1;', 'CREATE TABLE t(x INT);')
    expect(script).toBe('CREATE TABLE t(x INT);\nSELECT 1;')
  })
})
