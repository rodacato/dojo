import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { API_URL } from '../../lib/config'
import { ScrollCompleteBanner } from './ScrollCompleteBanner'

function setNavigator(overrides: { share?: unknown; clipboard?: unknown }) {
  if ('share' in overrides) {
    Object.defineProperty(navigator, 'share', {
      value: overrides.share,
      configurable: true,
      writable: true,
    })
  }
  if ('clipboard' in overrides) {
    Object.defineProperty(navigator, 'clipboard', {
      value: overrides.clipboard,
      configurable: true,
      writable: true,
    })
  }
}

function renderBanner(props: Partial<Parameters<typeof ScrollCompleteBanner>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ScrollCompleteBanner
        scrollTitle="Binary Search Unwrapped"
        scrollSlug="binary-search"
        userId="user-42"
        lessonCount={4}
        stepCount={12}
        {...props}
      />
    </MemoryRouter>,
  )
}

const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share')
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

afterEach(() => {
  restoreDescriptor('share', originalShare)
  restoreDescriptor('clipboard', originalClipboard)
})

function restoreDescriptor(key: 'share' | 'clipboard', descriptor?: PropertyDescriptor) {
  if (descriptor) {
    Object.defineProperty(navigator, key, descriptor)
  } else {
    Object.defineProperty(navigator, key, {
      value: undefined,
      configurable: true,
      writable: true,
    })
  }
}

describe('ScrollCompleteBanner', () => {
  it('renders the scroll title and the lesson/step summary', () => {
    renderBanner({ lessonCount: 4, stepCount: 12 })
    expect(
      screen.getByRole('heading', { name: 'Binary Search Unwrapped' }),
    ).toBeInTheDocument()
    expect(screen.getByText('4 lessons · 12 steps')).toBeInTheDocument()
  })

  describe('authenticated finisher', () => {
    it('offers the Share button and no anonymous sign-in notice', () => {
      renderBanner({ userId: 'user-42' })
      expect(
        screen.getByRole('button', { name: 'Share completion' }),
      ).toBeInTheDocument()
      expect(
        screen.queryByText(/You finished without an account/),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: /Sign in to save/ }),
      ).not.toBeInTheDocument()
    })
  })

  describe('anonymous finisher', () => {
    it('replaces the share button with a GitHub sign-in link and shows the save-it notice', () => {
      renderBanner({ userId: null })

      expect(
        screen.queryByRole('button', { name: 'Share completion' }),
      ).not.toBeInTheDocument()
      expect(
        screen.getByText(/You finished without an account/),
      ).toBeInTheDocument()

      const signIn = screen.getByRole('link', { name: /Sign in to save/ })
      expect(signIn).toHaveAttribute('href', `${API_URL}/auth/github`)
    })
  })

  describe('sharing', () => {
    it('copies the share text + URL to the clipboard and flips the label to "Link copied!"', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      // No navigator.share — force the clipboard fallback path.
      setNavigator({ share: undefined, clipboard: { writeText } })

      renderBanner({
        userId: 'user-42',
        scrollSlug: 'binary-search',
        scrollTitle: 'Binary Search Unwrapped',
      })

      await user.click(screen.getByRole('button', { name: 'Share completion' }))

      expect(writeText).toHaveBeenCalledTimes(1)
      const copied = writeText.mock.calls[0]?.[0] as string
      expect(copied).toContain('Completed Binary Search Unwrapped in dojo_')
      expect(copied).toContain('/share/scroll/binary-search/user-42')

      expect(
        await screen.findByRole('button', { name: 'Link copied!' }),
      ).toBeInTheDocument()
    })

    it('prefers the native share sheet when available and skips the clipboard', async () => {
      const share = vi.fn().mockResolvedValue(undefined)
      const writeText = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      setNavigator({ share, clipboard: { writeText } })

      renderBanner({ userId: 'user-42' })

      await user.click(screen.getByRole('button', { name: 'Share completion' }))

      expect(share).toHaveBeenCalledTimes(1)
      expect(writeText).not.toHaveBeenCalled()
      expect(
        screen.getByRole('button', { name: 'Share completion' }),
      ).toBeInTheDocument()
    })
  })
})
