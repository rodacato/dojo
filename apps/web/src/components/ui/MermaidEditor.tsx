import { useCallback, useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

// Mermaid theme aligned to the dojo brand surface (#0F172A page,
// #1E293B elevated, indigo accents). Keeps line/text legible against
// the dark page bg without bright defaults.
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    background: '#0F172A',
    primaryColor: '#1E293B',
    primaryTextColor: '#F8FAFC',
    primaryBorderColor: '#334155',
    lineColor: '#64748B',
    secondaryColor: '#1E293B',
    tertiaryColor: '#0F172A',
    fontFamily: 'JetBrains Mono Variable, monospace',
    fontSize: '12px',
  },
})

interface MermaidEditorProps {
  value: string
  onChange: (value: string) => void
}

const PLACEHOLDER = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Result]
    B -->|No| D[Alternative]`

export function MermaidEditor({ value, onChange }: MermaidEditorProps) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const renderCounter = useRef(0)

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
  useEffect(() => {
    const handle = setTimeout(() => renderDiagram(value), 250)
    return () => clearTimeout(handle)
  }, [value, renderDiagram])

  return (
    <div className="flex flex-col h-full bg-page">
      {/* Source pane */}
      <div className="flex-1 min-h-0 border-b border-border">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="w-full h-full bg-page text-primary text-[13px] font-mono leading-relaxed resize-none focus:outline-none px-4 py-3 placeholder:text-muted"
        />
      </div>

      {/* Preview pane */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-7 shrink-0 border-b border-border bg-surface flex items-center px-4">
          <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
            Preview
          </span>
          {error && (
            <span className="ml-3 font-mono text-[10px] text-danger uppercase tracking-[0.08em]">
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
          ) : !value.trim() ? (
            <p className="text-muted text-xs font-mono text-center">
              Write Mermaid above to see a live preview.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
