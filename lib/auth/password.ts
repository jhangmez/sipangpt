import crypto from 'crypto'

/**
 * Valida que la contraseña cumpla con las políticas de seguridad institucional:
 * - Al menos 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos un número
 * - Al menos un carácter especial
 */
export function validatePasswordPolicy(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula (A-Z).' }
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un número (0-9).' }
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (ej. !@#$%^&*).' }
  }
  return { isValid: true }
}

/**
 * Hashea una contraseña usando scrypt nativo con salt seguro.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifica una contraseña contra el hash almacenado.
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
