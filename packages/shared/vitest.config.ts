import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'], // lcov → coverage/lcov.info for SonarQube
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      // Enforced floor — this package is Zod schemas + types, so 100%
      // lines/functions is the mechanism that forces a smoke test per runtime
      // export (the S033 mandate). Branches sit at 90: exhaustive testing of
      // every refine/optional path is beyond a smoke test. Ratchets up, never
      // silently regresses. Neutralized in the Sonar job via the same flag.
      thresholds: process.env['VITEST_NO_COVERAGE_THRESHOLD']
        ? undefined
        : { lines: 100, statements: 100, functions: 100, branches: 90 },
    },
  },
})
