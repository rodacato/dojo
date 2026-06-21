import type { ReactNode } from 'react'
import type { ExecuteStepResponse } from '@dojo/shared'
import { labelForErrorKind } from './verdict'
import { PlainMarkdown } from '../markdown'

export type OutputTabId = 'tests' | 'output' | 'solution'

export function OutputPanel({
  result,
  tab,
  onTabChange,
  isCompleted,
  solutionCode,
  alternativeApproach,
  solutionError,
  onSolutionRetry,
  editorLanguage,
  isPlayground,
}: Readonly<{
  result: ExecuteStepResponse | null
  tab: OutputTabId
  onTabChange: (t: OutputTabId) => void
  isCompleted: boolean
  solutionCode: string | null
  alternativeApproach: string | null
  solutionError: string | null
  onSolutionRetry: () => void
  editorLanguage: string
  isPlayground: boolean
}>) {
  // Playgrounds: only the Output tab. No Tests (the harness is trivially-true
  // so the test list is noise), no Solution (no canonical answer to a free
  // exploration). The current `tab` may carry an outdated value if the step
  // changed, but the render forces Output anyway.
  if (isPlayground) {
    return (
      <div className="border-t border-border/40 bg-surface/50 flex flex-col min-h-48 max-h-[34vh]">
        <div className="flex items-center gap-1 px-3 pt-2 border-b border-border/30">
          <TabButton active={true} onClick={() => onTabChange('output')}>
            Output
            {result?.errorKind && <span className="ml-1.5 text-warning">●</span>}
          </TabButton>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {result ? (
            <OutputTab result={result} />
          ) : (
            <p className="text-xs font-mono text-muted/60">
              Try the code above. Change things. Watch the output.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-border/40 bg-surface/50 flex flex-col min-h-48 max-h-[34vh]">
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-border/30">
        <TabButton active={tab === 'tests'} onClick={() => onTabChange('tests')}>
          Tests
          {result && result.testResults.length > 0 && (
            <span className="ml-1.5 text-muted">
              ({result.testResults.filter((t) => t.passed).length}/{result.testResults.length})
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'output'} onClick={() => onTabChange('output')}>
          Output
          {result?.errorKind && <span className="ml-1.5 text-warning">●</span>}
        </TabButton>
        <TabButton
          active={tab === 'solution'}
          disabled={!isCompleted}
          title={isCompleted ? undefined : 'Pass the step to unlock the reference solution'}
          onClick={() => onTabChange('solution')}
        >
          Solution {!isCompleted && <span className="ml-1 text-muted/60">🔒</span>}
        </TabButton>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === 'solution' ? (
          <SolutionTab
            isCompleted={isCompleted}
            solutionCode={solutionCode}
            alternativeApproach={alternativeApproach}
            solutionError={solutionError}
            onRetry={onSolutionRetry}
            language={editorLanguage}
          />
        ) : result ? (
          tab === 'tests' ? (
            <TestsTab result={result} />
          ) : (
            <OutputTab result={result} />
          )
        ) : (
          <p className="text-xs font-mono text-muted/60">
            Run your code to see test results and output.
          </p>
        )}
      </div>
    </div>
  )
}

function SolutionTab({
  isCompleted,
  solutionCode,
  alternativeApproach,
  solutionError,
  onRetry,
  language,
}: Readonly<{
  isCompleted: boolean
  solutionCode: string | null
  alternativeApproach: string | null
  solutionError: string | null
  onRetry: () => void
  language: string
}>) {
  if (!isCompleted) {
    return (
      <p className="text-xs font-mono text-muted/60">
        Pass the step to see one reference solution.
      </p>
    )
  }
  if (solutionError) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-xs font-mono text-danger/80">
          Couldn&apos;t load the solution: {solutionError}
        </p>
        <button
          onClick={onRetry}
          className="text-xs font-mono text-accent hover:text-accent/80 transition-colors shrink-0"
        >
          ↻ Retry
        </button>
      </div>
    )
  }
  if (solutionCode === null) {
    return <p className="text-xs font-mono text-muted/60">Loading solution...</p>
  }
  if (solutionCode.trim() === '') {
    return (
      <p className="text-xs font-mono text-muted/60">
        No reference solution recorded for this step.
      </p>
    )
  }
  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs font-mono text-muted mb-2">
          One way to write this. Yours might be different — both can be right.
        </p>
        <pre className="text-xs font-mono text-secondary whitespace-pre overflow-x-auto bg-bg/40 rounded p-3 border border-border/30">
          <code className={`language-${language}`}>{solutionCode}</code>
        </pre>
      </section>
      {alternativeApproach && (
        <details className="border-t border-border/30 pt-3">
          <summary className="cursor-pointer text-xs font-mono text-muted hover:text-secondary transition-colors">
            Alternative approach
          </summary>
          <div className="mt-2">
            <PlainMarkdown content={alternativeApproach} />
          </div>
        </details>
      )}
    </div>
  )
}

function TabButton({
  active,
  children,
  onClick,
  disabled,
  title,
}: Readonly<{
  active: boolean
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
}>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3.5 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px ${
        active
          ? 'text-primary border-accent'
          : disabled
            ? 'text-muted/40 border-transparent cursor-not-allowed'
            : 'text-muted border-transparent hover:text-secondary'
      }`}
    >
      {children}
    </button>
  )
}

function TestsTab({ result }: Readonly<{ result: ExecuteStepResponse }>) {
  if (result.errorKind) {
    return (
      <ErrorCard
        kind={result.errorKind}
        message={result.errorMessage ?? labelForErrorKind(result.errorKind)}
        detail={result.stderr || result.output}
      />
    )
  }
  if (result.testResults.length === 0) {
    return (
      <p className="text-xs font-mono text-muted">
        No tests recorded. Check the Output tab for any console messages.
      </p>
    )
  }
  return (
    <div className="space-y-1.5">
      {result.testResults.map((tr, i) => (
        <div
          key={i}
          className={`text-xs font-mono flex items-start gap-2 animate-test-row ${
            tr.passed ? 'text-success' : 'text-danger'
          }`}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <span className="shrink-0">{tr.passed ? '✓' : '✗'}</span>
          <div className="min-w-0 flex-1">
            <div className="break-words">{tr.name}</div>
            {tr.message && !tr.passed && (
              <div className="text-muted text-xs mt-0.5 break-words">{tr.message}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function OutputTab({ result }: Readonly<{ result: ExecuteStepResponse }>) {
  const hasStdout = result.stdout.trim().length > 0
  const hasStderr = result.stderr.trim().length > 0
  if (!hasStdout && !hasStderr) {
    return (
      <p className="text-xs font-mono text-muted/60">
        No output. Add <code className="text-accent">console.log(...)</code> calls to inspect values.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {hasStdout && (
        <div>
          <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">stdout</p>
          <pre className="text-xs font-mono text-secondary whitespace-pre-wrap break-words">
            {result.stdout}
          </pre>
        </div>
      )}
      {hasStderr && (
        <div>
          <p className="text-xs font-mono text-danger/80 uppercase tracking-widest mb-1">stderr</p>
          <pre className="text-xs font-mono text-danger/90 whitespace-pre-wrap break-words">
            {result.stderr}
          </pre>
        </div>
      )}
    </div>
  )
}

function ErrorCard({
  kind,
  message,
  detail,
}: Readonly<{
  kind: NonNullable<ExecuteStepResponse['errorKind']>
  message: string
  detail: string
}>) {
  const trimmed = detail.trim()
  return (
    <div className="p-3 border border-warning/40 bg-warning/5 rounded-sm">
      <p className="text-xs font-mono uppercase tracking-widest text-warning mb-1.5">
        ⚠ {labelForErrorKind(kind)}
      </p>
      <p className="text-sm text-secondary mb-2">{message}</p>
      {trimmed && (
        <pre className="text-xs font-mono text-muted/80 whitespace-pre-wrap break-words border-t border-warning/20 pt-2 mt-2 max-h-32 overflow-y-auto">
          {trimmed}
        </pre>
      )}
    </div>
  )
}
