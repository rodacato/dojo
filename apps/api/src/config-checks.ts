const DEV_SESSION_SECRET_PREFIX = 'dev-secret-change-me'

export function insecureProductionSettings(env: { NODE_ENV: string; SESSION_SECRET: string }): string[] {
  if (env.NODE_ENV !== 'production') return []
  if (env.SESSION_SECRET.startsWith(DEV_SESSION_SECRET_PREFIX)) {
    return ['SESSION_SECRET is still the development value from .env.example; generate one with `openssl rand -hex 32`']
  }
  return []
}

export function mailSettingsProblems(env: { RESEND_API_KEY: string; RESEND_FROM_EMAIL: string }): string[] {
  if (env.RESEND_API_KEY && !env.RESEND_FROM_EMAIL) {
    return ['RESEND_API_KEY is set but RESEND_FROM_EMAIL is not; set a sender you have verified in Resend, e.g. dojo <noreply@your-domain>']
  }
  return []
}
