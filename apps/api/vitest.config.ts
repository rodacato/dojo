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
      // Enforced floor = the honest measured number (S033), not aspiration —
      // set just under current so it ratchets up, never silently regresses.
      // The integration tests mock the DB, so there is no hidden coverage a
      // CI postgres would unlock; 33%/21% is the real number. Raising it is
      // the S034 testing-backbone work. Neutralized in the Sonar job (which
      // only reports) via VITEST_NO_COVERAGE_THRESHOLD.
      thresholds: process.env.VITEST_NO_COVERAGE_THRESHOLD
        ? undefined
        : { lines: 32, statements: 30, functions: 29, branches: 20 },
    },
  },
})
