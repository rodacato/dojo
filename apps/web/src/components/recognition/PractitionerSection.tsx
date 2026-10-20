import { useEffect, useState } from 'react'
import {
  GI_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  PRACTITIONER_BACKDROP,
  PRACTITIONER_PIECES,
  SKIN_TONES,
  type BeltRank,
  type PractitionerDTO,
  type PractitionerLook,
  type PractitionerPieceDTO,
} from '@dojo/shared'
import { api } from '../../lib/api'
import { Button } from '../ui/Button'
import { PractitionerCanvas } from './PractitionerCanvas'
import { ProgressPips } from './ProgressPips'


export function PractitionerSection() {
  const [data, setData] = useState<PractitionerDTO | null>(null)
  const [failed, setFailed] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .getPractitioner()
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) return <p className="text-secondary text-sm mb-10">We couldn't load your practitioner.</p>
  if (!data) return null

  const changeLook = (look: PractitionerLook) => {
    const previous = data.look
    setData({ ...data, look })
    setSaveFailed(false)
    api.updatePractitionerLook(look).catch(() => {
      setData((current) => (current ? { ...current, look: previous } : current))
      setSaveFailed(true)
    })
  }

  const byId = new Map(data.pieces.map((piece) => [piece.id, piece]))
  const beltName = `${data.belt[0]!.toUpperCase()}${data.belt.slice(1)} belt`

  return (
    <section className="mb-12" aria-labelledby="practitioner-heading">
      <div className="mb-6">
        <h2 id="practitioner-heading" className="text-primary text-xl font-semibold tracking-tight">Practitioner</h2>
        <p className="text-secondary text-sm">Easy. Showing up is enough.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="shrink-0 self-start rounded-sm p-3" style={{ backgroundColor: PRACTITIONER_BACKDROP }}>
          <PractitionerCanvas look={data.look} belt={data.belt} scale={6} label="Your practitioner" />
        </div>
        <LookControls look={data.look} onChange={changeLook} />
      </div>
      <p className="text-secondary text-sm mb-6">
        Belt: <span className="text-primary">{beltName}</span>. It follows your rank; you can't equip it.
      </p>
      {saveFailed && <p className="text-danger-text text-sm mb-4">We couldn't save that change. Try again.</p>}

      <h3 className="font-mono text-xs tracking-[0.08em] uppercase text-secondary mb-3">Pieces</h3>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PRACTITIONER_PIECES.map((piece) => (
          <PieceTile
            key={piece.id}
            piece={piece}
            state={byId.get(piece.id)!}
            look={data.look}
            belt={data.belt}
            onToggle={(wear) => changeLook({ ...data.look, equip: { ...data.look.equip, [piece.slot]: wear ? piece.id : null } })}
          />
        ))}
      </ul>
    </section>
  )
}

function LookControls({ look, onChange }: Readonly<{ look: PractitionerLook; onChange: (look: PractitionerLook) => void }>) {
  return (
    <div className="grid gap-3 content-start">
      <SwatchRow label="Skin" values={SKIN_TONES} current={look.skin} onPick={(skin) => onChange({ ...look, skin })} />
      <SwatchRow label="Hair" values={HAIR_COLORS} current={look.hair} onPick={(hair) => onChange({ ...look, hair })} />
      <ChipRow label="Style" values={HAIR_STYLES} current={look.hairStyle} onPick={(hairStyle) => onChange({ ...look, hairStyle })} />
      <ChipRow label="Gi" values={GI_COLORS} current={look.gi} onPick={(gi) => onChange({ ...look, gi })} />
    </div>
  )
}

interface RowProps<T extends string> {
  label: string
  values: readonly T[]
  current: T
  onPick: (value: T) => void
}

function SwatchRow<T extends string>({ label, values, current, onPick }: Readonly<RowProps<T>>) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="w-12 text-secondary text-xs">{label}</span>
      {values.map((value, i) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} ${i + 1}`}
          aria-pressed={value === current}
          onClick={() => onPick(value)}
          className={`w-7 h-7 rounded-sm border-2 ${value === current ? 'border-primary' : 'border-transparent'}`}
          style={{ backgroundColor: value }}
        />
      ))}
    </div>
  )
}

function ChipRow<T extends string>({ label, values, current, onPick }: Readonly<RowProps<T>>) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="w-12 text-secondary text-xs">{label}</span>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={value === current}
          onClick={() => onPick(value)}
          className={`h-7 px-2 rounded-sm border text-sm bg-elevated ${value === current ? 'border-primary text-primary' : 'border-border text-secondary'}`}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

interface TileProps {
  piece: (typeof PRACTITIONER_PIECES)[number]
  state: PractitionerPieceDTO
  look: PractitionerLook
  belt: BeltRank
  onToggle: (wear: boolean) => void
}

function PieceTile({ piece, state, look, belt, onToggle }: Readonly<TileProps>) {
  const earned = state.earnedAt !== null
  const worn = look.equip[piece.slot] === piece.id
  const idleBorder = 'season' in piece ? 'border-warning/50' : 'border-border'
  return (
    <li className={`bg-surface border rounded-sm p-3 flex flex-col gap-2 ${worn ? 'border-primary' : idleBorder}`}>
      <div className="mx-auto rounded-sm" style={{ backgroundColor: PRACTITIONER_BACKDROP }}>
        <PractitionerCanvas look={look} belt={belt} scale={4} framing="bust" piece={{ id: piece.id, earned }} />
      </div>
      <div>
        <p className="text-primary text-sm font-medium">{piece.name}</p>
        <p className={`font-mono text-[11px] tracking-[0.04em] uppercase ${'season' in piece ? 'text-warning-text' : 'text-secondary'}`}>
          {piece.source}
        </p>
      </div>
      {earned ? (
        <Button variant="ghost" size="sm" aria-pressed={worn} onClick={() => onToggle(!worn)}>
          {worn ? 'Take off' : 'Wear'}
        </Button>
      ) : (
        <div className="grid gap-1">
          <p className="text-secondary text-xs">{piece.condition}</p>
          <ProgressPips current={state.progress.current} target={state.progress.target} tone="easy" />
        </div>
      )}
    </li>
  )
}
