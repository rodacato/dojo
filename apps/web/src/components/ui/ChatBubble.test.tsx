import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { SenseiBubble, UserBubble } from './ChatBubble'

describe('SenseiBubble', () => {
  it('renders the message body passed as children', () => {
    render(<SenseiBubble initials="YO">Focus on the invariant first.</SenseiBubble>)
    expect(screen.getByText('Focus on the invariant first.')).toBeInTheDocument()
  })

  it('shows the avatar initials', () => {
    render(<SenseiBubble initials="YO">Hi</SenseiBubble>)
    expect(screen.getByText('YO')).toBeInTheDocument()
  })

  it('renders the persona eyebrow (bracketed role) when a role is given', () => {
    render(
      <SenseiBubble initials="YO" role="Sensei">
        Hi
      </SenseiBubble>,
    )
    expect(screen.getByText('[Sensei]')).toBeInTheDocument()
  })

  it('omits the persona eyebrow entirely when no role is given', () => {
    render(<SenseiBubble initials="YO">Hi</SenseiBubble>)
    // The eyebrow renders its role in brackets; with no role nothing bracketed appears.
    expect(screen.queryByText(/^\[.*\]$/)).not.toBeInTheDocument()
  })

  it('appends the streaming cursor only while streaming is true', () => {
    const { rerender } = render(
      <SenseiBubble initials="YO" streaming={false}>
        Thinking
      </SenseiBubble>,
    )
    expect(document.querySelector('.animate-cursor')).toBeNull()

    rerender(
      <SenseiBubble initials="YO" streaming>
        Thinking
      </SenseiBubble>,
    )
    const cursor = document.querySelector('.animate-cursor')
    expect(cursor).not.toBeNull()
    expect(cursor).toHaveTextContent('_')
  })

  it('defaults streaming off so a settled message shows no cursor', () => {
    render(<SenseiBubble initials="YO">Done</SenseiBubble>)
    expect(document.querySelector('.animate-cursor')).toBeNull()
  })

  it('keeps the streaming cursor decorative (aria-hidden) for screen readers', () => {
    render(
      <SenseiBubble initials="YO" streaming>
        Streaming
      </SenseiBubble>,
    )
    expect(document.querySelector('.animate-cursor')).toHaveAttribute('aria-hidden')
  })

  it('renders rich children, not just strings', () => {
    render(
      <SenseiBubble initials="YO">
        <code data-testid="snippet">map(fn)</code>
      </SenseiBubble>,
    )
    expect(screen.getByTestId('snippet')).toHaveTextContent('map(fn)')
  })
})

describe('UserBubble', () => {
  it('renders the message body passed as children', () => {
    render(<UserBubble>My answer is O(n).</UserBubble>)
    expect(screen.getByText('My answer is O(n).')).toBeInTheDocument()
  })

  it('labels the message as the user with a "You" tag', () => {
    render(<UserBubble>Hi</UserBubble>)
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('preserves newlines in user input via whitespace-pre-wrap', () => {
    render(<UserBubble>{'line one\nline two'}</UserBubble>)
    const body = screen.getByText(/line one/)
    expect(body).toHaveClass('whitespace-pre-wrap')
    expect(body).toHaveTextContent('line one line two')
  })

  it('right-aligns the bubble in the conversation column', () => {
    const { container } = render(<UserBubble>Hi</UserBubble>)
    expect(container.querySelector('.justify-end')).not.toBeNull()
  })
})
