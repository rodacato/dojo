// API base URL — injected at build time via VITE_API_URL
// Dev: empty string (Vite proxy or nginx handles /api/ routing)
// Prod: https://dojo-api.notdefined.dev
export const API_URL = import.meta.env['VITE_API_URL'] ?? ''

// WebSocket base URL — derived from API_URL
// Dev: ws://localhost:5173 (or wherever Vite serves)
// Prod: wss://dojo-api.notdefined.dev
export const WS_URL = API_URL
  ? API_URL.replace(/^https/, 'wss').replace(/^http/, 'ws')
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

// Sentry (optional). Empty DSN disables the Sentry browser adapter entirely.
// The environment tag defaults to Vite's build mode — 'development' during
// `pnpm dev`, 'production' during `pnpm build` — so events land in the right
// Sentry environment without extra env vars. Override via
// VITE_SENTRY_ENVIRONMENT when you want to force e.g. 'staging'.
export const SENTRY_DSN = import.meta.env['VITE_SENTRY_DSN'] ?? ''
export const SENTRY_ENVIRONMENT =
  import.meta.env['VITE_SENTRY_ENVIRONMENT'] ?? import.meta.env.MODE
export const SENTRY_RELEASE = import.meta.env['VITE_SENTRY_RELEASE'] ?? ''

// Cloudflare Turnstile site key (public, appears in HTML). When empty
// the playground mounts no widget and the API middleware must also be
// a no-op (TURNSTILE_SECRET_KEY unset). Set VITE_TURNSTILE_SITE_KEY at
// build time — see config/deploy.web.yml builder.args.
export const TURNSTILE_SITE_KEY = import.meta.env['VITE_TURNSTILE_SITE_KEY'] ?? ''
