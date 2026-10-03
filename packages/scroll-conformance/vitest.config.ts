import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/testing/**',
        'src/index.ts',
        // Needs a real Chromium, which does not start in the devcontainer; the fake driver stands in for it.
        'src/playwright-driver.ts',
        // Wires process.argv and the real driver into runCli.
        'src/bin.ts',
      ],
      thresholds: process.env['VITEST_NO_COVERAGE_THRESHOLD']
        ? undefined
        : { lines: 100, statements: 100, functions: 100, branches: 90 },
    },
  },
})
