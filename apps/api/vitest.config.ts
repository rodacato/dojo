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
        'src/index.ts',
        'src/config.ts',
        'src/infrastructure/container.ts',
        // Data-as-code and generated/glue — not coverage-worthy. The rest of
        // infrastructure (http, execution, events, llm) IS exercised by tests.
        'src/infrastructure/persistence/seed*.ts',
        'src/infrastructure/persistence/katas/**',
        'src/infrastructure/persistence/drizzle/**',
        'src/infrastructure/persistence/migrate.ts',
      ],
      // Disabled when feeding Sonar so a low number reports instead of failing.
      thresholds: process.env.VITEST_NO_COVERAGE_THRESHOLD
        ? undefined
        : { lines: 80, branches: 80 },
    },
  },
})
