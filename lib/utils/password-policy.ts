/**
 * Valida que la contraseña cumpla con las políticas de seguridad institucional:
 * - Al menos 8 caracteres
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos un número (0-9)
 * - Al menos un carácter especial
 *
 * NOTA: Esta función es isomórfica (cliente y servidor) y NO importa módulos de Node.js (crypto).
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
