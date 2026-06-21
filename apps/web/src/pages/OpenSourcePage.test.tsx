import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { OpenSourcePage } from './OpenSourcePage'

const REPO_URL = 'https://github.com/anthropics/dojo'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/open-source']}>
      <OpenSourcePage />
    </MemoryRouter>,
  )
}

function getMain() {
  return screen.getByRole('main')
}

describe('OpenSourcePage', () => {
  it('renders the hero headline and self-host pitch', () => {
    renderPage()
    const main = getMain()

    expect(
      within(main).getByRole('heading', { level: 1, name: 'Read the code that grades you.' }),
    ).toBeInTheDocument()
    expect(
      within(main).getByText(/Self-host, fork, contribute\./),
    ).toBeInTheDocument()
  })

  it('exposes the repo facts (MIT license, hexagonal architecture) in the summary bar', () => {
    renderPage()
    const main = getMain()

    expect(within(main).getByText('MIT')).toBeInTheDocument()
    expect(within(main).getByText('License')).toBeInTheDocument()
    expect(within(main).getByText('Hexagonal')).toBeInTheDocument()
  })

  it('links the primary "View on GitHub" CTA to the repo root in a new tab', () => {
    renderPage()
    const main = getMain()

    const cta = within(main).getByRole('link', { name: /View on GitHub/ })
    expect(cta).toHaveAttribute('href', REPO_URL)
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders one external card per workspace, each deep-linking into the repo tree', () => {
    renderPage()
    const main = getMain()

    const cards: Array<[string, string]> = [
      ['apps/web', `${REPO_URL}/tree/main/apps/web`],
      ['apps/api', `${REPO_URL}/tree/main/apps/api`],
      ['packages/shared', `${REPO_URL}/tree/main/packages/shared`],
      ['infra/', `${REPO_URL}/tree/main/infra`],
    ]

    for (const [name, href] of cards) {
      const card = within(main).getByRole('link', { name: new RegExp(name) })
      expect(card).toHaveAttribute('href', href)
      expect(card).toHaveAttribute('target', '_blank')
    }
  })

  it('shows the sensei system prompt sample with the rubric verdicts', () => {
    renderPage()
    const main = getMain()

    expect(
      within(main).getByRole('heading', { name: 'How the sensei works' }),
    ).toBeInTheDocument()
    expect(within(main).getByText('sensei_system_prompt.json')).toBeInTheDocument()
    expect(
      within(main).getByText(/PASSED \| PASSED_WITH_NOTES \| NEEDS_WORK/),
    ).toBeInTheDocument()
  })

  it('contrasts welcome contributions against rejected ones as distinct lists', () => {
    renderPage()
    const main = getMain()

    const welcomeList = within(main)
      .getByRole('heading', { name: "What's welcome." })
      .closest('div') as HTMLElement
    const rejectedList = within(main)
      .getByRole('heading', { name: "What's not." })
      .closest('div') as HTMLElement

    // Each item must live in its own list and be absent from the other,
    // so swapping the WELCOME / NOT_WELCOME arrays would fail here.
    expect(within(welcomeList).getByText('Accessibility fixes')).toBeInTheDocument()
    expect(within(welcomeList).queryByText('Scoring leaderboards')).not.toBeInTheDocument()

    expect(within(rejectedList).getByText('Scoring leaderboards')).toBeInTheDocument()
    expect(within(rejectedList).queryByText('Accessibility fixes')).not.toBeInTheDocument()
  })

  it('links the architecture section to a specific ADR', () => {
    renderPage()
    const main = getMain()

    const adrLink = within(main).getByRole('link', { name: /Read ADR 015/ })
    expect(adrLink).toHaveAttribute(
      'href',
      `${REPO_URL}/blob/main/docs/adr/015-bounded-contexts.md`,
    )
    expect(adrLink).toHaveAttribute('target', '_blank')
  })
})
