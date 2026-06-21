import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { KataBody } from './KataBody'

describe('KataBody', () => {
  it('renders markdown headings as the matching semantic level', () => {
    render(<KataBody body={'# Title\n\n## Section\n\n### Detail'} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Section' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Detail' })).toBeInTheDocument()
  })

  it('renders paragraph prose as a <p> with the body styling', () => {
    render(<KataBody body="Reverse the linked list in place." />)

    const para = screen.getByText('Reverse the linked list in place.')
    expect(para.tagName).toBe('P')
    expect(para).toHaveClass('text-secondary', 'text-sm')
  })

  it('renders an unordered list with one <li> per bullet', () => {
    render(<KataBody body={'- first\n- second\n- third'} />)

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('UL')
    expect(list).toHaveClass('list-disc')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('second')).toBeInTheDocument()
  })

  it('renders an ordered list as an <ol>', () => {
    render(<KataBody body={'1. one\n2. two'} />)

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')
    expect(list).toHaveClass('list-decimal')
  })

  it('distinguishes fenced code blocks from inline code by styling', () => {
    render(<KataBody body={'Call `helper()` first.\n\n```js\nconst x = 1\n```'} />)

    const inline = screen.getByText('helper()')
    expect(inline.tagName).toBe('CODE')
    expect(inline).toHaveClass('text-accent')
    expect(inline).not.toHaveClass('block')

    const block = screen.getByText('const x = 1')
    expect(block.tagName).toBe('CODE')
    expect(block).toHaveClass('block', 'whitespace-pre')
    expect(block).not.toHaveClass('text-accent')
  })

  it('unwraps the <pre> wrapper so the code block is not double-nested', () => {
    const { container } = render(<KataBody body={'```\nplain block\n```'} />)

    expect(container.querySelector('pre')).toBeNull()
    expect(screen.getByText('plain block').tagName).toBe('CODE')
  })

  it('renders blockquotes with the accent rule styling', () => {
    render(<KataBody body="> remember the base case" />)

    const quote = screen.getByText('remember the base case').closest('blockquote')
    expect(quote).not.toBeNull()
    expect(quote).toHaveClass('border-accent', 'italic')
  })

  it('renders bold emphasis as <strong>', () => {
    render(<KataBody body="This is **important** context." />)

    const strong = screen.getByText('important')
    expect(strong.tagName).toBe('STRONG')
    expect(strong).toHaveClass('font-semibold')
  })

  it('renders a thematic break as an <hr>', () => {
    const { container } = render(<KataBody body={'before\n\n---\n\nafter'} />)

    const rule = container.querySelector('hr')
    expect(rule).not.toBeNull()
    expect(rule).toHaveClass('border-border')
  })

  it('renders GFM strikethrough (remark-gfm wired) as <del>', () => {
    const { container } = render(<KataBody body="~~deprecated~~ approach" />)

    const del = container.querySelector('del')
    expect(del).not.toBeNull()
    expect(del).toHaveTextContent('deprecated')
  })

  it('renders a GFM table (remark-gfm wired) with header and body cells', () => {
    render(<KataBody body={'| Op | Cost |\n| --- | --- |\n| push | O(1) |'} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Op' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'push' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'O(1)' })).toBeInTheDocument()
  })

  it('renders nothing meaningful for empty input without throwing', () => {
    const { container } = render(<KataBody body="" />)

    expect(container.querySelector('h1, p, ul, ol')).toBeNull()
  })
})
