import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: 'javascript' | 'typescript' | 'python' | 'sql'
  placeholder?: string
}

export function CodeEditor({ value, onChange, language = 'javascript', placeholder }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const langExtension = {
      javascript: javascript({ typescript: false }),
      typescript: javascript({ typescript: true }),
      python: python(),
      sql: sql(),
    }[language]

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          oneDark,
          lineNumbers(),
          keymap.of(defaultKeymap),
          langExtension,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString())
            }
          }),
          EditorView.theme({
            '&': { height: '100%', fontSize: '14px' },
            '.cm-scroller': { fontFamily: "'JetBrains Mono Variable', monospace" },
          }),
          EditorView.contentAttributes.of({
            spellcheck: 'false',
            autocorrect: 'off',
            autocomplete: 'off',
            autocapitalize: 'off',
          }),
        ],
      }),
      parent: containerRef.current,
    })

    viewRef.current = view
    return () => view.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-sm overflow-hidden border border-border"
      aria-label={placeholder ?? 'Code editor'}
    />
  )
}
