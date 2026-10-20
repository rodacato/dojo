import { PRACTITIONER_BACKDROP, findPiece, type PublicPractitionerDTO } from '@dojo/shared'
import { PractitionerCanvas } from './PractitionerCanvas'

interface Props {
  username: string
  practitioner: PublicPractitionerDTO
}

export function PublicPractitioner({ username, practitioner }: Readonly<Props>) {
  const pieces = practitioner.earnedPieces.flatMap(({ id, earnedAt }) => {
    const piece = findPiece(id)
    return piece ? [{ ...piece, earnedAt }] : []
  })

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="shrink-0 self-start rounded-sm p-3" style={{ backgroundColor: PRACTITIONER_BACKDROP }}>
        <PractitionerCanvas look={practitioner.look} belt={practitioner.belt} scale={5} label={`${username}'s practitioner`} />
      </div>
      {pieces.length === 0 ? (
        <p className="text-secondary text-sm">No pieces yet.</p>
      ) : (
        <ul className="grid gap-3 content-start">
          {pieces.map((piece) => (
            <li key={piece.id}>
              <p className="text-primary text-sm font-medium">{piece.name}</p>
              <p className="font-mono text-xs tracking-[0.04em] uppercase text-secondary">
                {piece.source} · {piece.earnedAt.slice(0, 10)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
