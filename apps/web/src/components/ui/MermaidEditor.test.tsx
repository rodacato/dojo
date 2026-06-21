import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

// `mermaid` isn't installed in this workspace, so the module is mocked
// entirely. We assert the component's wiring against these spies:
// initialize on mount, render(id, code) on debounced input, and the
// resolved svg / rejection handling.
const initialize = vi.fn()
const renderDiagram = vi.fn<(id: string, code: string) => Promise<{ svg: string }>>()

vi.mock('mermaid', () => ({
  default: {
    initialize: (...args: unknown[]) => initialize(...args),
    render: (id: string, code: string) => renderDiagram(id, code),
  },
}))

// Our manual act() wrapper (advancing the debounce timer) needs this flag;
// @testing-library/react's render sets it, but the explicit act calls run
// outside that scope.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

import { MermaidEditor } from './MermaidEditor'

const HINT = 'Write Mermaid above to see a live preview.'

// Drain the 250ms debounce plus the microtask queue for the awaited
// mermaid.render promise, all inside act so React flushes state updates.
async function flushDebounce(): Promise<void> {
  await act(async () => {
    vi.advanceTimersByTime(250)
    await Promise.resolve()
    await Promise.resolve()
  })
}

beforeEach(() => {
  initialize.mockClear()
  renderDiagram.mockReset()
  renderDiagram.mockResolvedValue({ svg: '<svg id="diagram"></svg>' })
  // Only fake the timer APIs the debounce uses; leave the rest for React 19.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MermaidEditor', () => {
  it('initializes mermaid on mount before any diagram is rendered', () => {
    render(<MermaidEditor value="" onChange={vi.fn()} />)

    expect(initialize).toHaveBeenCalled()
    expect(initialize.mock.calls[0]?.[0]).toMatchObject({ startOnLoad: false })
  })

  it('shows the empty-state hint and renders nothing through mermaid for empty input', async () => {
    render(<MermaidEditor value="" onChange={vi.fn()} />)

    expect(screen.getByText(HINT)).toBeInTheDocument()

    await flushDebounce()

    expect(renderDiagram).not.toHaveBeenCalled()
    expect(screen.getByText(HINT)).toBeInTheDocument()
  })

  it('treats whitespace-only input as empty: no render call, hint persists', async () => {
    render(<MermaidEditor value={'   \n\t  '} onChange={vi.fn()} />)

    await flushDebounce()

    expect(renderDiagram).not.toHaveBeenCalled()
    expect(screen.getByText(HINT)).toBeInTheDocument()
  })

  it('calls mermaid.render with the source code after the debounce window', async () => {
    render(<MermaidEditor value="graph TD; A-->B" onChange={vi.fn()} />)

    // Nothing fires until the debounce elapses.
    expect(renderDiagram).not.toHaveBeenCalled()

    await flushDebounce()

    expect(renderDiagram).toHaveBeenCalledTimes(1)
    const [id, code] = renderDiagram.mock.calls[0] ?? []
    expect(code).toBe('graph TD; A-->B')
    expect(id).toMatch(/^mermaid-/)
  })

  it('injects the resolved svg into the preview and drops the hint', async () => {
    const { container } = render(
      <MermaidEditor value="graph TD; A-->B" onChange={vi.fn()} />,
    )

    await flushDebounce()

    expect(container.querySelector('svg#diagram')).not.toBeNull()
    expect(screen.queryByText(HINT)).not.toBeInTheDocument()
  })

  it('shows the error state and no svg when mermaid.render rejects', async () => {
    renderDiagram.mockRejectedValue(new Error('parse error'))
    const { container } = render(
      <MermaidEditor value="not a diagram" onChange={vi.fn()} />,
    )

    await flushDebounce()

    // Error appears both in the preview header and the body.
    expect(screen.getAllByText(/Invalid Mermaid syntax/i).length).toBeGreaterThan(0)
    expect(container.querySelector('svg')).toBeNull()
    expect(screen.queryByText(HINT)).not.toBeInTheDocument()
  })

  it('debounces: rapid value changes only render the latest code once', async () => {
    const { rerender } = render(<MermaidEditor value="graph TD; A" onChange={vi.fn()} />)
    rerender(<MermaidEditor value="graph TD; AB" onChange={vi.fn()} />)
    rerender(<MermaidEditor value="graph TD; ABC" onChange={vi.fn()} />)

    await flushDebounce()

    expect(renderDiagram).toHaveBeenCalledTimes(1)
    expect(renderDiagram.mock.calls[0]?.[1]).toBe('graph TD; ABC')
  })

  it('recovers from an error back to a clean preview when the next render succeeds', async () => {
    renderDiagram.mockRejectedValueOnce(new Error('parse error'))
    const { rerender, container } = render(
      <MermaidEditor value="broken" onChange={vi.fn()} />,
    )

    await flushDebounce()
    expect(screen.getAllByText(/Invalid Mermaid syntax/i).length).toBeGreaterThan(0)

    rerender(<MermaidEditor value="graph TD; A-->B" onChange={vi.fn()} />)
    await flushDebounce()

    expect(screen.queryByText(/Invalid Mermaid syntax/i)).not.toBeInTheDocument()
    expect(container.querySelector('svg#diagram')).not.toBeNull()
  })

  it('forwards typed input through onChange', () => {
    const onChange = vi.fn()
    render(<MermaidEditor value="" onChange={onChange} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'graph TD; X-->Y' } })

    expect(onChange).toHaveBeenCalledWith('graph TD; X-->Y')
  })

  it('reflects the controlled value in the textarea and exposes the placeholder', () => {
    render(<MermaidEditor value="graph LR; A-->B" onChange={vi.fn()} />)

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('graph LR; A-->B')
    expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('graph TD'))
  })
})
