import { useState, type CSSProperties } from 'react'
import type { BeltRank } from '@dojo/shared'
import { Button } from '../ui/Button'
import { artUrl, type BelongingId } from './belongings'

const ROOM_WIDTH = 1916
const ROOM_HEIGHT = 821
const SITTER_X = { desktop: 610, mobile: 655 }
const LANTERN_X = { desktop: 1550, mobile: 1435 }
const BONSAI_X = { desktop: 1325, mobile: 1260 }

// Figure art exists for these belts only; the others show the room without a figure.
const FIGURE_BELTS: ReadonlySet<BeltRank> = new Set<BeltRank>(['white', 'green'])

interface LayerProps {
  art: string
  x: number | { desktop: number; mobile: number }
  bottom: number
  width: number
}

function Layer({ art, x, bottom, width }: Readonly<LayerProps>) {
  const { desktop, mobile } = typeof x === 'number' ? { desktop: x, mobile: x } : x
  const left = (center: number) => `${((center - width / 2) / ROOM_WIDTH) * 100}%`
  const style = {
    '--layer-left': left(desktop),
    '--layer-left-mobile': left(mobile),
    bottom: `${((ROOM_HEIGHT - bottom) / ROOM_HEIGHT) * 100}%`,
    width: `${(width / ROOM_WIDTH) * 100}%`,
  } as CSSProperties
  return (
    <img
      src={artUrl(art)}
      alt=""
      className="absolute left-(--layer-left-mobile) md:left-(--layer-left)"
      style={style}
    />
  )
}

function roomDescription(rank: BeltRank, belongings: BelongingId[]): string {
  const objects = belongings.length > 0 ? `, with your ${belongings.join(', ')}` : ''
  const figure = FIGURE_BELTS.has(rank) ? ` A practitioner sits in a ${rank} belt.` : ''
  return `A quiet room in your dojo${objects}.${figure}`
}

interface DojoRoomProps {
  rank: BeltRank
  belongings: BelongingId[]
}

export function DojoRoom({ rank, belongings }: Readonly<DojoRoomProps>) {
  const [light, setLight] = useState<'day' | 'evening'>('day')
  const [artFailed, setArtFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const has = (id: BelongingId) => belongings.includes(id)
  const evening = light === 'evening'

  return (
    <figure className="mb-8 md:mb-10">
      <div className="relative overflow-hidden rounded-[2px] bg-surface aspect-4/3 md:aspect-1916/821">
        {artFailed ? (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-4 text-center" role="alert">
            <p className="paper-body">The room couldn't load.</p>
            <Button
              variant="ghost"
              onClick={() => {
                setArtFailed(false)
                setAttempt((n) => n + 1)
              }}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div
            key={attempt}
            role="img"
            aria-label={roomDescription(rank, belongings)}
            className="absolute inset-y-0 left-1/2 h-full -translate-x-1/2 aspect-1916/821"
          >
            <img src={artUrl('room')} alt="" className="absolute inset-0 size-full" onError={() => setArtFailed(true)} />
            {has('lantern') && <Layer art="lantern" x={LANTERN_X} bottom={692} width={126} />}
            {has('tea') && (
              <>
                <Layer art="table" x={990} bottom={700} width={360} />
                <Layer art="teapot" x={955} bottom={565} width={100} />
                <Layer art="cups" x={1070} bottom={572} width={112} />
              </>
            )}
            {has('bonsai') && <Layer art="bonsai" x={BONSAI_X} bottom={710} width={225} />}
            {has('cushion') && <Layer art="cushion" x={SITTER_X} bottom={730} width={410} />}
            {FIGURE_BELTS.has(rank) && (
              <Layer art={`figure-${rank}`} x={SITTER_X} bottom={has('cushion') ? 704 : 724} width={390} />
            )}
            {evening && <div className="absolute inset-0 bg-[rgb(18_30_51/0.58)]" />}
            {evening && has('lantern') && (
              <div className="absolute left-[63%] md:left-[69%] top-[38%] w-[23.5%] aspect-square rounded-full bg-[radial-gradient(circle,rgb(255_202_112/0.46),transparent_70%)]" />
            )}
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-4">
        <p className="paper-body">Practice leaves a mark.</p>
        <div className="flex gap-1" role="group" aria-label="Room light">
          {(['day', 'evening'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={light === value}
              onClick={() => setLight(value)}
              className={`min-h-11 px-3 font-mono text-[11px] capitalize rounded-[2px] border ${
                light === value ? 'border-primary bg-surface text-primary' : 'border-transparent text-secondary'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  )
}
