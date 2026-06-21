import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChipInput } from './ChipInput'

function getTextbox(): HTMLInputElement {
  return screen.getByRole('textbox') as HTMLInputElement
}

describe('ChipInput', () => {
  it('renders one chip per value with a remove button each', () => {
    render(<ChipInput value={['react', 'vitest']} onChange={vi.fn()} />)

    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('vitest')).toBeInTheDocument()
    // Each chip carries its own remove (×) button.
    expect(screen.getAllByRole('button', { name: '×' })).toHaveLength(2)
  })

  it('renders no chips and no remove buttons when value is empty', () => {
    render(<ChipInput value={[]} onChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: '×' })).not.toBeInTheDocument()
  })

  it('shows the placeholder only while there are no chips', () => {
    const { rerender } = render(
      <ChipInput value={[]} onChange={vi.fn()} placeholder="add a tag" />,
    )
    expect(getTextbox()).toHaveAttribute('placeholder', 'add a tag')

    rerender(
      <ChipInput value={['react']} onChange={vi.fn()} placeholder="add a tag" />,
    )
    expect(getTextbox()).toHaveAttribute('placeholder', '')
  })

  it('adds a chip via Enter, calling onChange with the appended value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={['react']} onChange={onChange} />)

    await user.type(getTextbox(), 'vitest')
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(['react', 'vitest'])
  })

  it('trims and lowercases the typed value before adding', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={[]} onChange={onChange} />)

    await user.type(getTextbox(), '  ReAct  ')
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(['react'])
  })

  it('clears the input after a successful add', async () => {
    const user = userEvent.setup()
    render(<ChipInput value={[]} onChange={vi.fn()} />)

    const input = getTextbox()
    await user.type(input, 'react')
    await user.keyboard('{Enter}')

    expect(input).toHaveValue('')
  })

  it('does not add a duplicate (case/whitespace-normalized) chip', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={['react']} onChange={onChange} />)

    await user.type(getTextbox(), '  REACT ')
    await user.keyboard('{Enter}')

    expect(onChange).not.toHaveBeenCalled()
    // Input is still cleared even though nothing was added.
    expect(getTextbox()).toHaveValue('')
  })

  it('does not add an empty / whitespace-only value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={[]} onChange={onChange} />)

    await user.type(getTextbox(), '   ')
    await user.keyboard('{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('removes the last chip on Backspace when the input is empty', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={['react', 'vitest']} onChange={onChange} />)

    getTextbox().focus()
    await user.keyboard('{Backspace}')

    expect(onChange).toHaveBeenCalledWith(['react'])
  })

  it('does not fire onChange on Backspace when the input has text', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={['react']} onChange={onChange} />)

    await user.type(getTextbox(), 'a')
    await user.keyboard('{Backspace}')

    // Backspace edited the input text, not the chip list.
    expect(onChange).not.toHaveBeenCalled()
    expect(getTextbox()).toHaveValue('')
  })

  it('does not fire onChange on Backspace when there are no chips', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={[]} onChange={onChange} />)

    getTextbox().focus()
    await user.keyboard('{Backspace}')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('removes a specific chip when its × button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={['react', 'vitest', 'jsdom']} onChange={onChange} />)

    // Target the middle chip's own remove button so we assert the right one.
    const middleChip = screen.getByText('vitest')
    const removeMiddle = within(middleChip).getByRole('button', { name: '×' })
    await user.click(removeMiddle)

    expect(onChange).toHaveBeenCalledWith(['react', 'jsdom'])
  })

  it('adds the pending value on blur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChipInput value={[]} onChange={onChange} />)

    await user.type(getTextbox(), 'react')
    // Blur by tabbing away from the input.
    await user.tab()

    expect(onChange).toHaveBeenCalledWith(['react'])
  })
})
