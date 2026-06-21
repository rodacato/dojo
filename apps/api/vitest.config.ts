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
        // Dev CLIs (calibrate-sensei, validate-scroll-solutions) — run by hand,
        // not business logic; they only drag the denominator.
        'src/scripts/**',
        // Data-as-code and generated/glue — not coverage-worthy. The rest of
        // infrastructure (http, execution, events, llm) IS exercised by tests.
        'src/infrastructure/persistence/seed*.ts',
        'src/infrastructure/persistence/katas/**',
        'src/infrastructure/persistence/drizzle/**',
        'src/infrastructure/persistence/migrate.ts',
      ],
      // Enforced floor — ratchets up as coverage rises, never silently
      // regresses. Set just under the current measured number (S033 Phase 1
      // brought every HTTP route under test: ~63% lines / ~54% branches).
      // Neutralized in the Sonar job (which only reports) via
      // VITEST_NO_COVERAGE_THRESHOLD.
      thresholds: process.env.VITEST_NO_COVERAGE_THRESHOLD
        ? undefined
        : { lines: 80, statements: 80, functions: 70, branches: 72 },
    },
  },
})
