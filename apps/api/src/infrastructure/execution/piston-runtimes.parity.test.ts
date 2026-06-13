import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PISTON_RUNTIMES } from './piston-runtimes'

// The bash fallback at scripts/piston-reprovision.sh duplicates the runtime
// list so it can run when the API itself is unreachable. This test asserts
// the two stay byte-equivalent so the duplication can't silently drift.
describe('piston-runtimes parity', () => {
  it('matches the runtime list in scripts/piston-reprovision.sh', () => {
    const scriptPath = resolve(__dirname, '../../../../../scripts/piston-reprovision.sh')
    const script = readFileSync(scriptPath, 'utf8')

    const arrayMatch = script.match(/RUNTIMES=\(([^)]*)\)/)
    expect(arrayMatch, 'RUNTIMES=(...) block not found in bash script').not.toBeNull()

    const bashEntries = arrayMatch![1]!
      .split('\n')
      .map((line) => line.replace(/#.*$/, '').trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^"|"$/g, ''))
      .map((entry) => {
        const [language, version] = entry.split(/\s+/)
        return { language: language!, version: version! }
      })

    expect(bashEntries).toEqual([...PISTON_RUNTIMES])
  })
})
