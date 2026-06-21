import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useTypingReveal } from './useTypingReveal'

// React's act() needs this flag set; RTL normally sets it, but we bypass RTL.
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

// @testing-library/react's renderHook resolves a mismatched react-dom instance
// in this workspace (dispatcher comes back null), so we drive the hook with a
// minimal harness over react-dom/client — same real-render path, no mocks.
function renderTypingReveal(initialText: string, initialDone: boolean) {
  const container = document.createElement('div')
  let root: Root
  let current = ''

  function Harness({ text, done }: { text: string; done: boolean }) {
    current = useTypingReveal(text, done)
    return null
  }

  const render = (text: string, done: boolean) => {
    const element: ReactElement = createElement(Harness, { text, done })
    act(() => {
      root.render(element)
    })
  }

  act(() => {
    root = createRoot(container)
  })

  render(initialText, initialDone)

  return {
    get current() {
      return current
    },
    rerender: render,
    unmount: () => act(() => root.unmount()),
  }
}

const LARGE = 'x'.repeat(600)

describe('useTypingReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes small (streamed) chunks straight through without dripping', () => {
    const view = renderTypingReveal('', false)

    // A small chunk (<= 20 chars) is revealed immediately, no animation needed.
    view.rerender('hello', false)
    expect(view.current).toBe('hello')

    // Successive small increments keep passing through verbatim.
    view.rerender('hello world', false)
    expect(view.current).toBe('hello world')

    view.unmount()
  })

  it('drips a large chunk out progressively across animation frames', () => {
    const view = renderTypingReveal('', false)

    view.rerender(LARGE, false)

    // Before any frame runs the large chunk is NOT fully revealed.
    expect(view.current.length).toBeLessThan(LARGE.length)

    // After a single frame only a prefix is shown — proof of the drip.
    act(() => {
      vi.advanceTimersByTime(16)
    })
    const afterOneFrame = view.current.length
    expect(afterOneFrame).toBeGreaterThan(0)
    expect(afterOneFrame).toBeLessThan(LARGE.length)

    // More frames reveal strictly more characters.
    act(() => {
      vi.advanceTimersByTime(16)
    })
    expect(view.current.length).toBeGreaterThan(afterOneFrame)

    // Whatever is shown is always a correct prefix of the source text.
    expect(LARGE.startsWith(view.current)).toBe(true)

    // Enough frames and the full text lands.
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(view.current).toBe(LARGE)

    view.unmount()
  })

  it('snaps to the full text immediately when done flips true mid-drip', () => {
    const view = renderTypingReveal('', false)

    view.rerender(LARGE, false)
    act(() => {
      vi.advanceTimersByTime(16)
    })
    expect(view.current.length).toBeLessThan(LARGE.length)

    // done short-circuits the animation and reveals everything at once.
    view.rerender(LARGE, true)
    expect(view.current).toBe(LARGE)

    view.unmount()
  })

  it('does not regress or overshoot the text after done has revealed it', () => {
    const view = renderTypingReveal('', false)

    view.rerender(LARGE, true)
    expect(view.current).toBe(LARGE)

    // The cancelled animation must not keep ticking past completion.
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(view.current).toBe(LARGE)

    view.unmount()
  })
})
