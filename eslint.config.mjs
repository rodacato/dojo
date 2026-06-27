import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import sonarjs from 'eslint-plugin-sonarjs'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'],
  },
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    // SonarJS baseline. The recommended set is active so NEW code is gated, but
    // the rules below already have a pre-existing backlog or are false-positives
    // the SonarQube server triages as Safe. They're parked here so the gate stays
    // green on adoption; clear each backlog with /quality-sweep, then delete its
    // line to ratchet the rule back to error. Counts are the adoption baseline.
    rules: {
      // Redundant with @typescript-eslint/no-unused-vars (configured below) — off for good.
      'sonarjs/no-unused-vars': 'off',
      // False-positives the server marks Safe (ReDoS FPs, localhost fixtures, UI randomness).
      'sonarjs/super-linear-regex': 'off', // 9 — ReDoS false-positives
      'sonarjs/no-hardcoded-ip': 'off', // 4 — test fixtures / localhost
      'sonarjs/pseudo-random': 'off', // 2 — Math.random in UI only
      'sonarjs/no-clear-text-protocols': 'off', // 3 — http://localhost in dev/test
      // Real backlog — clear via /quality-sweep, then remove to re-enable.
      'sonarjs/void-use': 'off', // 9
      'sonarjs/public-static-readonly': 'off', // 5
      'sonarjs/no-nested-conditional': 'off', // 3
      'sonarjs/todo-tag': 'off', // 3
      'sonarjs/prefer-specific-assertions': 'off', // 3
      'sonarjs/no-identical-functions': 'off', // 2
      'sonarjs/cognitive-complexity': 'off', // 1
      'sonarjs/no-nested-template-literals': 'off', // 1
      'sonarjs/no-extra-arguments': 'off', // 1
      'sonarjs/hashing': 'off', // 1
      'sonarjs/generator-without-yield': 'off', // 1
      'sonarjs/assertions-in-tests': 'off', // 1
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    plugins: { import: importPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
    },
  },
  prettier,
)
