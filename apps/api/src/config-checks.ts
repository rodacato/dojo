const DEV_SESSION_SECRET_PREFIX = 'dev-secret-change-me'

export function insecureProductionSettings(env: { NODE_ENV: string; SESSION_SECRET: string }): string[] {
  if (env.NODE_ENV !== 'production') return []
  if (env.SESSION_SECRET.startsWith(DEV_SESSION_SECRET_PREFIX)) {
    return ['SESSION_SECRET is still the development value from .env.example; generate one with `openssl rand -hex 32`']
  }
  return []
}
