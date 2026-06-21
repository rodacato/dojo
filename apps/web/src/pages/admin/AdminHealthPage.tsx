import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { AdminBreadcrumb } from './_form-parts'

type HealthData = Awaited<ReturnType<typeof api.getAdminHealth>>

export function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [reprovisioning, setReprovisioning] = useState(false)
  const [reprovisionNotice, setReprovisionNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setData(await api.getAdminHealth())
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  async function onReprovision() {
    setReprovisioning(true)
    setReprovisionNotice(null)
    try {
      const report = await api.reprovisionPiston()
      setReprovisionNotice(
        `${report.installed.length} installed · ${report.skipped.length} skipped · ${report.failed.length} failed`,
      )
      await load()
    } catch (e) {
      setReprovisionNotice(
        `Reprovision request died: ${e instanceof Error ? e.message : String(e)}. ` +
          `The install may still be running on the server — refresh in ~2 min.`,
      )
    } finally {
      setReprovisioning(false)
    }
  }

  return (
    <div className="max-w-7xl">
      <AdminBreadcrumb trail={['ADMIN', 'HEALTH']} />

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-primary leading-tight">Health</h1>
          <div className="mt-1 text-sm text-muted">
            Subsystem liveness — API, database, Piston runtimes, LLM adapter.
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={load} loading={loading}>
          ↻ Refresh
        </Button>
      </div>

      {loadError && (
        <div className="rounded-md border border-border border-l-4 border-l-danger bg-surface px-4 py-3 mb-6">
          <div className="font-mono text-xs uppercase tracking-wider text-danger mb-1">
            Load failed
          </div>
          <div className="text-sm text-secondary">{loadError}</div>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <Card
            title="API"
            status={data.api.status}
            latencyMs={data.api.latencyMs}
            primary={`env: ${data.api.detail.env}`}
          />

          <Card
            title="Database"
            status={data.db.status}
            latencyMs={data.db.latencyMs}
            primary={data.db.status === 'ok' ? 'Postgres reachable' : 'Postgres unreachable'}
            secondary={data.db.detail.error ?? null}
          />

          <Card
            title="Piston"
            status={data.piston.status}
            latencyMs={data.piston.latencyMs}
            primary={
              data.piston.detail.error
                ? `Unreachable — ${data.piston.detail.error}`
                : `${data.piston.detail.actual.length} of ${data.piston.detail.expected.length} runtimes installed`
            }
            secondary={
              data.piston.detail.missing.length > 0
                ? `Missing: ${data.piston.detail.missing.map(rtLabel).join(', ')}`
                : data.piston.detail.extra.length > 0
                  ? `Extra (not in canonical list): ${data.piston.detail.extra.map(rtLabel).join(', ')}`
                  : null
            }
            action={
              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReprovision}
                  loading={reprovisioning}
                  title="Idempotent install of every missing runtime"
                >
                  ↻ Reprovision
                </Button>
                {reprovisionNotice && (
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">
                    {reprovisionNotice}
                  </span>
                )}
              </div>
            }
          >
            {data.piston.detail.actual.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 mt-3 font-mono text-xs text-secondary">
                {data.piston.detail.actual.map((rt) => (
                  <li key={rtLabel(rt)} className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <span>{rtLabel(rt)}</span>
                  </li>
                ))}
                {data.piston.detail.missing.map((rt) => (
                  <li key={`m-${rtLabel(rt)}`} className="flex items-center gap-2">
                    <span className="text-danger">✗</span>
                    <span className="text-muted">{rtLabel(rt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="LLM"
            status={data.llm.status}
            latencyMs={data.llm.latencyMs}
            primary={`adapter: ${data.llm.detail.adapter} ${
              data.llm.detail.configured ? '(key configured)' : '(API key missing)'
            }`}
            secondary={
              data.llm.detail.adapter === 'mock'
                ? 'Mock adapter — no external calls, no token cost.'
                : 'Not probed live to avoid token cost. Configured = env var is set.'
            }
          />
        </div>
      )}

      <div className="mt-6 font-mono text-xs uppercase tracking-wider text-muted">
        Health page is on-demand only — not a substitute for a real external check on /health.
      </div>
    </div>
  )
}

function Card({
  title,
  status,
  latencyMs,
  primary,
  secondary,
  action,
  children,
}: Readonly<{
  title: string
  status: 'ok' | 'down' | 'unconfigured'
  latencyMs: number | null
  primary: string
  secondary?: string | null
  action?: React.ReactNode
  children?: React.ReactNode
}>) {
  const dot =
    status === 'ok'
      ? 'bg-success'
      : status === 'unconfigured'
        ? 'bg-muted'
        : 'bg-danger'
  const label = status === 'ok' ? 'OK' : status === 'unconfigured' ? 'UNCONFIGURED' : 'DOWN'
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${dot}`}
              aria-hidden="true"
            />
            <h2 className="text-base font-medium text-primary">{title}</h2>
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              {label}
              {latencyMs === null ? '' : ` · ${latencyMs}ms`}
            </span>
          </div>
          <div className="text-sm text-secondary">{primary}</div>
          {secondary && (
            <div className="text-sm text-muted mt-1">{secondary}</div>
          )}
          {children}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

function rtLabel(rt: { language: string; version: string }): string {
  return `${rt.language} ${rt.version}`
}
