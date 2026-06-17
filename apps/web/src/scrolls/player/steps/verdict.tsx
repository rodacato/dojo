import type { ExecuteStepResponse } from '@dojo/shared'

export function labelForErrorKind(kind: NonNullable<ExecuteStepResponse['errorKind']>): string {
  switch (kind) {
    case 'sandbox': return 'Sandbox unavailable'
    case 'timeout': return 'Timed out'
    case 'compile': return 'Compile error'
    case 'runtime': return 'Runtime error'
    case 'output-exceeded': return 'Too much output'
  }
}

export function StatusChip({ result }: { result: ExecuteStepResponse }) {
  if (result.errorKind) {
    return (
      <span className="text-sm font-mono text-warning animate-status-reveal">
        ⚠ {labelForErrorKind(result.errorKind)}
      </span>
    )
  }
  if (result.passed) {
    return (
      <span className="text-sm font-mono text-success animate-status-reveal">
        ✓ All tests passed
      </span>
    )
  }
  const failed = result.testResults.filter((t) => !t.passed).length
  const total = result.testResults.length
  return (
    <span className="text-sm font-mono text-danger animate-status-reveal">
      ✗ {failed} of {total} test{total === 1 ? '' : 's'} failed
    </span>
  )
}

// Replaces StatusChip in the playground variant. Verdict is irrelevant here
// (the harness is trivially-true) but Maya's interaction-teaches contract
// requires *some* feedback that the run registered — otherwise the learner
// runs code and sees no acknowledgement, which reads as broken.
export function ExploredChip() {
  return (
    <span className="text-sm font-mono text-secondary animate-status-reveal">
      ↻ explored
    </span>
  )
}
