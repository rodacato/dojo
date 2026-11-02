import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Verdict } from '@dojo/shared'
import { ReviewVerdict } from './PostKata'

describe('ReviewVerdict', () => {
  it.each<Verdict>(['passed', 'passed_with_notes', 'needs_work'])('shows the same sensei for %s', (verdict) => {
    render(<ReviewVerdict verdict={verdict} />)

    expect(screen.getByTestId('sensei-explain')).toHaveAttribute('src', '/art/sensei/explain.webp')
    expect(screen.queryByTestId('sensei-review')).not.toBeInTheDocument()
  })
})
