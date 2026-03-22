import { useNavigate } from 'react-router-dom'
import { LogoWordmark } from '../components/Logo'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background 404 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="font-mono text-[20rem] text-surface/80 leading-none">404</span>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-muted text-xs font-mono uppercase tracking-wider">error</span>
        </div>

        <h1 className="font-mono text-2xl md:text-3xl text-primary mb-3">
          This path doesn't exist.<span className="text-accent animate-pulse">|</span>
        </h1>
        <p className="text-secondary text-sm mb-10">
          Which, honestly, is a perfectly valid state for a developer to be in.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
          >
            ← Back to the dojo
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 border border-border text-secondary font-mono text-sm rounded-sm hover:border-accent hover:text-primary transition-colors"
          >
            Go home
          </button>
        </div>

        {/* Terminal flavor */}
        <div className="mt-16 text-left mx-auto max-w-xs">
          <p className="text-muted/30 font-mono text-[10px] leading-relaxed">
            $ ls -la /dojo/{window.location.pathname}<br />
            ls: cannot access: No such file or directory<br />
            $ _
          </p>
        </div>
      </div>

      {/* Nav */}
      <div className="absolute top-5 left-8">
        <LogoWordmark />
      </div>
    </div>
  )
}
