import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FocusedHeader } from './FocusedHeader'

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'washi', setTheme: vi.fn() }),
}))

describe('FocusedHeader', () => {
  it('places its slots and always offers the theme', () => {
    render(<FocusedHeader leading={<span>leave</span>} center={<span>04:59</span>} trailing={<span>submit</span>} />)

    const header = screen.getByRole('banner')
    expect(header).toHaveTextContent('leave')
    expect(header).toHaveTextContent('04:59')
    expect(header).toHaveTextContent('submit')
    expect(screen.getByRole('button', { name: 'Switch theme to sumi' })).toBeInTheDocument()
  })

  it('offers no way out through the mark', () => {
    render(<FocusedHeader />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
