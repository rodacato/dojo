import { useState } from 'react'
import type { ExecutionResult } from '../../hooks/useEvaluationStream'

interface Props {
  result: ExecutionResult
}

export function ExecutionResultCard({ result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const passed = result.exitCode === 0
  const timedOut = result.timedOut

  const statusColor = passed ? 'text-success' : 'text-danger'
  const statusLabel = timedOut ? 'TIMED OUT' : passed ? 'TESTS PASSED' : 'TESTS FAILED'
  const statusIcon = passed ? '●' : '✕'

  return (
    <div className="mb-4 border border-border/40 rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface/50 hover:bg-surface transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs ${statusColor}`}>{statusIcon}</span>
          <span className={`font-mono text-xs uppercase tracking-wider ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <span className="text-muted text-[10px] font-mono">
          {result.executionTimeMs}ms
          <span className="ml-2">{expanded ? '▴' : '▾'}</span>
        </span>
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-border/30 space-y-2">
          {result.stdout && (
            <div>
              <p className="text-muted text-[10px] font-mono uppercase mb-1">stdout</p>
              <pre className="text-xs text-secondary bg-base rounded-sm p-2 overflow-x-auto max-h-40 overflow-y-auto font-mono">
                {result.stdout}
              </pre>
            </div>
          )}
          {result.stderr && (
            <div>
              <p className="text-danger text-[10px] font-mono uppercase mb-1">stderr</p>
              <pre className="text-xs text-danger/80 bg-base rounded-sm p-2 overflow-x-auto max-h-40 overflow-y-auto font-mono">
                {result.stderr}
              </pre>
            </div>
          )}
          <p className="text-muted text-[10px] font-mono">exit code: {result.exitCode}</p>
        </div>
      )}
    </div>
  )
}
