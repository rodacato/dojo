// Canonical list of Piston runtimes this product depends on.
// Source of truth — `PistonRuntimeProvisioner` reads from here, and the
// emergency fallback `scripts/piston-reprovision.sh` mirrors the same list.
// A vitest gate (piston-runtimes.parity.test.ts) asserts the two stay
// in sync so the bash script can't silently drift.
//
// Runtime version status: blocked upstream. The pinned engineer-man/piston
// image ships go=1.16.2, ruby up to 3.0.1, rust up to 1.68.2. Bumping
// requires either a maintained fork or a custom image layer (tracked in
// docs/sprints/backlog.md).
//
// Multi-version note: Python 3.10 sits alongside 3.12 because `match`
// pedagogy wants 3.10+ and the course framework targets 3.11+.

export interface PistonRuntimeSpec {
  language: string
  version: string
}

export const PISTON_RUNTIMES: readonly PistonRuntimeSpec[] = [
  { language: 'go', version: '1.16.2' },
  { language: 'python', version: '3.10.0' },
  { language: 'python', version: '3.12.0' },
  { language: 'ruby', version: '3.0.1' },
  { language: 'rust', version: '1.68.2' },
  { language: 'sqlite3', version: '3.36.0' },
  { language: 'typescript', version: '5.0.3' },
] as const
