import { useEffect, useRef } from 'react'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { rust } from '@codemirror/legacy-modes/mode/rust'
import { useThemeTokens, hexToRgba, type ThemeTokens } from '../../hooks/useThemeTokens'

export type CodeEditorLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'sql'
  | 'javascript-dom'
  | 'ruby'
  | 'rust'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: CodeEditorLanguage
  placeholder?: string
}

// CodeMirror's theming API only accepts literal color strings, so we
// can't bind the editor styles to CSS variables. Instead the brand
// tokens are read at mount + on every theme switch (useThemeTokens)
// and the EditorView is re-built. State (cursor, scroll, selection)
// resets on switch — acceptable because theme switching is rare.

function buildHighlightStyle(t: ThemeTokens): HighlightStyle {
  return HighlightStyle.define([
    { tag: [tags.keyword, tags.controlKeyword, tags.modifier, tags.operatorKeyword], color: t.accent },
    { tag: [tags.string, tags.special(tags.string), tags.regexp], color: t.success },
    { tag: [tags.number, tags.bool, tags.null, tags.atom], color: t.warning },
    { tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: t.muted, fontStyle: 'italic' },
    { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: t.primary },
    { tag: [tags.typeName, tags.className, tags.namespace], color: t.secondary },
    { tag: [tags.propertyName, tags.attributeName], color: t.secondary },
    { tag: [tags.tagName, tags.angleBracket], color: t.accent },
    { tag: [tags.variableName, tags.labelName], color: t.primary },
    { tag: [tags.punctuation, tags.separator, tags.bracket], color: t.secondary },
    { tag: [tags.heading, tags.strong], color: t.primary, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: [tags.link, tags.url], color: t.accent, textDecoration: 'underline' },
    { tag: tags.invalid, color: t.danger },
  ])
}

function buildEditorTheme(t: ThemeTokens) {
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '13px',
        backgroundColor: t.page,
        color: t.primary,
      },
      '.cm-scroller': {
        fontFamily: "'JetBrains Mono Variable', monospace",
        lineHeight: '1.6',
      },
      '.cm-content': {
        caretColor: t.accent,
        padding: '16px 0',
      },
      '.cm-line': {
        padding: '0 16px',
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: t.accent,
        borderLeftWidth: '2px',
      },
      '.cm-gutters': {
        backgroundColor: t.page,
        borderRight: `1px solid ${t.border}`,
        color: t.muted,
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 12px 0 8px',
        minWidth: '32px',
      },
      '.cm-activeLine': {
        backgroundColor: hexToRgba(t.accent, 0.06),
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: t.secondary,
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: hexToRgba(t.accent, 0.25),
      },
      '.cm-selectionMatch': {
        backgroundColor: hexToRgba(t.accent, 0.15),
      },
      '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
        backgroundColor: hexToRgba(t.accent, 0.2),
        color: t.primary,
        outline: 'none',
      },
    },
    { dark: t.isDark },
  )
}

export function CodeEditor({ value, onChange, language = 'javascript', placeholder }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const tokens = useThemeTokens()

  useEffect(() => {
    if (!containerRef.current) return

    // Map every supported language to a CodeMirror language extension. Ruby is
    // routed through StreamLanguage + the legacy-modes Ruby stream parser
    // because CodeMirror has no first-party `@codemirror/lang-ruby`. Any
    // language not in the map falls back to a plain editor (no syntax
    // highlighting) instead of crashing inside CodeMirror's extension flatten.
    const langExtensions: Record<CodeEditorLanguage, Extension> = {
      javascript: javascript({ typescript: false }),
      'javascript-dom': javascript({ typescript: false }),
      typescript: javascript({ typescript: true }),
      python: python(),
      sql: sql(),
      ruby: StreamLanguage.define(ruby),
      rust: StreamLanguage.define(rust),
    }
    const langExtension = langExtensions[language] ?? []

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          buildEditorTheme(tokens),
          syntaxHighlighting(buildHighlightStyle(tokens)),
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
  }, [language, tokens])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      aria-label={placeholder ?? 'Code editor'}
    />
  )
}
