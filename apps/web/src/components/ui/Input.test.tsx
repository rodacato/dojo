import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input, Textarea } from './Input'

describe('Input', () => {
  it('renders a textbox with the base classes', () => {
    render(<Input placeholder="email" />)
    const input = screen.getByPlaceholderText('email')
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveClass('w-full', 'font-mono', 'border', 'border-border')
  })

  it('renders the label text when label is provided', () => {
    render(<Input label="Email address" placeholder="email" />)
    const label = screen.getByText('Email address')
    expect(label.tagName).toBe('LABEL')
    expect(label).toHaveClass('font-mono', 'text-secondary')
  })

  it('omits the label element when no label prop is given', () => {
    const { container } = render(<Input placeholder="email" />)
    expect(container.querySelector('label')).toBeNull()
  })

  it('renders the hint text when hint is provided', () => {
    render(<Input hint="We never share it" />)
    const hint = screen.getByText('We never share it')
    expect(hint.tagName).toBe('P')
    expect(hint).toHaveClass('text-muted', 'text-xs')
  })

  it('omits the hint paragraph when no hint prop is given', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('appends a custom className onto the base classes', () => {
    render(<Input className="border-red-500" placeholder="email" />)
    const input = screen.getByPlaceholderText('email')
    expect(input).toHaveClass('border-red-500')
    expect(input).toHaveClass('w-full')
  })

  it('does not leave a trailing "undefined" class when className is omitted', () => {
    render(<Input placeholder="email" />)
    const input = screen.getByPlaceholderText('email')
    expect(input.className).not.toContain('undefined')
  })

  it('forwards arbitrary input attributes via the spread', () => {
    render(<Input type="password" name="secret" placeholder="pwd" required />)
    const input = screen.getByPlaceholderText('pwd')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('name', 'secret')
    expect(input).toBeRequired()
  })

  it('fires onChange per keystroke with the latest value and updates the DOM', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn<(value: string) => void>()
    render(
      <Input
        placeholder="email"
        onChange={(e) => handleChange(e.target.value)}
      />,
    )

    const input = screen.getByPlaceholderText<HTMLInputElement>('email')
    await user.type(input, 'hi')

    expect(handleChange).toHaveBeenCalledTimes(2)
    expect(handleChange).toHaveBeenNthCalledWith(1, 'h')
    expect(handleChange).toHaveBeenNthCalledWith(2, 'hi')
    expect(input.value).toBe('hi')
  })

  it('renders the controlled value passed in via the value prop', () => {
    render(<Input placeholder="email" value="locked" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText<HTMLInputElement>('email').value).toBe(
      'locked',
    )
  })

  it('blocks typing and the onChange handler when disabled', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Input placeholder="email" disabled onChange={handleChange} />)

    const input = screen.getByPlaceholderText<HTMLInputElement>('email')
    expect(input).toBeDisabled()
    await user.type(input, 'nope')

    expect(handleChange).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })

  it('renders label, input and hint together when all are provided', () => {
    render(<Input label="Username" hint="3-20 chars" placeholder="user" />)
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('user')).toBeInTheDocument()
    expect(screen.getByText('3-20 chars')).toBeInTheDocument()
  })
})

describe('Textarea', () => {
  it('renders a textarea element with the base classes', () => {
    render(<Textarea placeholder="bio" />)
    const textarea = screen.getByPlaceholderText('bio')
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea).toHaveClass('w-full', 'font-sans', 'resize-none')
  })

  it('uses font-sans (not font-mono like Input) — the variant difference', () => {
    render(<Textarea placeholder="bio" />)
    const textarea = screen.getByPlaceholderText('bio')
    expect(textarea).toHaveClass('font-sans')
    expect(textarea).not.toHaveClass('font-mono')
  })

  it('renders the label and hint when provided', () => {
    render(<Textarea label="About you" hint="markdown ok" placeholder="bio" />)
    const label = screen.getByText('About you')
    expect(label.tagName).toBe('LABEL')
    expect(screen.getByText('markdown ok').tagName).toBe('P')
  })

  it('omits label and hint when not provided', () => {
    const { container } = render(<Textarea placeholder="bio" />)
    expect(container.querySelector('label')).toBeNull()
    expect(container.querySelector('p')).toBeNull()
  })

  it('appends a custom className onto the base classes', () => {
    render(<Textarea className="h-40" placeholder="bio" />)
    const textarea = screen.getByPlaceholderText('bio')
    expect(textarea).toHaveClass('h-40', 'w-full')
  })

  it('fires onChange per keystroke and updates the DOM value', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn<(value: string) => void>()
    render(
      <Textarea
        placeholder="bio"
        onChange={(e) => handleChange(e.target.value)}
      />,
    )

    const textarea = screen.getByPlaceholderText<HTMLTextAreaElement>('bio')
    await user.type(textarea, 'ab')

    expect(handleChange).toHaveBeenCalledTimes(2)
    expect(handleChange).toHaveBeenLastCalledWith('ab')
    expect(textarea.value).toBe('ab')
  })

  it('blocks typing and onChange when disabled', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Textarea placeholder="bio" disabled onChange={handleChange} />)

    const textarea = screen.getByPlaceholderText<HTMLTextAreaElement>('bio')
    expect(textarea).toBeDisabled()
    await user.type(textarea, 'nope')

    expect(handleChange).not.toHaveBeenCalled()
    expect(textarea.value).toBe('')
  })

  it('forwards arbitrary textarea attributes via the spread', () => {
    render(<Textarea placeholder="bio" rows={6} name="bio" maxLength={200} />)
    const textarea = screen.getByPlaceholderText('bio')
    expect(textarea).toHaveAttribute('rows', '6')
    expect(textarea).toHaveAttribute('name', 'bio')
    expect(textarea).toHaveAttribute('maxLength', '200')
  })
})
