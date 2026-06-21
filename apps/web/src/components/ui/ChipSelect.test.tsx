import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChipSelect } from './ChipSelect'

const OPTIONS = ['javascript', 'typescript', 'rust', 'ruby'] as const

describe('ChipSelect', () => {
  it('renders the text input with the provided placeholder', () => {
    render(<ChipSelect options={OPTIONS} selected={[]} onChange={vi.fn()} placeholder="Add a tag" />)
    expect(screen.getByPlaceholderText('Add a tag')).toBeInTheDocument()
  })

  it('renders no selected chips when the selection is empty', () => {
    render(<ChipSelect options={OPTIONS} selected={[]} onChange={vi.fn()} />)
    // No chip buttons exist before any selection — only the (non-button) input.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders one chip per selected value with a removable affordance', () => {
    render(<ChipSelect options={OPTIONS} selected={['rust', 'ruby']} onChange={vi.fn()} />)
    const rust = screen.getByRole('button', { name: 'rust ×' })
    const ruby = screen.getByRole('button', { name: 'ruby ×' })
    expect(rust).toBeInTheDocument()
    expect(ruby).toBeInTheDocument()
    expect(rust).toHaveClass('bg-accent/10')
  })

  it('removes a value from the selection when its chip is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ChipSelect options={OPTIONS} selected={['rust', 'ruby']} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'rust ×' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['ruby'])
  })

  it('does not render the suggestion dropdown until the user types', () => {
    render(<ChipSelect options={OPTIONS} selected={[]} onChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'javascript' })).not.toBeInTheDocument()
  })

  it('shows matching options as the query is typed', async () => {
    const user = userEvent.setup()
    render(<ChipSelect options={OPTIONS} selected={[]} onChange={vi.fn()} />)

    await user.type(screen.getByRole('textbox'), 'script')

    // 'script' is a substring of javascript and typescript, but not rust/ruby.
    expect(screen.getByRole('button', { name: 'javascript' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'typescript' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'rust' })).not.toBeInTheDocument()
  })

  it('renders no dropdown when the query matches nothing', async () => {
    const user = userEvent.setup()
    render(<ChipSelect options={OPTIONS} selected={[]} onChange={vi.fn()} />)

    await user.type(screen.getByRole('textbox'), 'cobol')

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('excludes already-selected values from the suggestion list', async () => {
    const user = userEvent.setup()
    render(<ChipSelect options={OPTIONS} selected={['typescript']} onChange={vi.fn()} />)

    await user.type(screen.getByRole('textbox'), 'script')

    // typescript is already selected, so it only appears as a chip, not a suggestion.
    expect(screen.getByRole('button', { name: 'javascript' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'typescript' })).not.toBeInTheDocument()
    // The chip with the removable marker is still present.
    expect(screen.getByRole('button', { name: 'typescript ×' })).toBeInTheDocument()
  })

  it('adds a suggestion to the selection when it is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ChipSelect options={OPTIONS} selected={['ruby']} onChange={onChange} />)

    await user.type(screen.getByRole('textbox'), 'rust')
    await user.click(screen.getByRole('button', { name: 'rust' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['ruby', 'rust'])
  })

  it('clears the query and collapses the dropdown after picking a suggestion', async () => {
    const user = userEvent.setup()
    render(<ChipSelect options={OPTIONS} selected={[]} onChange={vi.fn()} />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'rust')
    await user.click(screen.getByRole('button', { name: 'rust' }))

    expect(input).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'rust' })).not.toBeInTheDocument()
  })

  it('reflects typed characters in the controlled input value', async () => {
    const user = userEvent.setup()
    render(<ChipSelect options={OPTIONS} selected={[]} onChange={vi.fn()} />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'java')

    expect(input).toHaveValue('java')
  })

  it('does not invoke onChange merely from typing in the query field', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ChipSelect options={OPTIONS} selected={[]} onChange={onChange} />)

    await user.type(screen.getByRole('textbox'), 'rust')

    expect(onChange).not.toHaveBeenCalled()
  })
})
