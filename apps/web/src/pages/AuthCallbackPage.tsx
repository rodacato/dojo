import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken } from '../lib/auth-token'
import { LogoMark } from '../components/Logo'
import { Button } from '../components/ui/Button'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      setToken(token)
      navigate('/dashboard', { replace: true })
      return
    }
    // No token = handshake didn't carry a credential. Show the error
    // state on this page (1.5s) before bouncing to landing — otherwise
    // the user lands back on `/` with no explanation of what happened.
    setFailed(true)
    const handle = setTimeout(() => navigate('/?error=auth', { replace: true }), 1500)
    return () => clearTimeout(handle)
  }, [params, navigate])

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-120 flex flex-col items-center text-center gap-10">
        <div className="flex flex-col items-center gap-4">
          <LogoMark size={32} className="text-accent" />
          <span className="font-mono font-bold text-primary text-3xl inline-flex items-center select-none">
            dojo<span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
          </span>
        </div>

        {failed ? (
          <div className="flex flex-col items-center gap-4">
            <p className="font-mono text-[13px] text-danger">
              Auth_Failed: handshake timeout.
            </p>
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/?error=auth', { replace: true })}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10 w-full">
            <p className="font-mono text-[15px] text-secondary inline-flex items-center">
              Completing sign-in.
              <span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
            </p>
            <div
              className="relative h-0.5 w-60 bg-elevated overflow-hidden"
              role="progressbar"
              aria-label="Completing sign-in"
            >
              <span className="absolute top-0 h-full w-1/3 bg-accent animate-auth-progress" />
            </div>
          </div>
        )}
      </div>

      <p className="absolute bottom-8 font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
        {failed ? 'Connection terminated' : 'GitHub OAuth — state: verifying nonce'}
      </p>
    </div>
  )
}
