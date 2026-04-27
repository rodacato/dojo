import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: 'javascript' | 'typescript' | 'python' | 'sql' | 'javascript-dom'
  placeholder?: string
}

// Dojo brand palette for CodeMirror — soft syntax on the page surface.
// Keywords muted indigo, strings success green, numbers warning amber,
// comments muted slate. Default text uses primary slate-50 so prose-heavy
// code (variables, identifiers) stays calm.
const dojoHighlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.modifier, t.operatorKeyword], color: '#818CF8' },
  { tag: [t.string, t.special(t.string), t.regexp], color: '#10B981' },
  { tag: [t.number, t.bool, t.null, t.atom], color: '#F59E0B' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#475569', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#F8FAFC' },
  { tag: [t.typeName, t.className, t.namespace], color: '#94A3B8' },
  { tag: [t.propertyName, t.attributeName], color: '#94A3B8' },
  { tag: [t.tagName, t.angleBracket], color: '#6366F1' },
  { tag: [t.variableName, t.labelName], color: '#F8FAFC' },
  { tag: [t.punctuation, t.separator, t.bracket], color: '#94A3B8' },
  { tag: [t.heading, t.strong], color: '#F8FAFC', fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.link, t.url], color: '#6366F1', textDecoration: 'underline' },
  { tag: t.invalid, color: '#EF4444' },
])

const dojoEditorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      fontSize: '13px',
      backgroundColor: '#0F172A',
      color: '#F8FAFC',
    },
    '.cm-scroller': {
      fontFamily: "'JetBrains Mono Variable', monospace",
      lineHeight: '1.6',
    },
    '.cm-content': {
      caretColor: '#6366F1',
      padding: '16px 0',
    },
    '.cm-line': {
      padding: '0 16px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#6366F1',
      borderLeftWidth: '2px',
    },
    '.cm-gutters': {
      backgroundColor: '#0F172A',
      borderRight: '1px solid #334155',
      color: '#475569',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 12px 0 8px',
      minWidth: '32px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(99, 102, 241, 0.06)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#94A3B8',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(99, 102, 241, 0.25)',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      color: '#F8FAFC',
      outline: 'none',
    },
  },
  { dark: true },
)

export function CodeEditor({ value, onChange, language = 'javascript', placeholder }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const langExtension = {
      javascript: javascript({ typescript: false }),
      'javascript-dom': javascript({ typescript: false }),
      typescript: javascript({ typescript: true }),
      python: python(),
      sql: sql(),
    }[language]

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          dojoEditorTheme,
          syntaxHighlighting(dojoHighlightStyle),
          lineNumbers(),
          keymap.of(defaultKeymap),
          langExtension,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString())
            }
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
  }, [language])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      aria-label={placeholder ?? 'Code editor'}
    />
  )
}
