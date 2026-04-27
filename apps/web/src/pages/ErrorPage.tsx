interface ErrorPageProps {
  message?: string
}

export function ErrorPage({ message }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-6 px-4">
      <p className="font-mono text-muted text-sm">something went wrong</p>
      {message && (
        <p className="text-secondary text-sm text-center max-w-sm">{message}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => { window.location.href = '/dashboard' }}
          className="px-4 py-2 bg-surface border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
        >
          Return to dashboard
        </button>
      </div>
    </div>
  )
}
