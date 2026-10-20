import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_PRACTITIONER_LOOK, PRACTITIONER_PIECES, type PractitionerDTO } from '@dojo/shared'
import { PractitionerSection } from './PractitionerSection'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: { getPractitioner: vi.fn(), updatePractitionerLook: vi.fn() },
}))

const getPractitioner = vi.mocked(api.getPractitioner)
const updateLook = vi.mocked(api.updatePractitionerLook)

const practitioner: PractitionerDTO = {
  look: DEFAULT_PRACTITIONER_LOOK,
  belt: 'yellow',
  pieces: PRACTITIONER_PIECES.map(({ id }) =>
    id === 'hachimaki'
      ? { id, earnedAt: '2026-10-20T10:00:00.000Z', progress: { current: 1, target: 1 } }
      : { id, earnedAt: null, progress: { current: 1, target: id === 'kasa' ? 3 : 7 } },
  ),
}

const tile = (name: string) => screen.getByText(name).closest('li') as HTMLElement

describe('PractitionerSection', () => {
  beforeEach(() => {
    getPractitioner.mockResolvedValue(practitioner)
    updateLook.mockReset()
  })

  it('shows earned pieces as wearable and locked ones with their condition and progress', async () => {
    render(<PractitionerSection />)

    expect(await screen.findByRole('heading', { name: 'Practitioner' })).toBeInTheDocument()
    expect(within(tile('Hachimaki')).getByRole('button', { name: 'Wear' })).toBeInTheDocument()
    const kasa = tile('Straw kasa')
    expect(within(kasa).queryByRole('button')).toBeNull()
    expect(within(kasa).getByText('Practice on 3 different days. Any verdict counts.')).toBeInTheDocument()
    expect(within(kasa).getByText('1 of 3')).toBeInTheDocument()
  })

  it('says the belt follows the rank instead of offering it as a piece', async () => {
    render(<PractitionerSection />)
    expect(await screen.findByText('Yellow belt')).toBeInTheDocument()
    expect(screen.getByText(/It follows your rank; you can't equip it/)).toBeInTheDocument()
  })

  it('saves the look when a piece is worn', async () => {
    updateLook.mockResolvedValue({ look: DEFAULT_PRACTITIONER_LOOK })
    render(<PractitionerSection />)

    await screen.findByText('Hachimaki')
    await userEvent.click(within(tile('Hachimaki')).getByRole('button', { name: 'Wear' }))

    expect(updateLook).toHaveBeenCalledWith({ ...DEFAULT_PRACTITIONER_LOOK, equip: { ...DEFAULT_PRACTITIONER_LOOK.equip, head: 'hachimaki' } })
    expect(within(tile('Hachimaki')).getByRole('button', { name: 'Take off' })).toBeInTheDocument()
  })

  it('puts the previous look back and says so when saving fails', async () => {
    updateLook.mockRejectedValue(new Error('network'))
    render(<PractitionerSection />)

    await screen.findByText('Hachimaki')
    await userEvent.click(within(tile('Hachimaki')).getByRole('button', { name: 'Wear' }))

    expect(await screen.findByText("We couldn't save that change. Try again.")).toBeInTheDocument()
    expect(within(tile('Hachimaki')).getByRole('button', { name: 'Wear' })).toBeInTheDocument()
  })
})
