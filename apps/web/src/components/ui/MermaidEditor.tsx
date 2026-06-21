import { useCallback, useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { useThemeTokens, type ThemeTokens } from '../../hooks/useThemeTokens'

interface MermaidEditorProps {
  value: string
  onChange: (value: string) => void
}

const PLACEHOLDER = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Result]
    B -->|No| D[Alternative]`

// mermaid.initialize uses literal hex strings — it doesn't read CSS
// variables. So we re-initialize on every theme change and re-render
// the current diagram against the new palette.
function initMermaid(t: ThemeTokens): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: t.isDark ? 'dark' : 'default',
    themeVariables: {
      background: t.page,
      primaryColor: t.surface,
      primaryTextColor: t.primary,
      primaryBorderColor: t.border,
      lineColor: t.muted,
      secondaryColor: t.surface,
      tertiaryColor: t.page,
      fontFamily: 'JetBrains Mono Variable, monospace',
      fontSize: '12px',
    },
  })
}

export function MermaidEditor({ value, onChange }: Readonly<MermaidEditorProps>) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const renderCounter = useRef(0)
  const tokens = useThemeTokens()

  // Initialize / re-initialize mermaid whenever the resolved tokens
  // change. The render effect below depends on `tokens` too, so the
  // current diagram repaints with the new palette right after.
  useEffect(() => {
    initMermaid(tokens)
  }, [tokens])

  const renderDiagram = useCallback(async (code: string) => {
    if (!code.trim()) {
      setSvg('')
      setError(null)
      return
    }
    try {
      const id = `mermaid-${++renderCounter.current}`
      const { svg: rendered } = await mermaid.render(id, code)
      setSvg(rendered)
      setError(null)
    } catch {
      setError('Invalid Mermaid syntax')
    }
  }, [])

  // Debounce so each keystroke doesn't flicker the diagram while the
  // user is mid-edit. 250ms feels live without thrashing the parser.
  // Adding `tokens` to deps re-renders the active diagram on theme switch.
  useEffect(() => {
    const handle = setTimeout(() => renderDiagram(value), 250)
    return () => clearTimeout(handle)
  }, [value, renderDiagram, tokens])

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Source pane */}
      <div className="flex-1 min-h-0 border-b border-border">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="w-full h-full bg-page text-primary text-sm font-mono leading-relaxed resize-none focus:outline-none px-4 py-3 placeholder:text-muted"
        />
      </div>

      {/* Preview pane */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-7 shrink-0 border-b border-border bg-surface flex items-center px-4">
          <span className="font-mono text-xs tracking-[0.08em] uppercase text-muted">
            Preview
          </span>
          {error && (
            <span className="ml-3 font-mono text-xs text-danger uppercase tracking-[0.08em]">
              · {error}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-auto px-4 py-4 flex items-center justify-center bg-page">
          {svg ? (
            <div
              dangerouslySetInnerHTML={{ __html: svg }}
              className="[&_svg]:max-w-full [&_svg]:h-auto"
            />
          ) : error ? (
            <p className="text-danger text-xs font-mono">{error}</p>
          ) : value.trim() ? null : (
            <p className="text-muted text-xs font-mono text-center">
              Write Mermaid above to see a live preview.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
