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
      include: ['src/**/*.ts'],
      exclude: [
        'src/test/**',
        'src/**/*.test.ts',
        'src/infrastructure/**',
        'src/index.ts',
        'src/config.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
})
