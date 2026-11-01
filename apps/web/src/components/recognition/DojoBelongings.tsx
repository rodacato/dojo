import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { artUrl, type Belonging } from './belongings'
import { formatDate } from './BeltRecord'

const SECTION_TITLE = 'text-[22px] md:text-xl leading-[1.4] font-bold text-primary'

export function DojoBelongings({ belongings }: Readonly<{ belongings: Belonging[] }>) {
  const [open, setOpen] = useState<Belonging | null>(null)

  return (
    <>
      <section aria-labelledby="moments-heading" className="mb-10">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 id="moments-heading" className={SECTION_TITLE}>Moments</h2>
          <Link to="/history" className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">History ↗</Link>
        </div>
        {belongings.length === 0 ? (
          <div className="border-t border-border pt-5">
            <p className="paper-body">Your first practice will leave the first mark.</p>
            <p className="paper-note mt-1">There is nothing to catch up on.</p>
          </div>
        ) : (
          <ul className="border-t border-border">
            {belongings.map((belonging) => (
              <li key={belonging.id} className="border-b border-border">
                <button type="button" onClick={() => setOpen(belonging)} className="w-full flex items-center gap-4 md:gap-6 py-3 text-left">
                  <img src={artUrl(belonging.art)} alt="" className="w-16 md:w-20 h-14 object-contain shrink-0" />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[15px] font-medium text-primary">{belonging.moment}</strong>
                    <span className="paper-note block mt-1">{belonging.name} earned</span>
                    <time dateTime={belonging.earnedAt} className="paper-note block mt-1 md:hidden tabular-nums">{formatDate(belonging.earnedAt)}</time>
                  </span>
                  <time dateTime={belonging.earnedAt} className="paper-note max-md:hidden tabular-nums">{formatDate(belonging.earnedAt)}</time>
                  <span aria-hidden className="text-accent">↗</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="belongings-heading" className="mb-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="belongings-heading" className={SECTION_TITLE}>Your belongings</h2>
          <p className="paper-note tabular-nums">{belongings.length} in your room</p>
        </div>
        <p className="paper-note mt-2 mb-4">Each object records a practice moment.</p>
        {belongings.length === 0 ? (
          <p className="paper-body border-t border-border pt-5">A little space for the practice ahead.</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {belongings.map((belonging) => (
              <li key={belonging.id} className="border-y border-border">
                <button type="button" onClick={() => setOpen(belonging)} className="w-full h-full p-2 pb-4 text-left">
                  <img src={artUrl(belonging.art)} alt="" className="mx-auto h-20 object-contain" />
                  <strong className="block mt-3 text-[15px] font-medium text-primary">{belonging.name}</strong>
                  <span className="paper-note block mt-1">In your room</span>
                  <span className="paper-note block mt-2 text-accent">View <span aria-hidden>↗</span></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={open !== null} onClose={() => setOpen(null)} label={open?.name}>
        {open && (
          <div className="grid gap-2">
            <img src={artUrl(open.art)} alt="" className="mx-auto h-28 object-contain" />
            <h2 className={SECTION_TITLE}>{open.name}</h2>
            <p className="paper-eyebrow">{open.moment}</p>
            <p className="paper-body">{open.story}</p>
            <p className="paper-note">Earned {formatDate(open.earnedAt)}</p>
          </div>
        )}
      </Modal>
    </>
  )
}
