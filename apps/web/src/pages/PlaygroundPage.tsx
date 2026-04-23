import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { api, ApiError } from '../lib/api'
import { CodeEditor } from '../components/ui/CodeEditor'
import { LogoWordmark } from '../components/Logo'
import { TurnstileWidget, type TurnstileHandle } from '../components/ui/TurnstileWidget'
import { useAuth } from '../context/AuthContext'
import { trackEvent } from '../lib/metrics'
import { TURNSTILE_SITE_KEY } from '../lib/config'

// Source of truth for the dropdowns. Keep in sync with
// scripts/piston-reprovision.sh — see spec 027 §1.4.
interface RuntimeSpec {
  label: string
  language: string
  editorLanguage: EditorLanguage
  versions: {
    default: string
    advanced: string[]
  }
  starterCode: string
}

type EditorLanguage = NonNullable<Parameters<typeof CodeEditor>[0]['language']>

const RUNTIMES: readonly RuntimeSpec[] = [
  {
    label: 'TypeScript',
    language: 'typescript',
    editorLanguage: 'typescript',
    versions: { default: '5.0.3', advanced: [] },
    starterCode: `const greeting: string = "dojo_"\nconsole.log(greeting)\n`,
  },
  {
    label: 'Python',
    language: 'python',
    editorLanguage: 'python',
    versions: { default: '3.12.0', advanced: ['3.10.0'] },
    starterCode: `print("dojo_")\n`,
  },
  {
    label: 'Go',
    language: 'go',
    editorLanguage: 'javascript',
    versions: { default: '1.16.2', advanced: [] },
    starterCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("dojo_")\n}\n`,
  },
  {
    label: 'Ruby',
    language: 'ruby',
    editorLanguage: 'javascript',
    versions: { default: '3.0.1', advanced: [] },
    starterCode: `puts "dojo_"\n`,
  },
  {
    label: 'Rust',
    language: 'rust',
    editorLanguage: 'javascript',
    versions: { default: '1.68.2', advanced: [] },
    starterCode: `fn main() {\n    println!("dojo_");\n}\n`,
  },
  {
    label: 'SQL',
    language: 'sql',
    editorLanguage: 'sql',
    versions: { default: '3.36.0', advanced: [] },
    starterCode: `SELECT 'dojo_' AS greeting;\n`,
  },
] as const

interface RunState {
  status: 'idle' | 'running' | 'ok' | 'error'
  stdout: string
  stderr: string
  exitCode: number | null
  runtimeMs: number | null
  errorMessage: string | null
}

const INITIAL_RUN: RunState = {
  status: 'idle',
  stdout: '',
  stderr: '',
  exitCode: null,
  runtimeMs: null,
  errorMessage: null,
}

export function PlaygroundPage() {
  const { language: urlLanguage } = useParams<{ language?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const initialRuntime = findRuntime(urlLanguage) ?? RUNTIMES[0]!
  const [selectedLanguage, setSelectedLanguage] = useState(initialRuntime.language)
  const [selectedVersion, setSelectedVersion] = useState(initialRuntime.versions.default)
  const [code, setCode] = useState(initialRuntime.starterCode)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [run, setRun] = useState<RunState>(INITIAL_RUN)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileHandle>(null)

  const runtime = useMemo(
    () => RUNTIMES.find((r) => r.language === selectedLanguage) ?? RUNTIMES[0]!,
    [selectedLanguage],
  )
  const availableVersions = useMemo(() => {
    const { default: def, advanced } = runtime.versions
    return showAdvanced ? [def, ...advanced] : [def]
  }, [runtime, showAdvanced])

  const requiresTurnstile = Boolean(TURNSTILE_SITE_KEY)
  const runDisabled =
    run.status === 'running' ||
    code.trim().length === 0 ||
    (requiresTurnstile && !turnstileToken)

  function changeLanguage(next: string): void {
    const nextRuntime = RUNTIMES.find((r) => r.language === next)
    if (!nextRuntime) return
    setSelectedLanguage(next)
    setSelectedVersion(nextRuntime.versions.default)
    setCode(nextRuntime.starterCode)
    setRun(INITIAL_RUN)
    navigate(`/playground/${next}`, { replace: true })
  }

  async function handleRun(): Promise<void> {
    if (run.status === 'running') return
    if (requiresTurnstile && !turnstileToken) {
      setRun({
        ...INITIAL_RUN,
        status: 'error',
        errorMessage: 'Bot check is still loading. Try again in a moment.',
      })
      return
    }
    setRun({ ...INITIAL_RUN, status: 'running' })
    try {
      const result = await api.playground.run({
        language: selectedLanguage,
        version: selectedVersion,
        code,
        ...(turnstileToken ? { turnstileToken } : {}),
      })
      setRun({
        status: result.exitCode === 0 ? 'ok' : 'error',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        runtimeMs: result.runtimeMs,
        errorMessage: null,
      })
      trackEvent('playground_run', {
        language: selectedLanguage,
        version: selectedVersion,
        exitCode: result.exitCode,
        runtimeMs: result.runtimeMs,
        authed: Boolean(user),
        codeChars: code.length,
      })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? describeApiError(err)
          : err instanceof Error
            ? err.message
            : 'Run failed.'
      setRun({ ...INITIAL_RUN, status: 'error', errorMessage: message })
      trackEvent('playground_run', {
        language: selectedLanguage,
        version: selectedVersion,
        exitCode: null,
        authed: Boolean(user),
        error: err instanceof ApiError ? err.message : 'unknown',
      })
    } finally {
      // Turnstile tokens are single-use server-side. Reset the widget
      // so the next run has a fresh token ready.
      setTurnstileToken(null)
      turnstileRef.current?.reset()
    }
  }

  function handleCtaClick(location: 'topbar' | 'banner' | 'footer'): void {
    trackEvent('playground_cta_click', {
      location,
      authed: Boolean(user),
      language: selectedLanguage,
    })
  }

  const ctaHref = user ? '/start' : '/'

  return (
    <div className="h-screen bg-base text-primary flex flex-col overflow-hidden">
      {/* Header. Authed users get chrome from the sidebar, so the logo
          + Dashboard chip collapse into a single inline CTA line. */}
      {user ? (
        <header className="flex items-center justify-between gap-4 px-4 py-1.5 border-b border-border/30 shrink-0 text-[11px] font-mono text-muted">
          <span className="text-muted/70">playground</span>
          <Link
            to={ctaHref}
            onClick={() => handleCtaClick('banner')}
            className="hover:text-secondary transition-colors truncate"
          >
            like running code? <span className="text-accent">practice with a kata →</span>
          </Link>
          <span className="shrink-0 text-muted/40">sandbox · not graded</span>
        </header>
      ) : (
        <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border/30 shrink-0">
          <Link to="/" className="shrink-0">
            <LogoWordmark />
          </Link>
          <Link
            to={ctaHref}
            onClick={() => handleCtaClick('banner')}
            className="text-muted text-[11px] font-mono hover:text-secondary transition-colors hidden md:inline truncate"
          >
            like running code? <span className="text-accent">practice with a kata →</span>
          </Link>
          <Link
            to={ctaHref}
            onClick={() => handleCtaClick('topbar')}
            className="text-[11px] font-mono text-secondary hover:text-primary transition-colors px-2.5 py-1 border border-border/40 rounded-sm hover:border-accent/50 shrink-0"
          >
            Sign in
          </Link>
        </header>
      )}

      {/* Slim controls bar */}
      <div className="flex items-center flex-wrap gap-2 px-4 py-1.5 border-b border-border/20 bg-surface/30 shrink-0">
        <select
          aria-label="language"
          value={selectedLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          className="bg-base border border-border/40 rounded-sm px-2 py-0.5 text-primary text-xs font-mono focus:outline-none focus:border-accent"
        >
          {RUNTIMES.map((r) => (
            <option key={r.language} value={r.language}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          aria-label="version"
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className="bg-base border border-border/40 rounded-sm px-2 py-0.5 text-primary text-xs font-mono focus:outline-none focus:border-accent"
        >
          {availableVersions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {runtime.versions.advanced.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-muted text-[10px] font-mono hover:text-secondary transition-colors"
          >
            {showAdvanced ? '— hide older' : '+ older'}
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {run.runtimeMs !== null && run.status !== 'running' && (
            <span className="text-muted text-[10px] font-mono">
              {run.runtimeMs}ms · exit {run.exitCode}
            </span>
          )}
          <button
            type="button"
            onClick={handleRun}
            disabled={runDisabled}
            className="px-3 py-1 bg-accent text-primary font-mono text-xs rounded-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {run.status === 'running' ? 'running...' : '▶ run'}
          </button>
        </div>
      </div>

      {/* Editor + output side-by-side (VSCode feel). Stacks vertically on
          mobile; the Separator handle is draggable in both directions. */}
      <div className="flex-1 min-h-0">
        <PanelGroup orientation="horizontal" className="h-full hidden md:flex">
          <Panel defaultSize={62} minSize={30}>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={runtime.editorLanguage}
              placeholder="write some code and hit run"
            />
          </Panel>
          <PanelResizeHandle className="w-px bg-border hover:bg-accent/50 cursor-col-resize transition-colors" />
          <Panel defaultSize={38} minSize={20}>
            <OutputPane run={run} />
          </Panel>
        </PanelGroup>
        <div className="flex flex-col h-full md:hidden">
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={runtime.editorLanguage}
              placeholder="write some code and hit run"
            />
          </div>
          <div className="border-t border-border/30 max-h-[40vh] overflow-y-auto">
            <OutputPane run={run} />
          </div>
        </div>
      </div>

      {/* Invisible Turnstile widget. No-op when VITE_TURNSTILE_SITE_KEY
          is empty; then the API middleware must also be disabled. */}
      {TURNSTILE_SITE_KEY && (
        <div className="sr-only" aria-hidden>
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onToken={setTurnstileToken}
          />
        </div>
      )}

      {/* Anonymous footer only; authed users already get the sidebar. */}
      {!user && (
        <footer className="shrink-0 border-t border-border/20 bg-base px-4 py-1 flex items-center justify-between text-muted/50 text-[10px] font-mono">
          <span>sandbox · not graded</span>
          <Link
            to={ctaHref}
            onClick={() => handleCtaClick('footer')}
            className="hover:text-secondary transition-colors"
          >
            sensei evaluates in the kata →
          </Link>
        </footer>
      )}
    </div>
  )
}

function OutputPane({ run }: { run: RunState }) {
  return (
    <div className="h-full overflow-y-auto bg-surface/40 px-4 py-3 font-mono text-xs">
      <OutputPanel run={run} />
    </div>
  )
}

function OutputPanel({ run }: { run: RunState }) {
  if (run.status === 'idle') {
    return <p className="text-muted/50">output will appear here.</p>
  }
  if (run.status === 'running') {
    return <p className="text-accent animate-pulse">executing...</p>
  }
  if (run.status === 'error' && run.errorMessage) {
    return <p className="text-danger whitespace-pre-wrap">{run.errorMessage}</p>
  }
  return (
    <div className="space-y-1">
      {run.stdout && (
        <pre className="text-secondary whitespace-pre-wrap wrap-break-word">{run.stdout}</pre>
      )}
      {run.stderr && (
        <pre className="text-danger whitespace-pre-wrap wrap-break-word">{run.stderr}</pre>
      )}
      {!run.stdout && !run.stderr && <p className="text-muted/50">(no output)</p>}
    </div>
  )
}

function findRuntime(language: string | undefined): RuntimeSpec | undefined {
  if (!language) return undefined
  return RUNTIMES.find((r) => r.language === language.toLowerCase())
}

function describeApiError(err: ApiError): string {
  switch (err.message) {
    case 'rate_limited':
      return 'You are running code too quickly. Wait a moment and try again.'
    case 'quota_exceeded':
      return 'The playground is recovering. Please try again later today.'
    case 'turnstile_required':
      return 'Bot check is still loading. Refresh the page and try again.'
    case 'turnstile_failed':
      return 'Bot check failed. Refresh the page and try again.'
    case 'invalid_language':
      return 'That language is not available in the playground.'
    case 'code_too_large':
      return 'Code is too large. Keep it under 16 KB.'
    case 'Not found':
      return 'The playground is currently offline.'
    default:
      return err.message || 'Run failed.'
  }
}
