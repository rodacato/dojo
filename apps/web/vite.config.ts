import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Bundle @dojo/shared from its TypeScript source.
//
// The package publishes a CJS dist/ for the API runtime (commit 2f363bc).
// In production builds (NODE_ENV=production) Vite skips the `development`
// export condition and resolves to `dist/index.js`, which uses tsc's
// `__exportStar` runtime helper. Rollup cannot statically analyze that
// pattern, so `import { TOPICS } from '@dojo/shared'` fails with
// "TOPICS is not exported".
//
// In dev (`pnpm dev`) the `development` condition is honored and Vite
// reads the source, which is why the bug was production-only.
const sharedSrc = fileURLToPath(
  new URL('../../packages/shared/src/index.ts', import.meta.url),
)

// Source maps are uploaded to Sentry only when every required env var is
// present. Missing any one of them — typical for local builds, CI without
// Sentry access — drops the plugin silently; the build still succeeds.
const sentryAuth = process.env['SENTRY_AUTH_TOKEN']
const sentryOrg = process.env['SENTRY_ORG']
const sentryProject = process.env['SENTRY_PROJECT']
const sentryRelease = process.env['VITE_SENTRY_RELEASE'] ?? process.env['SENTRY_RELEASE']
const uploadSourcemaps = !!(sentryAuth && sentryOrg && sentryProject)

export default defineConfig({
  envDir: '../..',
  plugins: [
    react(),
    tailwindcss(),
    ...(uploadSourcemaps
      ? [
          sentryVitePlugin({
            authToken: sentryAuth,
            org: sentryOrg,
            project: sentryProject,
            release: sentryRelease ? { name: sentryRelease } : undefined,
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: { '@dojo/shared': sharedSrc },
  },
  build: {
    sourcemap: uploadSourcemaps,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
            if (id.includes('@codemirror') || id.includes('@lezer')) return 'vendor-codemirror'
            if (id.includes('mermaid') || id.includes('dagre') || id.includes('d3') || id.includes('elkjs')) return 'vendor-mermaid'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
})
