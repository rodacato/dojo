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
