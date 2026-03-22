import { useCallback, useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6366F1',
    primaryTextColor: '#F8FAFC',
    primaryBorderColor: '#334155',
    lineColor: '#64748B',
    secondaryColor: '#1E293B',
    tertiaryColor: '#253347',
    fontFamily: 'JetBrains Mono Variable, monospace',
    fontSize: '12px',
  },
})

interface MermaidEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MermaidEditor({ value, onChange }: MermaidEditorProps) {
  const [tab, setTab] = useState<'code' | 'preview'>('code')
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (tab === 'preview') {
      renderDiagram(value)
    }
  }, [tab, value, renderDiagram])

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setTab('code')}
          className={`px-4 py-2 text-xs font-mono transition-colors ${
            tab === 'code' ? 'text-primary border-b-2 border-accent' : 'text-muted hover:text-secondary'
          }`}
        >
          Code
        </button>
        <button
          onClick={() => setTab('preview')}
          className={`px-4 py-2 text-xs font-mono transition-colors ${
            tab === 'preview' ? 'text-primary border-b-2 border-accent' : 'text-muted hover:text-secondary'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'code' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Result]\n    B -->|No| D[Alternative]`}
            spellCheck={false}
            className="w-full h-full bg-base p-4 text-primary text-sm font-mono resize-none focus:outline-none"
          />
        ) : (
          <div ref={previewRef} className="w-full h-full overflow-auto p-4 flex items-center justify-center">
            {error ? (
              <p className="text-danger text-xs font-mono">{error}</p>
            ) : svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }} className="[&_svg]:max-w-full [&_svg]:h-auto" />
            ) : (
              <p className="text-muted text-xs font-mono">Write Mermaid syntax in the Code tab to see a preview.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
