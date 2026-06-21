import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GroupButtons } from './GroupButtons'

type Range = 'day' | 'week' | 'month'

const rangeOptions: Array<{ value: Range; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

describe('GroupButtons', () => {
  it('renders one button per option with its label', () => {
    render(<GroupButtons options={rangeOptions} value={null} onChange={vi.fn()} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument()
  })

  it('renders no buttons when options is empty', () => {
    render(<GroupButtons<Range> options={[]} value={null} onChange={vi.fn()} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onChange with the clicked option value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<GroupButtons options={rangeOptions} value="day" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Week' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('week')
  })

  it('fires onChange even when the already-selected option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<GroupButtons options={rangeOptions} value="day" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Day' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('day')
  })

  it('marks only the matching option as active and the rest as inactive', () => {
    render(<GroupButtons options={rangeOptions} value="week" onChange={vi.fn()} />)

    const active = screen.getByRole('button', { name: 'Week' })
    expect(active).toHaveClass('bg-accent', 'text-primary')
    expect(active).not.toHaveClass('text-muted')

    const inactive = screen.getByRole('button', { name: 'Day' })
    expect(inactive).toHaveClass('text-muted')
    expect(inactive).not.toHaveClass('bg-accent')
  })

  it('renders every option inactive when value is null', () => {
    render(<GroupButtons options={rangeOptions} value={null} onChange={vi.fn()} />)

    for (const { label } of rangeOptions) {
      const button = screen.getByRole('button', { name: label })
      expect(button).toHaveClass('text-muted')
      expect(button).not.toHaveClass('bg-accent')
    }
  })

  it('applies the small size classes by default', () => {
    render(<GroupButtons options={rangeOptions} value="day" onChange={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Day' })
    expect(button).toHaveClass('px-3', 'py-1', 'text-xs')
    expect(button).not.toHaveClass('px-4', 'text-sm')
  })

  it('applies the medium size classes when size="md"', () => {
    render(<GroupButtons options={rangeOptions} value="day" onChange={vi.fn()} size="md" />)

    const button = screen.getByRole('button', { name: 'Day' })
    expect(button).toHaveClass('px-4', 'py-1.5', 'text-sm')
    expect(button).not.toHaveClass('px-3', 'text-xs')
  })

  it('reflects a controlled value change on re-render', () => {
    const { rerender } = render(
      <GroupButtons options={rangeOptions} value="day" onChange={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Day' })).toHaveClass('bg-accent')
    expect(screen.getByRole('button', { name: 'Month' })).not.toHaveClass('bg-accent')

    rerender(<GroupButtons options={rangeOptions} value="month" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Day' })).not.toHaveClass('bg-accent')
    expect(screen.getByRole('button', { name: 'Month' })).toHaveClass('bg-accent')
  })
})
