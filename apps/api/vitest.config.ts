import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    passWithNoTests: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'], // lcov → coverage/lcov.info for SonarQube
      include: ['src/**/*.ts'],
      exclude: [
        'src/test/**',
        'src/**/*.test.ts',
        'src/infrastructure/**',
        'src/index.ts',
        'src/config.ts',
      ],
      // Disabled when feeding Sonar so a low number reports instead of failing.
      thresholds: process.env.VITEST_NO_COVERAGE_THRESHOLD
        ? undefined
        : { lines: 80, branches: 80 },
    },
  },
})
