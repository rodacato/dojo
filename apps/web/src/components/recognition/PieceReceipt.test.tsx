import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_PRACTITIONER_LOOK, type PractitionerDTO } from '@dojo/shared'
import { PieceReceipt } from './PieceReceipt'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: { getPractitioner: vi.fn(), updatePractitionerLook: vi.fn() },
}))

const getPractitioner = vi.mocked(api.getPractitioner)
const updateLook = vi.mocked(api.updatePractitionerLook)
const practitioner: PractitionerDTO = { look: DEFAULT_PRACTITIONER_LOOK, belt: 'white', pieces: [] }

describe('PieceReceipt', () => {
  beforeEach(() => {
    getPractitioner.mockResolvedValue(practitioner)
    updateLook.mockReset()
  })

  it('names the new piece and says NEEDS WORK counts after a NEEDS WORK verdict', async () => {
    render(<PieceReceipt pieceIds={['hachimaki']} needsWork />)

    expect(await screen.findByText('Hachimaki')).toBeInTheDocument()
    expect(screen.getByText('First practice. NEEDS WORK counts here, too.')).toBeInTheDocument()
  })

  it('wears the piece on "Try it on"', async () => {
    updateLook.mockResolvedValue({ look: DEFAULT_PRACTITIONER_LOOK })
    render(<PieceReceipt pieceIds={['scarf']} needsWork={false} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Try it on' }))

    expect(updateLook).toHaveBeenCalledWith({ ...DEFAULT_PRACTITIONER_LOOK, equip: { ...DEFAULT_PRACTITIONER_LOOK.equip, neck: 'scarf' } })
    expect(await screen.findByText('Wearing it now')).toBeInTheDocument()
  })

  it('renders nothing when the kata earned no piece', () => {
    const { container } = render(<PieceReceipt pieceIds={[]} needsWork={false} />)
    expect(container).toBeEmptyDOMElement()
    expect(getPractitioner).not.toHaveBeenCalled()
  })
})
