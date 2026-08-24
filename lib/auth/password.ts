import crypto from 'crypto'
export { validatePasswordPolicy } from '@/lib/utils/password-policy'

/**
 * Hashea una contraseña usando scrypt nativo con salt seguro.
 * Solo debe usarse en entorno de servidor / Server Actions.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifica una contraseña contra el hash almacenado.
 * Solo debe usarse en entorno de servidor / Server Actions.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':')
    if (!salt || !key) return false
    const keyBuffer = Buffer.from(key, 'hex')
    const derivedKey = crypto.scryptSync(password, salt, 64)
    return crypto.timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}
