import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { BeforeAfter, type BeforeAfterData } from './BeforeAfter'

function makeData(overrides: Partial<BeforeAfterData> = {}): BeforeAfterData {
  return {
    type: 'before-after',
    id: 'ex-1',
    language: 'ts',
    left: { title: 'Naive', code: 'const a = 1\nconst b = 2' },
    right: { title: 'Optimized', code: 'const a = 1\nconst b = 2' },
    ...overrides,
  }
}

describe('BeforeAfter', () => {
  it('renders both pane titles and the before/after side labels', () => {
    render(<BeforeAfter data={makeData()} />)

    expect(screen.getByText('Naive')).toBeInTheDocument()
    expect(screen.getByText('Optimized')).toBeInTheDocument()
    expect(screen.getByText('before')).toBeInTheDocument()
    expect(screen.getByText('after')).toBeInTheDocument()
  })

  it('splits each pane code into one row per line', () => {
    render(
      <BeforeAfter
        data={makeData({
          left: { title: 'L', code: 'line one\nline two\nline three' },
          right: { title: 'R', code: 'only line' },
        })}
      />,
    )

    expect(screen.getByText('line one')).toBeInTheDocument()
    expect(screen.getByText('line two')).toBeInTheDocument()
    expect(screen.getByText('line three')).toBeInTheDocument()
    expect(screen.getByText('only line')).toBeInTheDocument()
  })

  it('places an annotation mark and its note on the targeted line only', () => {
    render(
      <BeforeAfter
        data={makeData({
          left: {
            title: 'Bad',
            code: 'first\nsecond\nthird',
            annotations: [{ line: 2, mark: '✕', text: 'mutates state' }],
          },
        })}
      />,
    )

    const annotatedRow = screen.getByText('second').closest('div')
    expect(annotatedRow).not.toBeNull()
    expect(within(annotatedRow as HTMLElement).getByText('✕')).toBeInTheDocument()
    expect(within(annotatedRow as HTMLElement).getByText('mutates state')).toBeInTheDocument()

    const cleanRow = screen.getByText('first').closest('div') as HTMLElement
    expect(within(cleanRow).queryByText('✕')).toBeNull()
    expect(within(cleanRow).queryByText('mutates state')).toBeNull()
  })

  it('colors the ✕ mark with the out state and ✓ with the done state', () => {
    render(
      <BeforeAfter
        data={makeData({
          left: { title: 'L', code: 'a', annotations: [{ line: 1, mark: '✕' }] },
          right: { title: 'R', code: 'b', annotations: [{ line: 1, mark: '✓' }] },
        })}
      />,
    )

    expect(screen.getByText('✕')).toHaveClass('text-state-out')
    expect(screen.getByText('✓')).toHaveClass('text-state-done')
  })

  it('renders the caption inside a figcaption when provided', () => {
    render(<BeforeAfter data={makeData({ caption: 'Prefer immutable updates' })} />)

    const caption = screen.getByText('Prefer immutable updates')
    expect(caption.tagName).toBe('FIGCAPTION')
  })

  it('omits the figcaption when no caption is given', () => {
    const { container } = render(<BeforeAfter data={makeData()} />)
    expect(container.querySelector('figcaption')).toBeNull()
  })

  it('drops a trailing newline rather than rendering a phantom empty line', () => {
    render(
      <BeforeAfter
        data={makeData({ left: { title: 'L', code: 'only\n' }, right: { title: 'R', code: 'x' } })}
      />,
    )

    const codeEls = screen.getAllByText((_, el) => el?.tagName === 'CODE')
    const leftPaneCodes = codeEls.filter((el) => el.textContent === 'only')
    expect(leftPaneCodes).toHaveLength(1)
  })
})
