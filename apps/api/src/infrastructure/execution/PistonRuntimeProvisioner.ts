import { PISTON_RUNTIMES, type PistonRuntimeSpec } from './piston-runtimes'

export interface ProvisionResult {
  installed: PistonRuntimeSpec[]
  skipped: PistonRuntimeSpec[]
  failed: Array<PistonRuntimeSpec & { error: string }>
  runtimes: PistonRuntimeSpec[]
}

export interface RuntimeStatus {
  reachable: boolean
  error: string | null
  expected: PistonRuntimeSpec[]
  actual: PistonRuntimeSpec[]
  missing: PistonRuntimeSpec[]
  extra: PistonRuntimeSpec[]
}

// Each runtime install hits the Piston package API which downloads + extracts
// a tarball into the persisted volume. Sized to cover the slowest (rust) on
// a cold start without false aborts.
const INSTALL_TIMEOUT_MS = 120_000
const LIST_TIMEOUT_MS = 5_000

export class PistonRuntimeProvisioner {
  constructor(private readonly url: string) {}

  // Idempotent: every runtime in PISTON_RUNTIMES is checked against the live
  // Piston instance. Missing ones are installed via POST /api/v2/packages.
  // Returns a per-runtime breakdown so the admin UI can render a real report
  // instead of a generic ok/fail.
  async provision(): Promise<ProvisionResult> {
    const installedNow = await this.fetchInstalled()

    const skipped: PistonRuntimeSpec[] = []
    const installed: PistonRuntimeSpec[] = []
    const failed: Array<PistonRuntimeSpec & { error: string }> = []

    for (const spec of PISTON_RUNTIMES) {
      if (isInstalled(installedNow, spec)) {
        skipped.push(spec)
        continue
      }

      try {
        await this.installRuntime(spec)
        installed.push(spec)
      } catch (err) {
        failed.push({ ...spec, error: err instanceof Error ? err.message : String(err) })
      }
    }

    const runtimes = await this.fetchInstalled().catch(() => installedNow)
    return { installed, skipped, failed, runtimes }
  }

  // Idle read for the admin UI: what does Piston currently have vs the
  // canonical list. Never throws — a transport failure is surfaced as
  // reachable:false so the panel can render "unreachable" instead of 500.
  async status(): Promise<RuntimeStatus> {
    const expected = [...PISTON_RUNTIMES]
    let actual: PistonRuntimeSpec[] = []
    let error: string | null = null
    let reachable = true
    try {
      actual = await this.fetchInstalled()
    } catch (err) {
      reachable = false
      error = err instanceof Error ? err.message : String(err)
    }
    const missing = expected.filter((e) => !isInstalled(actual, e))
    const extra = actual.filter((a) => !isInstalled(expected, a))
    return { reachable, error, expected, actual, missing, extra }
  }

  private async fetchInstalled(): Promise<PistonRuntimeSpec[]> {
    const res = await fetch(`${this.url}/api/v2/runtimes`, {
      signal: AbortSignal.timeout(LIST_TIMEOUT_MS),
    })
    if (!res.ok) {
      throw new Error(`Piston runtimes endpoint returned ${res.status} ${res.statusText}`)
    }
    const raw = (await res.json()) as Array<{ language: string; version: string }>
    return raw.map(({ language, version }) => ({ language, version }))
  }

  private async installRuntime(spec: PistonRuntimeSpec): Promise<void> {
    const res = await fetch(`${this.url}/api/v2/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spec),
      signal: AbortSignal.timeout(INSTALL_TIMEOUT_MS),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `Piston install ${spec.language} ${spec.version} → HTTP ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`,
      )
    }
  }
}

function isInstalled(haystack: PistonRuntimeSpec[], needle: PistonRuntimeSpec): boolean {
  return haystack.some((r) => r.language === needle.language && r.version === needle.version)
}
