export const SESSION_LIMIT_PER_ROLE = {
  ADMIN: 5,
  USER: 3,
} as const

export const DEFAULT_MAX_SESSIONS = 3
export const SESSION_EXPIRY_DAYS = 30
export const SESSION_EXPIRY_MS = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000

export const AUTH_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const
