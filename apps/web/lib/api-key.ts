import crypto from 'crypto'

export type ApiKeyEnvironment = 'PRODUCTION' | 'DEVELOPMENT'

export interface GeneratedApiKey {
  /** Full raw key — shown to user ONCE, never stored. */
  raw: string
  /** SHA-256 hex digest of raw key — stored in DB. */
  hash: string
  /** First 14 chars of raw key — stored for display, NOT for lookup. */
  prefix: string
}

/**
 * Generate a new API key.
 *
 * Format: ak_live_<22 base64url chars>  (production)
 *         ak_test_<22 base64url chars>  (development)
 *
 * Security: 22 base64url chars = 16 random bytes = 128 bits entropy.
 * SHA-256 is appropriate (not bcrypt) — these are machine-generated high-entropy
 * secrets, not user passwords.
 */
export function generateApiKey(env: ApiKeyEnvironment = 'PRODUCTION'): GeneratedApiKey {
  const envPrefix = env === 'PRODUCTION' ? 'ak_live_' : 'ak_test_'
  const random = crypto.randomBytes(16).toString('base64url')
  const raw = envPrefix + random
  const hash = hashApiKey(raw)
  const prefix = raw.slice(0, 14)
  return { raw, hash, prefix }
}

/** SHA-256 hex digest. Used for both storage and lookup. */
export function hashApiKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/** True if token looks like an AutoCSR API key (not the global INFERENCE_API_SECRET). */
export function isApiKey(token: string): boolean {
  return token.startsWith('ak_live_') || token.startsWith('ak_test_')
}
