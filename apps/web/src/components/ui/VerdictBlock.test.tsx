import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { VerdictBlock } from './VerdictBlock'

describe('VerdictBlock', () => {
  describe('verdict label + tone mapping', () => {
    it('renders PASSED in the success tone', () => {
      render(<VerdictBlock verdict="passed" />)
      const heading = screen.getByRole('heading', { name: 'PASSED' })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveClass('text-success')
      expect(heading).not.toHaveClass('text-warning')
      expect(heading).not.toHaveClass('text-danger')
    })

    it('renders PASSED WITH NOTES in the warning tone', () => {
      render(<VerdictBlock verdict="passed_with_notes" />)
      const heading = screen.getByRole('heading', { name: 'PASSED WITH NOTES' })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveClass('text-warning')
      expect(heading).not.toHaveClass('text-success')
    })

    it('renders NEEDS WORK in the danger tone', () => {
      render(<VerdictBlock verdict="needs_work" />)
      const heading = screen.getByRole('heading', { name: 'NEEDS WORK' })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveClass('text-danger')
      expect(heading).not.toHaveClass('text-success')
    })
  })

  describe('size variants', () => {
    it('uses the md verdict size by default', () => {
      render(<VerdictBlock verdict="passed" />)
      const heading = screen.getByRole('heading', { name: 'PASSED' })
      expect(heading).toHaveClass('text-2xl')
      expect(heading).not.toHaveClass('text-4xl')
    })

    it('uses the larger hero verdict size when size="lg"', () => {
      render(<VerdictBlock verdict="passed" size="lg" />)
      const heading = screen.getByRole('heading', { name: 'PASSED' })
      expect(heading).toHaveClass('text-4xl', 'md:text-5xl')
      expect(heading).not.toHaveClass('text-2xl')
    })
  })

  describe('persona eyebrow', () => {
    it('renders the role eyebrow when a role is provided', () => {
      render(<VerdictBlock verdict="passed" role="Sensei" />)
      expect(screen.getByText('[Sensei]')).toBeInTheDocument()
    })

    it('omits the eyebrow when no role is given', () => {
      const { container } = render(<VerdictBlock verdict="passed" />)
      // The eyebrow renders bracketed text; nothing bracketed should appear.
      expect(container.textContent).not.toContain('[')
    })
  })

  describe('body children', () => {
    it('renders feedback children inside the body region', () => {
      render(
        <VerdictBlock verdict="passed_with_notes">
          Tighten the error handling on the edges.
        </VerdictBlock>,
      )
      expect(
        screen.getByText('Tighten the error handling on the edges.'),
      ).toBeInTheDocument()
    })

    it('does not render the body wrapper when there are no children', () => {
      const { container } = render(<VerdictBlock verdict="passed" />)
      expect(container.querySelector('.whitespace-pre-wrap')).toBeNull()
    })
  })

  describe('topics to review', () => {
    it('lists each topic chip under a "Topics to review" label', () => {
      render(
        <VerdictBlock
          verdict="needs_work"
          topics={['recursion', 'big-o', 'memoization']}
        />,
      )
      expect(screen.getByText('Topics to review')).toBeInTheDocument()
      expect(screen.getByText('recursion')).toBeInTheDocument()
      expect(screen.getByText('big-o')).toBeInTheDocument()
      expect(screen.getByText('memoization')).toBeInTheDocument()
    })

    it('hides the topics section when the list is empty', () => {
      render(<VerdictBlock verdict="passed" topics={[]} />)
      expect(screen.queryByText('Topics to review')).not.toBeInTheDocument()
    })

    it('hides the topics section when topics are not provided', () => {
      render(<VerdictBlock verdict="passed" />)
      expect(screen.queryByText('Topics to review')).not.toBeInTheDocument()
    })
  })

  describe('cta slot', () => {
    it('renders a provided cta node', () => {
      render(
        <VerdictBlock
          verdict="passed"
          cta={<button type="button">Next kata</button>}
        />,
      )
      expect(
        screen.getByRole('button', { name: 'Next kata' }),
      ).toBeInTheDocument()
    })

    it('omits the cta wrapper when no cta is given', () => {
      render(<VerdictBlock verdict="passed" />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('decorative ink stroke', () => {
    it('always renders the left ink stroke marked aria-hidden so it is not announced', () => {
      const { container } = render(<VerdictBlock verdict="passed" />)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
      expect(svg).toHaveAttribute('aria-hidden')
      expect(svg?.querySelector('path.brushstroke-path-vertical')).not.toBeNull()
    })
  })
})
