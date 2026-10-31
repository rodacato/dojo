import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/ui/Button'

export function KumitePlaceholderPage() {
  return (
    <div className="paper-container py-8 md:py-12">
      <section className="max-w-3xl">
        <p className="paper-eyebrow mb-4">Coming soon</p>
        <h1 className="paper-heading">Kumite</h1>
        <p className="paper-body max-w-[37.5rem] leading-[1.8] mt-6 md:mt-8">
          Kumite is sparring. One kata, two developers, the same prompt, side-by-side reasoning. The
          sensei reads both attempts and marks where each one earned its conclusion.
        </p>
        <div className="border-t border-border mt-7 pt-6 md:mt-8">
          <p className="paper-note">Until then — practice solo.</p>
          <Link to="/dashboard" className={`${buttonClasses({ size: 'xl' })} mt-4 max-md:w-full`}>
            Practice solo →
          </Link>
        </div>
      </section>
    </div>
  )
}
