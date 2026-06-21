import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type * as CodeMirrorView from '@codemirror/view'

import { CodeEditor } from './CodeEditor'

// CodeEditor's only real job is to wire a CodeMirror EditorView to a container
// and bridge the editor's updateListener back into the React onChange prop. We
// mock the external boundary — the EditorView constructor — and capture the
// updateListener callback the wrapper registers, so we can simulate a doc
// change and observe the onChange bridge without standing up a real editor.
//
// Everything else stays real (importActual): EditorState.create still runs and
// flattens the extension array, so the updateListener we hand back must be a
// genuine CodeMirror extension. We get that by delegating to the real
// EditorView.updateListener.of and stashing the callback on the side.

interface DocChangeUpdate {
  docChanged: boolean
  state: { doc: { toString: () => string } }
}

interface ConstructedEditor {
  doc: string
  parent: HTMLElement | undefined
  emit: (update: DocChangeUpdate) => void
}

const editors: ConstructedEditor[] = []
const destroyedIndexes: number[] = []

function editorAt(index: number): ConstructedEditor {
  const editor = editors[index]
  if (!editor) throw new Error(`no EditorView constructed at index ${index}`)
  return editor
}

// Simulate a CodeMirror doc-change update on the Nth constructed editor.
function emitDocChange(editorIndex: number, nextDoc: string, docChanged = true) {
  editorAt(editorIndex).emit({
    docChanged,
    state: { doc: { toString: () => nextDoc } },
  })
}

vi.mock('@codemirror/view', async () => {
  const actual = await vi.importActual<typeof CodeMirrorView>('@codemirror/view')

  // Each EditorView construction grabs the most recently registered listener;
  // updateListener.of runs inside the same synchronous build as the
  // constructor, so the order is deterministic.
  let pendingListener: ((update: DocChangeUpdate) => void) | undefined

  class FakeEditorView {
    static theme = actual.EditorView.theme
    static contentAttributes = actual.EditorView.contentAttributes
    static updateListener = {
      of: (cb: (update: DocChangeUpdate) => void) => {
        pendingListener = cb
        return actual.EditorView.updateListener.of(cb)
      },
    }

    private readonly index: number

    constructor(config: { state: { doc: { toString: () => string } }; parent?: HTMLElement }) {
      this.index = editors.length
      const listener = pendingListener
      pendingListener = undefined
      editors.push({
        doc: config.state.doc.toString(),
        parent: config.parent,
        emit: (update) => listener?.(update),
      })
    }

    destroy() {
      destroyedIndexes.push(this.index)
    }
  }

  return { ...actual, EditorView: FakeEditorView }
})

beforeEach(() => {
  editors.length = 0
  destroyedIndexes.length = 0
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('CodeEditor', () => {
  it('renders a container labelled "Code editor" by default', () => {
    render(<CodeEditor value="" onChange={() => {}} />)

    const container = document.querySelector('[aria-label="Code editor"]')
    expect(container).not.toBeNull()
    expect(container).toHaveClass('h-full', 'w-full', 'overflow-hidden')
  })

  it('uses the placeholder prop as the container accessible label', () => {
    render(<CodeEditor value="" onChange={() => {}} placeholder="Write your kata" />)

    expect(document.querySelector('[aria-label="Write your kata"]')).not.toBeNull()
    expect(document.querySelector('[aria-label="Code editor"]')).toBeNull()
  })

  it('mounts exactly one EditorView parented to its own container div', () => {
    render(<CodeEditor value="x" onChange={() => {}} />)

    expect(editors).toHaveLength(1)
    expect(editorAt(0).parent).toBe(document.querySelector('[aria-label="Code editor"]'))
  })

  it('seeds the editor document from the initial value prop', () => {
    render(<CodeEditor value="const a = 1" onChange={() => {}} />)

    expect(editorAt(0).doc).toBe('const a = 1')
  })

  it('forwards the new document text to onChange when the editor reports a doc change', () => {
    const onChange = vi.fn()
    render(<CodeEditor value="" onChange={onChange} />)

    emitDocChange(0, 'typed!')

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('typed!')
  })

  it('ignores editor updates that are not document changes (e.g. cursor/selection)', () => {
    const onChange = vi.fn()
    render(<CodeEditor value="" onChange={onChange} />)

    emitDocChange(0, 'irrelevant', false)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('routes doc changes to the latest onChange without rebuilding the editor', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<CodeEditor value="" onChange={first} />)

    rerender(<CodeEditor value="" onChange={second} />)

    // Effect deps are [language, tokens] — a new onChange must not tear down
    // and re-mount CodeMirror, but the listener must still call the latest one.
    expect(editors).toHaveLength(1)

    emitDocChange(0, 'after swap')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('after swap')
  })

  it('does not rebuild the editor when only the value prop changes', () => {
    const { rerender } = render(<CodeEditor value="one" onChange={() => {}} />)
    expect(editors).toHaveLength(1)

    rerender(<CodeEditor value="two" onChange={() => {}} />)

    // value is the initial doc only; external resets are intentionally not
    // synced back, so no second EditorView is constructed.
    expect(editors).toHaveLength(1)
    expect(editorAt(0).doc).toBe('one')
  })

  it('rebuilds the editor when the language changes', () => {
    const { rerender } = render(<CodeEditor value="" onChange={() => {}} language="javascript" />)
    expect(editors).toHaveLength(1)

    rerender(<CodeEditor value="" onChange={() => {}} language="python" />)

    // Old view torn down, new one built for the new language extension.
    expect(editors).toHaveLength(2)
    expect(destroyedIndexes).toContain(0)
  })

  it('destroys the EditorView on unmount to avoid leaking the editor', () => {
    const { unmount } = render(<CodeEditor value="" onChange={() => {}} />)
    expect(destroyedIndexes).not.toContain(0)

    unmount()

    expect(destroyedIndexes).toContain(0)
  })

  it('builds an editor without crashing for every supported language', () => {
    const languages = [
      'javascript',
      'typescript',
      'python',
      'sql',
      'javascript-dom',
      'ruby',
      'rust',
    ] as const

    for (const language of languages) {
      expect(() =>
        render(<CodeEditor value="" onChange={() => {}} language={language} />),
      ).not.toThrow()
    }

    expect(editors).toHaveLength(languages.length)
  })
})
