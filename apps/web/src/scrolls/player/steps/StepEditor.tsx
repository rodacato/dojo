import { useEffect, useState } from 'react'
import type { ExecuteStepResponse } from '@dojo/shared'
import { isPlaygroundData } from '@dojo/shared'
import { api } from '../../../lib/api'
import { runInIframe } from '../../../lib/iframeSandboxRunner'
import { CodeEditor, type CodeEditorLanguage } from '../../../components/ui/CodeEditor'
import type { StepComponentProps } from './types'
import { extractStepTitle } from './stepMeta'
import { MarkdownContent, stripLeadingH1 } from '../markdown'
import { OutputPanel, type OutputTabId } from './OutputPanel'
import { StatusChip, ExploredChip } from './verdict'
import { useSolution } from './useSolution'
import { useNudge, SenseiNudgePanel } from './SenseiNudge'

export function StepEditor({
  step,
  scrollSlug,
  language,
  isCompleted,
  onMarkComplete,
  onAdvance,
}: StepComponentProps) {
  const [code, setCode] = useState(step.starterCode ?? '')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecuteStepResponse | null>(null)
  const [tab, setTab] = useState<OutputTabId>('tests')
  const [showHint, setShowHint] = useState(false)

  const isIframeLang = language === 'javascript-dom'
  // Playground variant: a kata with `data.kind === "playground"`. The backend
  // runs the always-pass harness; the frontend hides verdict UI so the learner
  // experiences free exploration, not a graded exercise. See
  // docs/courses/curricula/ruby/ruby.md §2.3 for the local-experiment scope.
  const isPlayground = isPlaygroundData(step.data)
  const stepTitle = extractStepTitle(step)
  // The markdown still contains the H1; strip it so it isn't rendered twice.
  const instructionBody = stripLeadingH1(step.instruction)

  const solution = useSolution({
    scrollSlug,
    stepId: step.id,
    isCompleted,
    tab,
    isIframeLang,
  })
  const sensei = useNudge({ scrollSlug, stepId: step.id })

  useEffect(() => {
    setCode(step.starterCode ?? '')
    setResult(null)
    setShowHint(false)
    setTab('tests')
  }, [step.id, step.starterCode])

  const runCode = async () => {
    if (!step.testCode || running) return
    setRunning(true)
    setResult(null)
    try {
      const res = isIframeLang
        ? await runInIframe({ starterCode: code, testCode: step.testCode })
        : await api.executeStep({ code, testCode: step.testCode, language })
      setResult(res)
      // For playgrounds the Tests / Solution tabs are hidden — always show
      // Output. For katas, jump to Output on error so the learner sees the
      // failure, otherwise to Tests for the pass/fail breakdown.
      setTab(isPlayground || res.errorKind ? 'output' : 'tests')
      // Mark the step complete on pass — but DO NOT advance. The learner
      // stays on this step so the Solution tab (now unlocked) is reachable
      // before they hit Next. Auto-advancing here was hiding the solution
      // behind the next step.
      if (res.passed && !isCompleted) {
        onMarkComplete()
      }
    } catch {
      setResult({
        passed: false,
        output: 'Execution failed — could not reach the sandbox.',
        stdout: '',
        stderr: 'Network or server error while running your code.',
        testResults: [],
        errorKind: 'sandbox',
        errorMessage: "Couldn't reach the code sandbox. Try again in a moment.",
      })
      setTab('output')
    } finally {
      setRunning(false)
    }
  }

  const editorLanguage = (isIframeLang ? 'javascript-dom' : language) as CodeEditorLanguage

  return (
    // h-full fills <main> (flex-1 of the h-[100dvh] root) — no magic-number
    // calc. The old h-[calc(100vh-48px)] both double-counted the layout height
    // and subtracted 48px for a 56px (h-14) header, overflowing 8px on every
    // screen and ignoring mobile browser chrome.
    <div className="flex flex-col h-full">
      {/* Instruction — capped so the editor keeps usable height; min-h-0 lets
          it shrink on short phones instead of pushing the editor off-screen. */}
      <div className="px-4 sm:px-6 py-4 border-b border-border/40 overflow-y-auto max-h-[30vh] shrink-0">
        <h1 className="text-lg md:text-xl font-mono text-primary mb-3">
          {stepTitle}
        </h1>
        <MarkdownContent content={instructionBody} />
      </div>

      {/* Editor + Results */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 editor-focus-ring">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={editorLanguage}
          />
        </div>

        {/* Run button + status */}
        <div className="px-4 py-2 border-t border-border/40 bg-surface flex items-center gap-3 flex-wrap">
          <button
            onClick={runCode}
            disabled={running}
            className={`px-5 py-2 font-mono text-sm rounded transition-all duration-150 active:scale-95 ${
              running
                ? 'bg-muted/20 text-muted cursor-wait'
                : 'bg-accent text-bg hover:bg-accent/90'
            }`}
          >
            {running ? 'Running...' : isPlayground ? '↻ Try it' : '▶ Run'}
          </button>
          {isIframeLang && (
            <span className="text-xs text-muted font-mono">Runs in browser</span>
          )}
          {result && (isPlayground ? <ExploredChip /> : <StatusChip result={result} />)}
          {isCompleted && (
            <button
              onClick={onAdvance}
              className="px-4 py-2 bg-success/15 text-success border border-success/40 font-mono text-sm rounded transition-all duration-150 hover:bg-success/25 active:scale-95"
            >
              Next →
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            {result && !sensei.disabled && !isPlayground && (
              <button
                onClick={() => sensei.askSensei({ userCode: code, stdout: result.stdout, stderr: result.stderr })}
                disabled={sensei.loading}
                className="text-xs font-mono text-accent hover:text-accent/80 transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {sensei.loading ? '⌛ Thinking…' : '🥋 Ask the sensei'}
              </button>
            )}
            {step.hint && (
              <button
                onClick={() => setShowHint((v) => !v)}
                className="text-xs font-mono text-muted hover:text-secondary transition-colors"
              >
                {showHint ? '× Hide hint' : '💡 Show hint'}
              </button>
            )}
          </div>
        </div>

        {/* Hint panel */}
        {showHint && step.hint && (
          <div className="px-4 py-3 border-t border-border/40 bg-surface/40">
            <p className="text-xs font-mono text-muted uppercase tracking-wider mb-1">hint</p>
            <p className="text-sm text-secondary leading-relaxed">{step.hint}</p>
          </div>
        )}

        <SenseiNudgePanel
          nudge={sensei.nudge}
          error={sensei.error}
          feedback={sensei.feedback}
          onRate={sensei.rateNudge}
          onDismiss={sensei.dismiss}
        />

        <OutputPanel
          result={result}
          tab={tab}
          onTabChange={setTab}
          isCompleted={isCompleted}
          solutionCode={solution.solutionCode}
          alternativeApproach={solution.alternativeApproach}
          solutionError={solution.solutionError}
          onSolutionRetry={solution.retry}
          editorLanguage={editorLanguage}
          isPlayground={isPlayground}
        />
      </div>
    </div>
  )
}
