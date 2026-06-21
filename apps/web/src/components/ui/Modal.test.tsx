import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false}>
        <p>Hidden content</p>
      </Modal>
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders children when open', () => {
    render(
      <Modal open>
        <h2>Dojo dialog</h2>
        <p>Visible body</p>
      </Modal>
    )
    expect(screen.getByRole('heading', { name: 'Dojo dialog' })).toBeInTheDocument()
    expect(screen.getByText('Visible body')).toBeInTheDocument()
  })

  it('locks body scroll while open and restores it on unmount', () => {
    const { unmount } = render(
      <Modal open>
        <p>Body lock</p>
      </Modal>
    )
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('does not lock body scroll while closed', () => {
    render(
      <Modal open={false}>
        <p>No lock</p>
      </Modal>
    )
    expect(document.body.style.overflow).toBe('')
  })

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Escapable</p>
      </Modal>
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose on Escape when flow is true', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} flow>
        <p>Flow content</p>
      </Modal>
    )
    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not call onClose on a non-Escape key', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Keyed content</p>
      </Modal>
    )
    await user.keyboard('{Enter}')
    await user.keyboard('a')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when the overlay (outside the panel) is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Panel content</p>
      </Modal>
    )
    const panel = screen.getByText('Panel content').parentElement as HTMLElement
    const overlay = panel.parentElement as HTMLElement
    await user.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when content inside the panel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <button type="button">Inside action</button>
      </Modal>
    )
    await user.click(screen.getByRole('button', { name: 'Inside action' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not call onClose on overlay click when flow is true', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} flow>
        <p>Flow panel</p>
      </Modal>
    )
    const panel = screen.getByText('Flow panel').parentElement as HTMLElement
    const overlay = panel.parentElement as HTMLElement
    await user.click(overlay)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders the dimmed overlay styling when open', () => {
    render(
      <Modal open>
        <p>Styled content</p>
      </Modal>
    )
    const panel = screen.getByText('Styled content').parentElement as HTMLElement
    const overlay = panel.parentElement as HTMLElement
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/60')
  })

  it('does not throw when overlay is clicked without an onClose handler', async () => {
    const user = userEvent.setup()
    render(
      <Modal open>
        <p>No handler</p>
      </Modal>
    )
    const panel = screen.getByText('No handler').parentElement as HTMLElement
    const overlay = panel.parentElement as HTMLElement
    await user.click(overlay)
    expect(screen.getByText('No handler')).toBeInTheDocument()
  })

  it('reflects a controlled open prop: closed then opened', () => {
    const { rerender } = render(
      <Modal open={false}>
        <p>Toggled body</p>
      </Modal>
    )
    expect(screen.queryByText('Toggled body')).not.toBeInTheDocument()
    rerender(
      <Modal open>
        <p>Toggled body</p>
      </Modal>
    )
    expect(screen.getByText('Toggled body')).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('stops responding to Escape after it is closed via rerender', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(
      <Modal open onClose={onClose}>
        <p>Closing body</p>
      </Modal>
    )
    rerender(
      <Modal open={false} onClose={onClose}>
        <p>Closing body</p>
      </Modal>
    )
    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
    expect(document.body.style.overflow).toBe('')
  })
})
