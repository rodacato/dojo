import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { CodeEditor } from '../components/ui/CodeEditor'
import { LogoWordmark } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { trackEvent } from '../lib/metrics'

// Source of truth for the dropdowns. Order: default first, older
// versions go into the "advanced versions" group. Keep in sync with
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

  const runtime = useMemo(
    () => RUNTIMES.find((r) => r.language === selectedLanguage) ?? RUNTIMES[0]!,
    [selectedLanguage],
  )
  const availableVersions = useMemo(() => {
    const { default: def, advanced } = runtime.versions
    return showAdvanced ? [def, ...advanced] : [def]
  }, [runtime, showAdvanced])

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
    setRun({ ...INITIAL_RUN, status: 'running' })
    try {
      const result = await api.playground.run({
        language: selectedLanguage,
        version: selectedVersion,
        code,
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
    <div className="min-h-screen bg-base text-primary flex flex-col">
      {/* Top bar — logo + CTA to the kata loop */}
      <header className="border-b border-border/30">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
          <Link to="/" className="shrink-0">
            <LogoWordmark />
          </Link>
          <p className="text-muted text-xs font-mono hidden sm:block flex-1 text-center">
            like running code?{' '}
            <Link
              to={ctaHref}
              onClick={() => handleCtaClick('banner')}
              className="text-accent hover:text-primary transition-colors"
            >
              practice with a kata →
            </Link>
          </p>
          <Link
            to={ctaHref}
            onClick={() => handleCtaClick('topbar')}
            className="text-xs font-mono text-secondary hover:text-primary transition-colors px-3 py-1.5 border border-border/40 rounded-sm hover:border-accent/50 shrink-0"
          >
            {user ? 'Dashboard' : 'Sign in'}
          </Link>
        </div>
      </header>

      {/* Controls bar */}
      <div className="border-b border-border/20 bg-surface/30">
        <div className="max-w-5xl mx-auto flex items-center flex-wrap gap-3 px-4 py-2">
          <label className="flex items-center gap-2 text-xs font-mono text-muted">
            <span className="hidden sm:inline">language</span>
            <select
              value={selectedLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-base border border-border/40 rounded-sm px-2 py-1 text-primary text-sm focus:outline-none focus:border-accent"
            >
              {RUNTIMES.map((r) => (
                <option key={r.language} value={r.language}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs font-mono text-muted">
            <span className="hidden sm:inline">version</span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="bg-base border border-border/40 rounded-sm px-2 py-1 text-primary text-sm focus:outline-none focus:border-accent"
            >
              {availableVersions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          {runtime.versions.advanced.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="text-muted text-[10px] font-mono hover:text-secondary transition-colors"
            >
              {showAdvanced ? '— hide older' : '+ older versions'}
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
              disabled={run.status === 'running' || code.trim().length === 0}
              className="px-4 py-1.5 bg-accent text-primary font-mono text-xs rounded-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {run.status === 'running' ? 'running...' : '▶ run'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor + output */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={runtime.editorLanguage}
            placeholder="write some code and hit run"
          />
        </div>

        <div className="border-t border-border/30 bg-surface/50 max-h-64 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-3 font-mono text-xs">
            <OutputPanel run={run} />
          </div>
        </div>
      </div>

      {/* Footer — honest disclosure about what the playground is */}
      <footer className="border-t border-border/20 bg-base">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between text-muted/60 text-[10px] font-mono">
          <span>this is a sandbox. not graded.</span>
          <span>
            the kata is where the{' '}
            <Link
              to={ctaHref}
              onClick={() => handleCtaClick('footer')}
              className="hover:text-secondary transition-colors"
            >
              sensei
            </Link>{' '}
            evaluates.
          </span>
        </div>
      </footer>
    </div>
  )
}

function OutputPanel({ run }: { run: RunState }) {
  if (run.status === 'idle') {
    return <p className="text-muted/60">output will appear here.</p>
  }
  if (run.status === 'running') {
    return <p className="text-accent animate-pulse">executing...</p>
  }
  if (run.status === 'error' && run.errorMessage) {
    return <p className="text-danger">{run.errorMessage}</p>
  }
  return (
    <div className="space-y-2">
      {run.stdout && (
        <pre className="text-secondary whitespace-pre-wrap break-words">{run.stdout}</pre>
      )}
      {run.stderr && (
        <pre className="text-danger whitespace-pre-wrap break-words">{run.stderr}</pre>
      )}
      {!run.stdout && !run.stderr && (
        <p className="text-muted/60">(no output)</p>
      )}
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
