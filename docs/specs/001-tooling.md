# Spec 001 — Tooling

**Experts:** Tomás Ríos (ESLint), Hiroshi Nakamura (Vitest), Marta Kowalczyk (env validation)
**Depends on:** nothing — implement first
**Blocks:** all other phases

## What and Why

Three independent pieces of tooling that must exist before any feature code:

1. **ESLint + Prettier** — linting with architectural boundary enforcement via `import/no-cycle`
2. **Vitest** — test runner configured for the layered architecture
3. **Env validation** — Zod schema that crashes the API at startup if secrets are missing or invalid

## Scope

**In:** ESLint config, Prettier config, Vitest workspace config, `src/config.ts`, turbo task wiring
**Out:** any test files (those belong to the spec of the thing being tested), any application code, CI configuration (Phase 7)

---

## 1. ESLint + Prettier

### Files to create

**`/workspaces/dojo/eslint.config.js`**

```js
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**'],
  },
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-cycle': 'error',        // ← enforces DDD layer boundaries
      'import/no-self-import': 'error',
    },
  },
  prettier,                              // ← must be last: disables formatting rules
)
```

**`/workspaces/dojo/.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

**`/workspaces/dojo/.prettierignore`**

```
dist/
node_modules/
pnpm-lock.yaml
*.md
```

### Packages to add

Root `package.json` devDependencies:
```
eslint@^9.0.0
typescript-eslint@^8.0.0
eslint-plugin-import@^2.31.0
eslint-config-prettier@^9.0.0
```

### Scripts to add

- Root `package.json`: `"lint": "turbo lint"` (already exists via turbo)
- `apps/api/package.json`: `"lint": "eslint src --max-warnings 0"`
- `apps/web/package.json`: `"lint": "eslint src --max-warnings 0"`
- `packages/shared/package.json`: `"lint": "eslint src --max-warnings 0"`

Add to `apps/web/package.json` devDependencies:
```
eslint-plugin-react-hooks@^5.0.0
eslint-plugin-react-refresh@^0.4.0
```

---

## 2. Vitest

### Files to create

**`/workspaces/dojo/vitest.workspace.ts`**

```ts
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/api/vitest.config.ts',
])
```

**`/workspaces/dojo/apps/api/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/test/**', 'src/**/*.test.ts', 'src/infrastructure/**'],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
})
```

> Coverage thresholds apply only to `domain/` and `application/` layers (infrastructure excluded). Domain code is pure — 80% is the floor, not the ceiling.

**`/workspaces/dojo/apps/api/src/test/setup.ts`**

```ts
import { vi } from 'vitest'

// Ensure env vars are set for tests so config.ts doesn't crash
process.env['DATABASE_URL'] = 'postgresql://dojo:dojo@localhost:5432/dojo_test'
process.env['SESSION_SECRET'] = 'test-secret-minimum-32-characters-long'
process.env['GITHUB_CLIENT_ID'] = 'test-client-id'
process.env['GITHUB_CLIENT_SECRET'] = 'test-client-secret'
process.env['LLM_BASE_URL'] = 'http://localhost:11434'
process.env['LLM_API_KEY'] = 'test-api-key'
process.env['WEB_URL'] = 'http://localhost:5173'
```

### Packages to add

Root `package.json` devDependencies:
```
vitest@^2.0.0
@vitest/coverage-istanbul@^2.0.0
```

`apps/api/package.json` devDependencies:
```
vitest@^2.0.0
@vitest/coverage-istanbul@^2.0.0
```

Scripts in `apps/api/package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### turbo.json changes

Add the `test` task:
```json
"test": {
  "dependsOn": ["^build"],
  "outputs": ["coverage/**"],
  "inputs": ["src/**/*.ts", "vitest.config.ts"]
}
```

---

## 3. Environment Validation

### File to create

**`/workspaces/dojo/apps/api/src/config.ts`**

```ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  LLM_BASE_URL: z.string().url(),
  LLM_API_KEY: z.string().min(1),
  LLM_MODEL: z.string().default('claude-sonnet-4-20250514'),
  DRAWHAUS_URL: z.string().url().optional(),
  API_PORT: z.coerce.number().default(3001),
  WEB_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Invalid environment variables:')
  console.error(result.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = result.data
export type Config = typeof config
```

### File to modify

**`/workspaces/dojo/apps/api/src/index.ts`**

Add as the very first import:
```ts
import './config'  // validates env at startup before anything else runs
```

### .env.example update

Ensure all vars are present with comments. Current `.env.example` already has the right vars — just verify `WEB_URL` is included:
```
WEB_URL=http://localhost:5173
```

---

## Acceptance Criteria

- [ ] `pnpm lint` passes with 0 warnings across all workspaces
- [ ] `pnpm --filter=@dojo/api test` runs (no test files yet — 0 tests is OK, runner must not error)
- [ ] `pnpm --filter=@dojo/api test:coverage` runs without error
- [ ] Starting the API without `SESSION_SECRET` set crashes immediately with a readable error
- [ ] Starting the API with `SESSION_SECRET` shorter than 32 chars crashes with a readable error
- [ ] An intentional circular import between two files is caught by `pnpm lint`

## Out of Scope

- Writing actual test files (those belong to each domain spec)
- Web app testing setup (Vitest for the frontend is a future concern)
- Pre-commit hooks (not needed for Phase 0 — CI covers this)
