import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StreamingText } from './StreamingText'

describe('StreamingText', () => {
  describe('plain text rendering', () => {
    it('renders prose with no fences as a single paragraph', () => {
      render(<StreamingText text="Hello there" done />)

      const para = screen.getByText('Hello there')
      expect(para.tagName).toBe('P')
    })

    it('preserves newlines via whitespace-pre-wrap so streamed text keeps its shape', () => {
      render(<StreamingText text={'line one\nline two'} done />)

      const para = screen.getByText(/line one/)
      expect(para).toHaveClass('whitespace-pre-wrap')
      expect(para.textContent).toBe('line one\nline two')
    })

    it('renders an empty paragraph (never zero parts) when text is empty', () => {
      const { container } = render(<StreamingText text="" done />)

      // parseCodeBlocks always emits at least one text part.
      const paras = container.querySelectorAll('p')
      expect(paras).toHaveLength(1)
      expect(paras[0]).toHaveClass('whitespace-pre-wrap')
    })
  })

  describe('streaming cursor', () => {
    it('shows the blinking cursor affordance while not done', () => {
      const { container } = render(<StreamingText text="typing" done={false} />)

      const cursor = container.querySelector('.animate-pulse')
      expect(cursor).not.toBeNull()
      expect(cursor).toHaveAttribute('aria-hidden')
    })

    it('hides the cursor once done is true', () => {
      const { container } = render(<StreamingText text="finished" done />)

      expect(container.querySelector('.animate-pulse')).toBeNull()
    })

    it('removes the cursor when the same content transitions from streaming to done', () => {
      const { container, rerender } = render(<StreamingText text="answer" done={false} />)
      expect(container.querySelector('.animate-pulse')).not.toBeNull()

      rerender(<StreamingText text="answer" done />)
      expect(container.querySelector('.animate-pulse')).toBeNull()
      // Content stays put; only the cursor disappears.
      expect(screen.getByText('answer')).toBeInTheDocument()
    })
  })

  describe('code block parsing', () => {
    it('splits a fenced code block into a <pre><code> away from the surrounding prose', () => {
      render(
        <StreamingText
          text={'Here is code:\n```ts\nconst x = 1\n```\nDone.'}
          done
        />,
      )

      const code = screen.getByText('const x = 1')
      expect(code.tagName).toBe('CODE')
      expect(code.closest('pre')).not.toBeNull()

      // Prose around the fence is NOT swallowed into the code block.
      expect(screen.getByText(/Here is code:/)).toBeInTheDocument()
      expect(screen.getByText(/Done\./)).toBeInTheDocument()
    })

    it('strips the language tag and the fence delimiters from the code content', () => {
      render(<StreamingText text={'```python\nprint(1)\n```'} done />)

      const code = screen.getByText('print(1)')
      expect(code.tagName).toBe('CODE')
      // Neither the ``` fences nor the `python` lang tag leak into the content.
      expect(code.textContent).toBe('print(1)')
    })

    it('trims trailing whitespace from the code body', () => {
      render(<StreamingText text={'```\ncode body\n\n\n```'} done />)

      const code = screen.getByText('code body')
      expect(code.textContent).toBe('code body')
    })

    it('renders multiple fenced blocks as separate <pre> elements', () => {
      const { container } = render(
        <StreamingText text={'```\nfirst\n```\nmid\n```\nsecond\n```'} done />,
      )

      const pres = container.querySelectorAll('pre')
      expect(pres).toHaveLength(2)
      expect(pres[0]).toHaveTextContent('first')
      expect(pres[1]).toHaveTextContent('second')
      expect(screen.getByText(/mid/)).toBeInTheDocument()
    })

    it('keeps the cursor after a code block while still streaming', () => {
      const { container } = render(
        <StreamingText text={'```\ncode\n```'} done={false} />,
      )

      expect(container.querySelector('pre')).not.toBeNull()
      expect(container.querySelector('.animate-pulse')).not.toBeNull()
    })
  })

  describe('className passthrough', () => {
    it('applies a caller-supplied className to the wrapper', () => {
      const { container } = render(
        <StreamingText text="x" done className="text-sm leading-relaxed" />,
      )

      const wrapper = container.firstElementChild
      expect(wrapper).toHaveClass('text-sm', 'leading-relaxed')
    })
  })
})
