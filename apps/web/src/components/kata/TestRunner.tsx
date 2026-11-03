import { useState } from 'react'
import { api, ApiError, type TestRun } from '../../lib/api'
import { Button } from '../ui/Button'

function runFailureMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) return 'Too many runs. Wait a minute, then run again.'
  if (err instanceof ApiError && (err.status === 408 || err.status === 409)) return 'Time is up. The tests can no longer run.'
  return "The tests didn't run. Try again."
}

function runSummary(run: TestRun): string {
  if (run.unavailable) return 'The sandbox is not available right now. Your answer is still graded.'
  if (run.timedOut) return 'Timed out. Look for a loop that never ends.'
  return run.passed ? 'All tests pass.' : 'Some tests fail.'
}

function runTone(run: TestRun | null): string {
  if (!run || run.unavailable) return 'text-primary'
  return run.passed ? 'text-success-text' : 'text-danger-text'
}

function idleText(gated: boolean): string {
  return gated ? 'Your fix has to pass the tests.' : 'Run the tests before you submit.'
}

/** Runs the kata's tests against the editor's code; a bug-fix kata also gates the verdict on them. */
export function TestRunner({
  sessionId,
  code,
  gated,
  disabled,
}: Readonly<{ sessionId: string; code: string; gated: boolean; disabled: boolean }>) {
  const [running, setRunning] = useState(false)
  const [run, setRun] = useState<TestRun | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  async function runTests() {
    setRunning(true)
    setFailure(null)
    try {
      setRun(await api.runTests(sessionId, code))
    } catch (err) {
      setRun(null)
      setFailure(runFailureMessage(err))
    } finally {
      setRunning(false)
    }
  }

  return (
    <section aria-label="Tests" className="shrink-0 border-t border-border bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <p aria-live="polite" className={`min-w-0 text-sm ${failure ? 'text-danger-text' : runTone(run)}`}>
          {failure ?? (run ? runSummary(run) : idleText(gated))}
        </p>
        <Button variant="ghost" size="lg" onClick={runTests} loading={running} disabled={disabled || running || !code.trim()}>
          {running ? 'Running…' : 'Run tests'}
        </Button>
      </div>
      {run?.output && (
        <pre className="max-h-24 md:max-h-40 overflow-y-auto border-t border-border px-4 py-2 font-mono text-xs leading-relaxed text-secondary whitespace-pre-wrap wrap-anywhere">
          {run.output}
        </pre>
      )}
    </section>
  )
}
