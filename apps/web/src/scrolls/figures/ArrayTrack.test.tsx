import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ArrayTrack, type ArrayTrackData } from './ArrayTrack'

function makeData(overrides: Partial<ArrayTrackData> = {}): ArrayTrackData {
  return {
    type: 'array-track',
    id: 'fig-1',
    input: [3, 1, 2],
    tracks: [{ label: 'pass 1', states: ['cand', 'active', 'out'] }],
    ...overrides,
  }
}

describe('ArrayTrack', () => {
  it('renders the input header row with one cell per input value', () => {
    render(
      <ArrayTrack data={makeData({ input: [3, 1, 2], tracks: [] })} />,
    )
    expect(screen.getByText('input')).toBeInTheDocument()
    // With no tracks, each value appears exactly once: in the input header row.
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('builds one cell per track, labelling each with its value and state', () => {
    render(
      <ArrayTrack
        data={makeData({
          input: ['a', 'b', 'c'],
          tracks: [{ label: 'pass 1', states: ['cand', 'active', 'out'] }],
        })}
      />,
    )
    expect(screen.getByText('pass 1')).toBeInTheDocument()
    expect(screen.getByLabelText('a · cand')).toBeInTheDocument()
    expect(screen.getByLabelText('b · active')).toBeInTheDocument()
    expect(screen.getByLabelText('c · out')).toBeInTheDocument()
  })

  it('maps each state to its distinctive mark glyph', () => {
    render(
      <ArrayTrack
        data={makeData({
          input: [1, 2, 3, 4],
          tracks: [{ label: 'glyphs', states: ['cand', 'active', 'out', 'done'] }],
        })}
      />,
    )
    expect(screen.getByLabelText('1 · cand')).toHaveTextContent('◆')
    expect(screen.getByLabelText('2 · active')).toHaveTextContent('▸')
    expect(screen.getByLabelText('3 · out')).toHaveTextContent('✕')
    expect(screen.getByLabelText('4 · done')).toHaveTextContent('✓')
  })

  it('falls back to neutral state for cells beyond the track states array', () => {
    render(
      <ArrayTrack
        data={makeData({
          input: [1, 2, 3],
          tracks: [{ label: 'short', states: ['active'] }],
        })}
      />,
    )
    expect(screen.getByLabelText('1 · active')).toBeInTheDocument()
    expect(screen.getByLabelText('2 · neutral')).toBeInTheDocument()
    expect(screen.getByLabelText('3 · neutral')).toBeInTheDocument()
  })

  it('renders the track output arrow only when output is defined', () => {
    const { rerender } = render(
      <ArrayTrack
        data={makeData({
          tracks: [{ label: 'sorted', states: ['done'], output: '[1,2,3]' }],
        })}
      />,
    )
    expect(screen.getByText('→ [1,2,3]')).toBeInTheDocument()

    rerender(
      <ArrayTrack data={makeData({ tracks: [{ label: 'no out', states: ['done'] }] })} />,
    )
    expect(screen.queryByText(/→/)).not.toBeInTheDocument()
  })

  it('renders the caption inside a figcaption when present, and omits it otherwise', () => {
    const { rerender } = render(
      <ArrayTrack data={makeData({ caption: 'bubble pass' })} />,
    )
    const caption = screen.getByText('bubble pass')
    expect(caption.tagName).toBe('FIGCAPTION')

    rerender(<ArrayTrack data={makeData({ caption: undefined })} />)
    expect(screen.queryByText('bubble pass')).not.toBeInTheDocument()
  })
})
