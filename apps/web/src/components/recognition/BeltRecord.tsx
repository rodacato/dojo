import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BeltDTO, BeltPromotionDTO, BeltRank, NextBeltDTO } from '@dojo/shared'
import { artUrl } from './belongings'

const RANKS: BeltRank[] = ['white', 'yellow', 'green', 'brown', 'black']

const FACTORS = [
  { key: 'completed', label: 'Kata completed' },
  { key: 'distinctClusters', label: 'Topic clusters' },
  { key: 'activeDays30', label: 'Active days (30)' },
  { key: 'daysAtRank', label: 'Days at rank' },
] as const

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export const formatDate = (iso: string) => DATE_FORMATTER.format(new Date(iso))

function rankStatus(rank: BeltRank, current: BeltRank, reached: boolean): string {
  if (rank === current) return 'Current belt'
  if (reached) return rank === 'white' ? 'Starting belt' : 'Earned'
  return RANKS.indexOf(rank) === RANKS.indexOf(current) + 1 ? 'Next belt' : 'Ahead'
}

function beltDetail(rank: BeltRank, reachedAt: string | undefined, nextRank: BeltRank | undefined): string {
  if (reachedAt) return `${rank === 'white' ? 'Started' : 'Reached'} ${formatDate(reachedAt)}.`
  if (rank === 'white') return 'Your starting belt. Your first kata is still ahead.'
  return rank === nextRank ? 'Next belt. Its criteria are below.' : 'Further along, at your own pace.'
}

interface BeltRecordProps {
  belt: BeltDTO
  record: BeltPromotionDTO[]
  next: NextBeltDTO | null
}

export function BeltRecord({ belt, record, next }: Readonly<BeltRecordProps>) {
  const reachedAt = new Map(record.map((promotion) => [promotion.rank, promotion.reachedAt]))
  const [selected, setSelected] = useState<BeltRank>(belt.rank)
  const trackRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const current = track?.querySelector<HTMLElement>('[aria-current="step"]')
    if (track && current) track.scrollLeft = Math.max(0, current.offsetLeft - (track.clientWidth - current.offsetWidth) / 2)
  }, [])

  return (
    <section id="belt-journey" aria-labelledby="belts-heading" className="scroll-mt-5 border-t border-border pt-6 md:pt-8 mb-8 md:mb-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="belts-heading" className="text-[22px] md:text-xl leading-[1.4] font-bold text-primary">Your belts</h2>
        <Link to="/history" className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">Practice history ↗</Link>
      </div>
      <p className="paper-note mt-2 mb-5">The dates you reached each belt.</p>

      <ol ref={trackRef} aria-label="Belt record" className="relative flex md:grid md:grid-cols-5 gap-2 overflow-x-auto">
        {RANKS.map((rank) => {
          const date = reachedAt.get(rank)
          const current = rank === belt.rank
          return (
            <li key={rank} aria-current={current ? 'step' : undefined} className="w-42 md:w-auto shrink-0">
              <button
                type="button"
                aria-pressed={selected === rank}
                onClick={() => setSelected(rank)}
                className={`flex flex-col justify-start w-full h-full px-3 pt-3 pb-4 text-center border-b-2 ${
                  selected === rank ? 'bg-surface border-primary' : 'border-transparent'
                }`}
              >
                <img src={artUrl(`belt-${rank}`)} alt="" className="mx-auto w-full max-w-38" />
                <strong className="block mt-3 text-[15px] font-medium text-primary capitalize">{rank}</strong>
                <span className="paper-note block mt-1">{rankStatus(rank, belt.rank, Boolean(date))}</span>
                {date && <time dateTime={date} className="paper-note block mt-1 tabular-nums">{formatDate(date)}</time>}
              </button>
            </li>
          )
        })}
      </ol>
      <p className="paper-note mt-3 md:hidden">Scroll to explore all five belts.</p>

      <div aria-live="polite" className="flex max-md:flex-col md:items-baseline gap-x-20 gap-y-1 py-5 border-b border-border">
        <h3 className="text-[17px] font-medium text-primary capitalize">
          {selected} belt {selected === belt.rank && <span className="paper-note normal-case ml-2">Current</span>}
        </h3>
        <p className="text-[15px] text-secondary">{beltDetail(selected, reachedAt.get(selected), next?.rank)}</p>
      </div>

      <BeltCriteria belt={belt} next={next} />

      <details className="border-b border-border py-4 group">
        <summary className="font-mono text-[12px] text-primary cursor-pointer">How advancement works</summary>
        <div className="paper-body mt-3 grid gap-2 max-w-2xl">
          <p>A belt follows four things: kata completed, topic clusters, active days in the last 30, and days at your current belt.</p>
          <p>Any finished kata counts, Needs work included. The sensei's verdict never decides a belt.</p>
          <p>Belts stay with you when a streak ends.</p>
        </div>
      </details>
    </section>
  )
}

function BeltCriteria({ belt, next }: Readonly<Pick<BeltRecordProps, 'belt' | 'next'>>) {
  return (
    <section aria-labelledby="criteria-heading" className="pt-6">
      <h3 id="criteria-heading" className="paper-eyebrow pb-2.5">
        {next ? `Next · ${next.rank} belt` : 'Your practice'}
      </h3>
      <dl className="border-t border-border">
        {FACTORS.map(({ key, label }) => (
          <div key={key} className="ruled-row items-baseline gap-4 py-2.5">
            <dt className="text-sm text-secondary">{label}</dt>
            <dd className="flex items-baseline gap-3">
              <span className="font-mono text-base text-primary tabular-nums">{belt.factors[key]}</span>
              {next && <span className="paper-note tabular-nums">Asks for {next.criteria[key]}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
