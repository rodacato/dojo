import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the eyebrow and headline text the user reads', () => {
    render(<EmptyState eyebrow="Empty · Kata history" headline="No katas yet." />)

    expect(screen.getByText('Empty · Kata history')).toBeInTheDocument()
    expect(screen.getByText('No katas yet.')).toBeInTheDocument()
  })

  it('renders the leading decorative dot as aria-hidden so it is not announced', () => {
    const { container } = render(<EmptyState eyebrow="Empty" headline="Nothing here." />)

    const dot = container.querySelector('[aria-hidden]')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveClass('bg-danger/80')
  })

  it('omits microcopy when the prop is not provided', () => {
    render(<EmptyState eyebrow="Empty" headline="Nothing here." />)

    expect(screen.queryByText('extra context')).not.toBeInTheDocument()
  })

  it('renders microcopy when provided', () => {
    render(
      <EmptyState eyebrow="Empty" headline="Nothing here." microcopy="extra context" />,
    )

    expect(screen.getByText('extra context')).toBeInTheDocument()
  })

  it('does not render the action cluster when no actions are passed', () => {
    const { container } = render(<EmptyState eyebrow="Empty" headline="Nothing here." />)

    // The action cluster is the only element with the mt-6 layout class.
    expect(container.querySelector('.mt-6')).not.toBeInTheDocument()
  })

  it('renders the primary action node', () => {
    render(
      <EmptyState
        eyebrow="Empty"
        headline="Nothing here."
        action={<button type="button">Create kata</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Create kata' })).toBeInTheDocument()
  })

  it('renders both primary and secondary action nodes inside the cluster', () => {
    const { container } = render(
      <EmptyState
        eyebrow="Empty"
        headline="Nothing here."
        action={<button type="button">Create kata</button>}
        secondaryAction={<button type="button">Learn more</button>}
      />,
    )

    const cluster = container.querySelector('.mt-6')
    expect(cluster).toBeInTheDocument()
    expect(cluster).toContainElement(screen.getByRole('button', { name: 'Create kata' }))
    expect(cluster).toContainElement(screen.getByRole('button', { name: 'Learn more' }))
  })

  it('renders the action cluster when only a secondary action is provided', () => {
    const { container } = render(
      <EmptyState
        eyebrow="Empty"
        headline="Nothing here."
        secondaryAction={<button type="button">Learn more</button>}
      />,
    )

    expect(container.querySelector('.mt-6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
  })

  it('forwards user clicks to the action node handler', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <EmptyState
        eyebrow="Empty"
        headline="Nothing here."
        action={
          <button type="button" onClick={onClick}>
            Create kata
          </button>
        }
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create kata' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('uses the bordered card wrapper by default', () => {
    const { container } = render(<EmptyState eyebrow="Empty" headline="Nothing here." />)

    const wrapper = container.firstElementChild
    expect(wrapper).toHaveClass('border', 'border-border', 'bg-surface')
  })

  it('renders the inline variant without the card border/surface classes', () => {
    const { container } = render(
      <EmptyState eyebrow="Empty" headline="Nothing here." variant="inline" />,
    )

    const wrapper = container.firstElementChild
    expect(wrapper).not.toHaveClass('border')
    expect(wrapper).not.toHaveClass('bg-surface')
    // Shared layout classes survive across variants.
    expect(wrapper).toHaveClass('px-6', 'py-12', 'text-center')
  })

  it('appends a caller-provided className to the wrapper', () => {
    const { container } = render(
      <EmptyState eyebrow="Empty" headline="Nothing here." className="my-custom-class" />,
    )

    expect(container.firstElementChild).toHaveClass('my-custom-class')
    // className composes with the variant classes rather than replacing them.
    expect(container.firstElementChild).toHaveClass('border')
  })
})
