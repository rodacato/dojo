export function KumitePlaceholderPage() {
  return (
    <div className="px-4 md:px-6 py-16 max-w-3xl mx-auto">
      <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted mb-4">
        Coming soon
      </p>
      <h1 className="text-primary text-3xl md:text-[40px] font-semibold leading-tight tracking-tight mb-6">
        Kumite
      </h1>
      <p className="text-secondary text-lg leading-relaxed mb-4">
        Kumite is sparring. One kata, two developers, the same prompt, side-by-side reasoning. The
        sensei reads both attempts and marks where each one earned its conclusion.
      </p>
      <p className="text-muted leading-relaxed mb-8">
        Not built yet. The route exists so the language is honest: kumite is a feature, not a label
        for the leaderboard. When the matchmaking and the paired evaluation are ready, this page
        will host them.
      </p>
      <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted opacity-70">
        Until then — practice solo.
      </p>
    </div>
  )
}
