import { useState, useEffect } from 'react'

export function App() {
  const [health, setHealth] = useState<string>('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d.status))
      .catch(() => setHealth('offline'))
  }, [])

  return (
    <div
      style={{
        background: '#0F172A',
        color: '#F8FAFC',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>dojo_</h1>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>dojo.notdefined.dev</p>
        <p style={{ color: '#6366F1', fontSize: '0.75rem', marginTop: '2rem' }}>api: {health}</p>
      </div>
    </div>
  )
}
