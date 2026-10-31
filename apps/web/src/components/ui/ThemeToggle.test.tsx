import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'
import { useTheme } from '../../hooks/useTheme'

vi.mock('../../hooks/useTheme', () => ({ useTheme: vi.fn() }))

const mockedUseTheme = vi.mocked(useTheme)
const setTheme = vi.fn()

beforeEach(() => setTheme.mockClear())

describe('ThemeToggle', () => {
  it.each([
    ['sumi', 'washi'],
    ['washi', 'sumi'],
    ['auto', 'sumi'],
  ] as const)('moves from %s to %s', async (current, next) => {
    mockedUseTheme.mockReturnValue({ theme: current, setTheme })
    render(<ThemeToggle variant="rail" />)

    await userEvent.click(screen.getByRole('button'))

    expect(setTheme).toHaveBeenCalledWith(next)
  })

  it('names the current theme in the rail', () => {
    mockedUseTheme.mockReturnValue({ theme: 'auto', setTheme })
    render(<ThemeToggle variant="rail" />)

    expect(screen.getByRole('button', { name: 'Switch theme, currently auto' })).toHaveTextContent('auto')
  })

  it('names the destination theme as text', () => {
    mockedUseTheme.mockReturnValue({ theme: 'washi', setTheme })
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch theme to sumi' })).toHaveTextContent('sumi')
  })
})
