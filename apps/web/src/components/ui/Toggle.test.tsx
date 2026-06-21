import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from './Toggle'

describe('Toggle', () => {
  it('renders a switch role with aria-checked reflecting the checked prop', () => {
    render(<Toggle checked ariaLabel="Notifications" onChange={vi.fn()} />)

    const toggle = screen.getByRole('switch', { name: 'Notifications' })
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('reflects aria-checked=false when unchecked', () => {
    render(<Toggle checked={false} ariaLabel="Notifications" onChange={vi.fn()} />)

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange with the negated value when toggling on', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} ariaLabel="Dark mode" onChange={onChange} />)

    await user.click(screen.getByRole('switch'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange with false when toggling off', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked ariaLabel="Dark mode" onChange={onChange} />)

    await user.click(screen.getByRole('switch'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('does not call onChange when disabled and clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} ariaLabel="Locked" disabled onChange={onChange} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()

    await user.click(toggle)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('is not disabled by default', () => {
    render(<Toggle checked={false} ariaLabel="Active" onChange={vi.fn()} />)
    expect(screen.getByRole('switch')).toBeEnabled()
  })

  it('renders without a label by default — no extra label text in the tree', () => {
    render(<Toggle checked={false} ariaLabel="Standalone" onChange={vi.fn()} />)

    // The accessible name comes from ariaLabel; there is no visible label span.
    expect(screen.queryByText('Standalone')).not.toBeInTheDocument()
  })

  it('renders the visible label text when label is provided', () => {
    render(<Toggle checked={false} label="Enable beta" onChange={vi.fn()} />)

    expect(screen.getByText('Enable beta')).toBeInTheDocument()
  })

  it('uses label as the accessible name when ariaLabel is omitted', () => {
    render(<Toggle checked={false} label="Enable beta" onChange={vi.fn()} />)

    // getByRole name resolves from aria-label (= label) on the button.
    expect(screen.getByRole('switch', { name: 'Enable beta' })).toBeInTheDocument()
  })

  it('prefers ariaLabel over label for the accessible name', () => {
    render(
      <Toggle
        checked={false}
        label="Visible label"
        ariaLabel="Accessible label"
        onChange={vi.fn()}
      />,
    )

    const toggle = screen.getByRole('switch', { name: 'Accessible label' })
    expect(toggle).toHaveAttribute('aria-label', 'Accessible label')
    // The visible label is still rendered as text even though aria-label differs.
    expect(screen.getByText('Visible label')).toBeInTheDocument()
  })

  it('clicking the visible label toggles the switch (wrapping <label> association)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} label="Enable beta" onChange={onChange} />)

    await user.click(screen.getByText('Enable beta'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('applies the accent variant classes when checked', () => {
    render(<Toggle checked ariaLabel="On" onChange={vi.fn()} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveClass('bg-accent', 'border-accent')
    expect(toggle).not.toHaveClass('bg-page', 'border-border')
  })

  it('applies the page/border variant classes when unchecked', () => {
    render(<Toggle checked={false} ariaLabel="Off" onChange={vi.fn()} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveClass('bg-page', 'border-border')
    expect(toggle).not.toHaveClass('bg-accent', 'border-accent')
  })

  it('shifts the indicator dot to the on position when checked', () => {
    const { container } = render(<Toggle checked ariaLabel="On" onChange={vi.fn()} />)

    const dot = container.querySelector('span[aria-hidden]')
    expect(dot).not.toBeNull()
    expect(dot).toHaveClass('translate-x-4', 'bg-primary')
    expect(dot).not.toHaveClass('translate-x-0.5')
  })

  it('keeps the indicator dot in the off position when unchecked', () => {
    const { container } = render(<Toggle checked={false} ariaLabel="Off" onChange={vi.fn()} />)

    const dot = container.querySelector('span[aria-hidden]')
    expect(dot).not.toBeNull()
    expect(dot).toHaveClass('translate-x-0.5', 'bg-muted')
    expect(dot).not.toHaveClass('translate-x-4')
  })

  it('applies disabled cursor/opacity styling when disabled', () => {
    render(<Toggle checked={false} ariaLabel="Locked" disabled onChange={vi.fn()} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveClass('opacity-50', 'cursor-not-allowed')
    expect(toggle).not.toHaveClass('cursor-pointer')
  })

  it('applies pointer cursor styling when enabled', () => {
    render(<Toggle checked={false} ariaLabel="Active" onChange={vi.fn()} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveClass('cursor-pointer')
    expect(toggle).not.toHaveClass('cursor-not-allowed')
  })

  it('forwards the id prop onto the switch control, not the wrapping label', () => {
    const { container } = render(
      <Toggle checked={false} label="Enable beta" id="notif-toggle" onChange={vi.fn()} />,
    )

    expect(screen.getByRole('switch')).toHaveAttribute('id', 'notif-toggle')
    expect(container.querySelector('label')).not.toHaveAttribute('id')
  })

  it('renders a button of type="button" so it never submits a form', () => {
    render(<Toggle checked={false} ariaLabel="Safe" onChange={vi.fn()} />)

    expect(screen.getByRole('switch')).toHaveAttribute('type', 'button')
  })

  it('toggles via keyboard activation (Space/Enter on the focused switch)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} ariaLabel="Keyboard" onChange={onChange} />)

    const toggle = screen.getByRole('switch')
    toggle.focus()
    expect(toggle).toHaveFocus()

    await user.keyboard('[Space]')
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('does not toggle via keyboard when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} ariaLabel="Keyboard locked" disabled onChange={onChange} />)

    await user.tab()
    await user.keyboard('[Space]')

    expect(onChange).not.toHaveBeenCalled()
  })
})
